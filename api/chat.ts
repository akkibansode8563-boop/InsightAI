import { routeAgent, AGENT_REGISTRY } from '../api-lib/agents/AgentOrchestrator.js';
import { retrieveRAGContext } from '../api-lib/rag/advanced-rag.js';
import { findProductImage } from '../api-lib/productImages.js';
import { chatRequestSchema } from '../api-lib/schemas/validation.js';
import { authenticate } from '../api-lib/middleware/auth.js';
import { TOOL_SCHEMAS, executeTool } from '../api-lib/agents/tools.js';
import { logTelemetry, recordMetric } from '../api-lib/telemetry/observability.js';

// --- RATE LIMITING ---
const rateLimitStore = new Map<string, number[]>();
function checkRateLimit(ip: string, maxReq = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const key = ip || 'unknown';
  if (!rateLimitStore.has(key)) rateLimitStore.set(key, []);
  const timestamps = (rateLimitStore.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxReq) return false;
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

// --- LANGUAGE DETECTION ---
function detectLanguage(text = ''): 'en' | 'mr' | 'hi' {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagari < 2) return 'en';
  const marathiMarkers = ['आहे', 'आहेत', 'नाही', 'करा', 'सांगा', 'द्या', 'घ्या', 'मला', 'तुम्ही', 'काय', 'कसा', 'कसे'];
  const hindiMarkers = ['है', 'हैं', 'नहीं', 'करो', 'बताओ', 'दो', 'मुझे', 'आप', 'क्या', 'कैसा', 'कैसे', 'हो'];
  const mr = marathiMarkers.filter(w => text.includes(w)).length;
  const hi = hindiMarkers.filter(w => text.includes(w)).length;
  return mr >= hi ? 'mr' : 'hi';
}

function isGreeting(text = ''): boolean {
  const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  const greetings = [
    'hi', 'hello', 'hey', 'yo', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'namaste', 'namaskar', 'नमस्ते', 'नमस्कार', 'राम राम', 'जय महाराष्ट्र', 'सुप्रभात', 'शुभ दुपार', 'शुभ संध्याकाळ',
    'hii', 'hiii', 'heyy', 'hello there', 'hi there'
  ];
  return greetings.includes(clean);
}

// --- CONTEXT TRIMMING ---
function trimConversationHistory(messages: any[], maxTurns = 8) {
  if (messages.length <= maxTurns * 2) return messages;
  return messages.slice(-(maxTurns * 2));
}

const geminiTools = TOOL_SCHEMAS.map(ts => ({
  name: ts.name,
  description: ts.description,
  parameters: ts.parameters
}));

// --- GEMINI API CALL (STREAMING WITH FUNCTION CALLING SUPPORT) ---
async function callGeminiStream(systemPrompt: string, messages: any[], res: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || ' ' }]
  }));

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    tools: [{ functionDeclarations: geminiTools }],
    generationConfig: {
      maxOutputTokens: 3000,
      temperature: 0.7,
      topP: 0.95
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body not readable');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let pendingFunctionCall: any = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const data = JSON.parse(raw);
        const candidate = data.candidates?.[0];
        
        const functionCall = candidate?.content?.parts?.[0]?.functionCall;
        if (functionCall) {
          pendingFunctionCall = functionCall;
          break;
        }

        const text = candidate?.content?.parts?.[0]?.text || '';
        if (text) {
          fullText += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } catch (_) {
        // Ignore malformed chunks
      }
    }
    if (pendingFunctionCall) break;
  }

  if (pendingFunctionCall) {
    const { name, args } = pendingFunctionCall;
    const toolResult = await executeTool(name, args);

    const followUpMessages = [
      ...messages,
      {
        role: 'assistant',
        content: `Calling tool ${name} with arguments: ${JSON.stringify(args)}`
      },
      {
        role: 'user',
        content: `Tool Execution Result for ${name}: ${JSON.stringify(toolResult)}`
      }
    ];

    res.write(`data: ${JSON.stringify({ text: `\n\n*[Executing Agent Tool: ${name}...]*\n\n` })}\n\n`);
    return callGeminiStream(systemPrompt, followUpMessages, res);
  }

  return fullText;
}

// --- GROQ API CALL (NON-STREAMING FALLBACK) ---
async function callGroq(systemPrompt: string, messages: any[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || ' '
    }))
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: groqMessages,
      max_tokens: 3000,
      temperature: 0.7,
      stream: false
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Groq error: ${err.error?.message}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// --- MAIN HANDLER ---
export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
  }

  if (!authenticate(req, res)) return;

  let activeAgentId = 'recommendation';
  let language: 'en' | 'mr' | 'hi' = 'en';

  try {
    const validationResult = chatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.flatten().fieldErrors
      });
    }
    const { messages, agent: requestedAgent, stream, language: reqLanguage } = validationResult.data;

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUserMsg?.content || '';

    language = reqLanguage || detectLanguage(userText);

    const userIsGreeting = isGreeting(userText);
    const isAutoRoute = !requestedAgent || requestedAgent === 'auto';

    let systemContext = '';

    if (userIsGreeting && isAutoRoute) {
      activeAgentId = 'general_greeting';
      systemContext = `You are InsightAI — a premium, enterprise-grade IT Hardware Intelligence Platform.
The user has greeted you. Respond with a warm, professional, and friendly welcome.
Introduce yourself as InsightAI and list your main capabilities. Keep it short (under 80 words).`;
    } else {
      const routedAgent = await routeAgent(userText, requestedAgent);
      activeAgentId = routedAgent.id;
      systemContext = routedAgent.systemPrompt;
    }

    let ragContext = '';
    let confidenceScore = 0.7;
    if (activeAgentId !== 'general_greeting') {
      try {
        const ragResult = await retrieveRAGContext(activeAgentId, userText);
        ragContext = ragResult.context;
        confidenceScore = ragResult.confidence;
      } catch (e: any) {
        console.error('RAG failed (non-fatal):', e.message);
      }
    }

    let productImageUrl = null;
    let productImageInfo = null;
    if (activeAgentId === 'product_intelligence' || activeAgentId === 'recommendation' || activeAgentId === 'sales_coach') {
      const imgMatch = findProductImage(userText);
      if (imgMatch) {
        productImageUrl = imgMatch.url;
        productImageInfo = imgMatch;
      }
    }

    let basePrompt = systemContext;
    if (productImageUrl) {
      basePrompt += `\n\nPRODUCT IMAGE: The REAL official product image URL for "${productImageInfo?.name}" is: ${productImageUrl}\nYou MUST include this at the very beginning of the response in "### 1. Product Showcase" section format: ![${productImageInfo?.name}](${productImageUrl})`;
    } else {
      basePrompt += `\n\nCRITICAL IMAGE INSTRUCTION: No official product image is available for this product. You MUST completely OMIT the '### 1. Product Showcase' section and do NOT output any image markdown tag. Start your response directly with the '### 2. Product Overview' section.`;
    }

    if (userIsGreeting && activeAgentId !== 'general_greeting' && activeAgentId !== 'sales_practice') {
      basePrompt += `\n\nIMPORTANT: The user has greeted you. Since they haven't asked a specific question yet, do NOT generate your full template or specs. Just greet them in character as the ${AGENT_REGISTRY[activeAgentId]?.name || 'InsightAI'} agent, explain your role, and ask how to help.`;
    }

    const langInstruction = language === 'mr'
      ? '\n\nIMPORTANT: The user is writing in MARATHI. You MUST respond in clean Marathi using Devanagari script only.'
      : language === 'hi'
      ? '\n\nIMPORTANT: The user is writing in HINDI. You MUST respond in clean Hindi using Devanagari script only.'
      : '';

    const systemPrompt = basePrompt + langInstruction + (ragContext
      ? `\n\nKNOWLEDGE BASE CONTEXT (use this for your response):${ragContext}`
      : '');

    const trimmedMessages = trimConversationHistory(messages);

    const metadata = {
      agentId: activeAgentId,
      agentName: AGENT_REGISTRY[activeAgentId]?.name || activeAgentId,
      language,
      timestamp: new Date().toISOString(),
      source: 'Hardware Knowledge Base + AI Analysis',
      confidence: confidenceScore,
      llm: process.env.GEMINI_API_KEY ? 'Gemini 2.0 Flash' : 'Groq Llama-3.3-70b',
      user: req.user ? { role: req.user.role, email: req.user.email } : undefined
    };

    // --- STREAMING PATH ---
    if (stream && process.env.GEMINI_API_KEY) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        const textStream = await callGeminiStream(systemPrompt, trimmedMessages, res);
        res.write(`data: ${JSON.stringify({ done: true, metadata })}\n\n`);
        res.end();

        // Log successful stream telemetry
        const duration = Date.now() - startTime;
        logTelemetry({
          agentId: activeAgentId,
          language,
          durationMs: duration,
          status: 'success',
          tokensEstimated: Math.round(textStream.length / 4),
          userRole: req.user?.role
        });
        recordMetric(activeAgentId, duration, false);
      } catch (geminiErr: any) {
        console.error('Gemini stream failed, falling back to Groq:', geminiErr.message);
        try {
          const textStream = await callGroq(systemPrompt, trimmedMessages);
          res.write(`data: ${JSON.stringify({ text: textStream })}\n\n`);
          metadata.llm = 'Groq Llama-3.3-70b (fallback)';
          res.write(`data: ${JSON.stringify({ done: true, metadata })}\n\n`);
          res.end();

          const duration = Date.now() - startTime;
          logTelemetry({
            agentId: activeAgentId,
            language,
            durationMs: duration,
            status: 'fallback',
            tokensEstimated: Math.round(textStream.length / 4),
            userRole: req.user?.role
          });
          recordMetric(activeAgentId, duration, false);
        } catch (groqErr: any) {
          console.error('Groq fallback failed:', groqErr.message);
          res.write(`data: ${JSON.stringify({ error: 'AI service unavailable.' })}\n\n`);
          res.end();

          const duration = Date.now() - startTime;
          logTelemetry({
            agentId: activeAgentId,
            language,
            durationMs: duration,
            status: 'failed',
            error: groqErr.message,
            userRole: req.user?.role
          });
          recordMetric(activeAgentId, duration, true);
        }
      }
      return;
    }

    // --- NON-STREAMING PATH ---
    let text = '';
    let usedLLM = 'Groq Llama-3.3-70b';

    try {
      if (process.env.GEMINI_API_KEY) {
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const contents = trimmedMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content || ' ' }]
        }));
        
        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            tools: [{ functionDeclarations: geminiTools }],
            generationConfig: { maxOutputTokens: 3000, temperature: 0.7 }
          })
        });

        if (!response.ok) throw new Error(`Gemini non-stream error status ${response.status}`);
        let data = await response.json();
        
        let candidate = data.candidates?.[0];
        let functionCall = candidate?.content?.parts?.[0]?.functionCall;

        if (functionCall) {
          const { name, args } = functionCall;
          const toolResult = await executeTool(name, args);

          const followUpContents = [
            ...contents,
            { role: 'model', parts: [{ functionCall }] },
            { role: 'user', parts: [{ text: `Tool Execution Result for ${name}: ${JSON.stringify(toolResult)}` }] }
          ];

          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: followUpContents,
              tools: [{ functionDeclarations: geminiTools }],
              generationConfig: { maxOutputTokens: 3000, temperature: 0.7 }
            })
          });

          if (!response.ok) throw new Error(`Gemini non-stream function follow-up error status ${response.status}`);
          data = await response.json();
          candidate = data.candidates?.[0];
        }

        text = candidate?.content?.parts?.[0]?.text || '';
        usedLLM = 'Gemini 2.0 Flash';
      } else {
        text = await callGroq(systemPrompt, trimmedMessages);
      }
    } catch (err: any) {
      console.warn("Gemini non-stream call failed, trying Groq fallback:", err.message);
      text = await callGroq(systemPrompt, trimmedMessages);
      usedLLM = 'Groq Llama-3.3-70b (fallback)';
    }

    const duration = Date.now() - startTime;
    logTelemetry({
      agentId: activeAgentId,
      language,
      durationMs: duration,
      status: 'success',
      tokensEstimated: Math.round(text.length / 4),
      userRole: req.user?.role
    });
    recordMetric(activeAgentId, duration, false);

    metadata.llm = usedLLM;
    return res.status(200).json({
      content: [{ type: 'text', text }],
      metadata
    });

  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    
    const duration = Date.now() - startTime;
    logTelemetry({
      agentId: activeAgentId || requestedAgent || 'unknown',
      language,
      durationMs: duration,
      status: 'failed',
      error: err.message,
      userRole: req.user?.role
    });
    recordMetric(activeAgentId || 'unknown', duration, true);

    return res.status(500).json({ error: 'Service error. Please try again.', details: err.message });
  }
}
