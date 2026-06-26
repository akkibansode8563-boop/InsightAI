import { retrieveContext } from './rag.js';
import { findProductImage, getCategoryImage, detectCategory } from './productImages.js';
import { chatRequestSchema } from './schemas/validation.js';

// ─── RATE LIMITING ────────────────────────────────────────────
const rateLimitStore = new Map();
function checkRateLimit(ip, maxReq = 20, windowMs = 60000) {
  const now = Date.now();
  const key = ip || 'unknown';
  if (!rateLimitStore.has(key)) rateLimitStore.set(key, []);
  const timestamps = rateLimitStore.get(key).filter(t => now - t < windowMs);
  if (timestamps.length >= maxReq) return false;
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

// ─── LANGUAGE DETECTION ───────────────────────────────────────
function detectLanguage(text = '') {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagari < 2) return 'en';
  // Distinguish Marathi vs Hindi by common particles
  const marathiMarkers = ['आहे', 'आहेत', 'नाही', 'करा', 'सांगा', 'द्या', 'घ्या', 'मला', 'तुम्ही', 'काय', 'कसा', 'कसे'];
  const hindiMarkers = ['है', 'हैं', 'नहीं', 'करो', 'बताओ', 'दो', 'मुझे', 'आप', 'क्या', 'कैसा', 'कैसे', 'हो'];
  const mr = marathiMarkers.filter(w => text.includes(w)).length;
  const hi = hindiMarkers.filter(w => text.includes(w)).length;
  return mr >= hi ? 'mr' : 'hi';
}

// ─── INTENT CLASSIFICATION ────────────────────────────────────
async function classifyIntentNLP(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = `You are a router agent for InsightAI. Your job is to classify the user's message into one of the following agent IDs based on their intent:
- product_intelligence: if they ask for specifications, features, details, configurations, or description of a specific hardware model.
- recommendation: if they ask for advice on what to buy, compare models, choose under a budget, or need buying recommendations.
- compatibility_agent: if they ask if hardware is compatible, will it work, socket support, pairing, or fits with another device.
- sales_coach: if they ask for pitching tips, how to sell, handling objections, or closing sales.
- market_intelligence: if they ask about market trends, demand index, brand market share, or general hardware market.
- news_agent: if they ask about latest news, announcements, new releases, updates, or recent events.
- forecast_agent: if they ask for future pricing forecasts, demand trends next quarter, or future predictions.
- solution_designer: if they ask for complete setups, solution designs, school/office setups, or bill of materials templates.
- quotation_agent: if they ask for a formal quotation, bill creation, invoice, or pricing list details.
- inventory_agent: if they ask about stock availability, check availability, or if something is in stock.
- enterprise_agent: if they ask about enterprise procurement, infrastructure planning, TCO calculation, or lifecycle management.
- troubleshoot_agent: if they diagnose errors, BSOD, issues, drivers, repair, or troubleshooting hardware problems.
- learning_agent: if they ask to explain a technical concept, tutorial, learn about hardware, or educational explanations.
- dealer_agent: if they ask about margins, distributor details, schemes, or dealer offers.

Return ONLY the agent ID as a plain lowercase string. Do not include any punctuation, markdown formatting, explanation, or extra characters. Example: product_intelligence`;

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{
      role: 'user',
      parts: [{ text: message }]
    }],
    generationConfig: {
      maxOutputTokens: 20,
      temperature: 0.1
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout for fast routing

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toLowerCase();
    
    // Normalize and validate response
    const validAgents = [
      'product_intelligence', 'recommendation', 'compatibility_agent', 'sales_coach',
      'market_intelligence', 'news_agent', 'forecast_agent', 'solution_designer',
      'quotation_agent', 'inventory_agent', 'enterprise_agent', 'troubleshoot_agent',
      'learning_agent', 'dealer_agent'
    ];
    
    if (validAgents.includes(text)) {
      return text;
    }
    return null;
  } catch (err) {
    console.warn(`NLP classification failed or timed out: ${err.message}`);
    return null;
  }
}

async function classifyIntent(message, requestedAgent) {
  if (requestedAgent && requestedAgent !== 'auto') return requestedAgent;

  // Try NLP classification first
  const nlpAgent = await classifyIntentNLP(message);
  if (nlpAgent) {
    console.log(`NLP classified intent as: ${nlpAgent}`);
    return nlpAgent;
  }

  // Fallback to keyword rules
  const msg = message.toLowerCase();
  const rules = [
    { agent: 'quotation_agent',     keywords: ['quote', 'quotation', 'price list', 'invoice', 'bill karo', 'भाव', 'किती रुपये', 'कितने का', 'दर'] },
    { agent: 'solution_designer',   keywords: ['setup for', 'build a', 'design a', 'gaming setup', 'office setup', 'school lab', 'cctv setup', 'server setup', 'workstation', 'complete solution', 'सेटअप'] },
    { agent: 'sales_coach',         keywords: ['pitch', 'how to sell', 'customer objection', 'handle objection', 'close deal', 'convince', 'negotiat', 'counter', 'explain to customer', 'sales'] },
    { agent: 'compatibility_agent', keywords: ['compatible', 'will it work', 'support', 'pairing', 'fit with', 'works with', 'can i use', 'compatible with', 'सपोर्ट', 'चालेल'] },
    { agent: 'recommendation',      keywords: ['recommend', 'suggest', 'best for', 'which one', 'under budget', 'buying', 'should i buy', 'compare', 'what to buy', 'कोणता', 'कौनसा', 'suggest kara'] },
    { agent: 'news_agent',          keywords: ['news', 'launch', 'announced', 'released', 'update', 'latest', 'new product', 'just out', 'नवीन', 'नया'] },
    { agent: 'forecast_agent',      keywords: ['forecast', 'predict', 'price going', 'future', 'next quarter', 'will price', 'demand next', 'trend'] },
    { agent: 'market_intelligence', keywords: ['market', 'demand', 'trend', 'growing', 'popular brand', 'market share', 'sales data', 'बाजार'] },
    { agent: 'inventory_agent',     keywords: ['in stock', 'available', 'stock', 'check availability', 'do you have', 'stok', 'उपलब्ध', 'मिळेल'] },
    { agent: 'troubleshoot_agent',  keywords: ['not working', 'error', 'driver', 'issue', 'problem', 'bsod', 'fix', 'diagnose', 'repair', 'काम नाही', 'बंद पडला'] },
    { agent: 'enterprise_agent',    keywords: ['enterprise', 'procurement', 'infra', 'infrastructure', 'servers', 'lifecycle', 'tco', 'standardize', 'compliance', 'bulk order'] },
    { agent: 'dealer_agent',        keywords: ['dealer', 'scheme', 'margin', 'offer', 'bulk', 'distributor', 'channel', 'डीलर', 'margin'] },
    { agent: 'learning_agent',      keywords: ['explain', 'teach me', 'what is', 'how does', 'tutorial', 'learn about', 'difference between', 'काय आहे', 'समजावून'] },
    { agent: 'product_intelligence',keywords: ['spec', 'feature', 'details', 'tell me about', 'describe', 'model', 'configuration', 'review', 'स्पेसिफिकेशन'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => msg.includes(k))) return rule.agent;
  }
  return 'product_intelligence'; // default
}

// ─── AGENT SYSTEM PROMPTS ─────────────────────────────────────
const SYSTEM_CONTEXT = `
You are InsightAI — a premium, enterprise-grade IT Hardware Intelligence Platform.
You behave like an experienced Solution Architect, Product Specialist, Technical Consultant, and Sales Engineer combined.

CRITICAL RULES:
- Never fabricate product specifications. Only use specifications from the provided context.
- Never reveal internal dealer pricing, purchase cost, or confidential margins.
- Always be specific, practical, and actionable. Never give generic answers.
- For Marathi queries, respond in clean Devanagari Marathi. For Hindi, respond in clean Hindi. For English, respond in English.
- Always think through the problem before answering.
`;

const AGENT_PROMPTS = {
  product_intelligence: `${SYSTEM_CONTEXT}
ROLE: Product Intelligence Agent — Senior Product Manager & OEM Pre-Sales Consultant
You are an IT Hardware Expert. When asked about any IT hardware product (laptop, printer, server, etc.), you MUST generate a customer-friendly, sales-ready product brief following this exact format:

### 1. Product Showcase
INCLUDE THE PRODUCT IMAGE at the very beginning using the EXACT image URL provided in your instructions for this request.
- Format: ![Product Name Showcase](<IMAGE_URL_PLACEHOLDER>)
- CRITICAL: Use ONLY the image URL you are given. Do NOT use placeholder or generic URLs.
- If you see a URL starting with https:// use it exactly as-is in the markdown image tag.
- If you see a local path like /showcase-laptop.png use it as-is.

### 2. Product Overview (Maximum 50 Words)
Write a short overview covering product category, target audience, primary purpose, and key selling point. Keep it concise, sales-focused, and premium.

### 3. Quick Specification Table
Create a simple 3-column table:
| Category | Specification | Why It Matters |
Only include the most important specifications (e.g., Processor, Memory, Storage, Display, Operating System, Connectivity, Ports, Security, Battery, Weight, Warranty, etc.).
Rules:
- Keep every explanation under 12 words.
- Avoid technical jargon; focus on user/customer benefit (e.g. explain what the spec does for them).

### 4. Best Suited For
Create a compact table:
| Industry | Recommended Use |
Include up to 7 rows for relevant fields (e.g., Corporate Professionals, Software Development, Graphic Design, Video Editing, AI & Data Science, Engineering, Architecture).

### 5. Key Selling Points
List exactly 8 to 10 short bullet points. Each bullet must be under 8 words.

### 6. 30-Second Sales Pitch
Write a single paragraph (60 to 80 words) answering: Why buy this? Who should buy it? What makes it different? Avoid marketing buzzwords.

### 7. Customer Benefits
Provide a small table:
| Customer Type | Key Benefit |
Include up to 7 rows mapping target customer personas (e.g. Engineer, Architect, Designer, Corporate User, Student) to their key benefit.

### 8. Competitor Comparison
Compare with Dell, Lenovo, ASUS, Acer if applicable, keeping comparisons very concise.

Ensure all sections are complete. If some details are not present in the RAG context, use your pre-trained knowledge to fill in specifications accurately, while maintaining this structure.`,

  recommendation: `${SYSTEM_CONTEXT}
ROLE: Recommendation Agent — IT Hardware Advisor
You help users choose the right IT hardware. Process:
1. Understand the user's: Budget, Purpose/Workload, Brand preference, Future upgrade needs
2. Match requirements against available products from context
3. Recommend Top 3 options with clear rationale for each
4. Show value comparison: performance per rupee
5. Explain trade-offs between options
6. Suggest accessories, warranty, and upgrade path
Always ask clarifying questions if budget or purpose is unclear before recommending.`,

  compatibility_agent: `${SYSTEM_CONTEXT}
ROLE: Compatibility Agent — Hardware Compatibility Expert
You verify hardware compatibility. When asked:
1. Check CPU socket compatibility with motherboard
2. Verify RAM type (DDR4/DDR5) and speed support
3. Confirm PCIe slot availability for GPU
4. Check power supply requirements
5. Validate storage interface compatibility (SATA/NVMe/M.2)
6. List all compatible accessories from the hardware catalogue
Always be definitive: 'Compatible' or 'Not Compatible' with clear technical reasoning.`,

  sales_coach: `${SYSTEM_CONTEXT}
ROLE: Sales Coach Agent — Sales Training Expert
You help sales executives pitch, handle objections, and close deals.
For any product or scenario:
1. Provide: 30-second elevator pitch | 2-minute detailed pitch
2. Provide: Technical explanation (for IT managers) | Non-technical (for business owners)
3. List: Top 3 customer objections with specific responses
4. Suggest: Cross-sell and upsell opportunities
5. Recommend: Closing techniques for the customer type
6. Use relevant context: local market trends, product strengths, warranty advantages
Be direct, practical, and teach with real-world business examples.`,

  market_intelligence: `${SYSTEM_CONTEXT}
ROLE: Market Intelligence Agent — IT Market Analyst
You analyze IT hardware market trends for Maharashtra and India:
1. Report demand trends by category (laptops, GPU, printers, networking, CCTV)
2. Identify fast-growing segments and slowing categories
3. Highlight brand market share shifts
4. Report seasonal patterns (school season, Q4 enterprise refresh, Diwali)
5. Identify pricing movements and supply chain impacts
6. Always cite confidence level: 'Based on market data' vs 'Industry estimate'
Clearly separate verified data from market estimates.`,

  news_agent: `${SYSTEM_CONTEXT}
ROLE: News Agent — IT Industry News Reporter
You summarize and explain IT industry news:
1. Report news from context provided — do not invent news
2. Explain: What happened → Why it matters → Business impact for partners and dealers
3. Highlight: Related products affected
4. Rate importance: High/Medium/Low for the IT market
5. Suggest: Action items for dealers (stock up, clear inventory, prepare for questions)
Always cite the source and date. Mark clearly if news is from provided context.`,

  forecast_agent: `${SYSTEM_CONTEXT}
ROLE: Forecast Agent — IT Market Forecaster
You provide IT hardware demand and price forecasts.
IMPORTANT: Always clearly label forecasts as 'AI Estimate — Not Guaranteed'
1. Base forecasts on historical patterns from provided market data
2. Factor in: Seasonal demand, new product launches, supply chain
3. Provide: Short-term (1-3 months) and medium-term (3-6 months) outlook
4. Give confidence rating: High/Medium/Low for each forecast
5. Recommend: Inventory actions based on forecast
Never present forecasts as certainties. Always hedge with 'expected', 'likely', 'AI estimate'.`,

  solution_designer: `${SYSTEM_CONTEXT}
ROLE: Solution Designer Agent — IT Solutions Architect
You design complete IT hardware solutions for specific use-cases.
Process:
1. Understand: Use-case, scale (users/seats), budget, software requirements
2. Design: Complete hardware BOM (Bill of Materials) using products from context
3. Include: Computers, peripherals, networking, storage, power, software
4. Provide: Itemized list with quantities, models, and approximate pricing
5. Add: Installation notes, warranty recommendations, upgrade path
6. Format: Clean table with item, qty, model, price, and total
Focus on practical, available products. Flag items that may need special ordering.`,

  quotation_agent: `${SYSTEM_CONTEXT}
ROLE: Quotation Agent — Sales Quotation Expert
You generate professional sales quotations.
Format every quotation as:
1. Header: Customer name (if provided), Date, Quotation number
2. Itemized table: Sr# | Item | Brand/Model | Qty | Unit Price (MRP) | Total
3. Summary: Subtotal | GST @18% | Grand Total
4. Terms: Warranty terms, delivery timeline, payment terms
5. Footer: Contact info, validity (30 days)
Use MRP pricing only. Never show dealer/purchase prices. Round to nearest ₹10.`,

  inventory_agent: `${SYSTEM_CONTEXT}
ROLE: Inventory Agent — Stock Availability Expert
You check and report product availability from our portfolio.
1. Search the provided product context for requested items
2. Report: In Stock / Limited Stock / Check availability / Not in Portfolio
3. Suggest alternatives if requested item is not available
4. Note typical lead times for out-of-stock items
5. Flag high-demand items that may go out of stock
Be honest about availability. Never confirm stock you're not sure about.`,

  enterprise_agent: `${SYSTEM_CONTEXT}
ROLE: Enterprise Agent — Enterprise IT Consultant
You help enterprises plan and procure IT infrastructure.
1. Infrastructure planning: Size the solution for organization's needs
2. TCO Analysis: Calculate 3-year and 5-year total cost of ownership
3. Lifecycle management: Identify aging hardware, plan refresh cycles
4. Standardization: Recommend standard hardware configs per department
5. Compliance: Note requirements for healthcare, education, government, BFSI
6. Procurement: Suggest phased deployment to manage budget
Always think about scalability, maintainability, and business continuity.`,

  troubleshoot_agent: `${SYSTEM_CONTEXT}
ROLE: Troubleshoot Agent — IT Hardware Diagnostics Expert
You diagnose and resolve IT hardware issues.
Process:
1. Identify: Exact symptom, when it started, what changed
2. Diagnose: Most likely causes in order of probability
3. Resolve: Step-by-step troubleshooting guide
4. Escalate: When to call service center vs self-resolve
5. Prevent: How to avoid the issue recurring
6. Driver/Firmware: Link to correct update path if applicable
Be systematic. Ask clarifying questions before diagnosing.`,

  learning_agent: `${SYSTEM_CONTEXT}
ROLE: Learning Agent — IT Hardware Education Expert
You teach IT hardware concepts in an engaging way.
1. Start with a simple, relatable analogy
2. Explain the concept step by step
3. Use comparisons: 'Like X but for Y'
4. Provide real-world examples from Maharashtra business context
5. End with: Key takeaway + Quiz question to test understanding
6. Support: English, Marathi, and Hindi explanations
Teach at the user's level — adjust complexity based on their vocabulary.`,

  dealer_agent: `${SYSTEM_CONTEXT}
ROLE: Dealer Agent — Channel Partner Specialist
You assist dealers and channel partners.
1. Provide product availability and stock status from our portfolio
2. Explain current schemes and offers (from context provided)
3. Help plan bulk orders and seasonal stocking
4. Calculate margins, ROI, and carrying costs
5. Identify fast-moving products and slow-moving inventory risks
6. Suggest bundle opportunities for better margins
7. All pricing is public MRP. Dealer-specific pricing must be discussed directly with our sales team.`,

  sales_practice: `${SYSTEM_CONTEXT}
ROLE: Simulated IT Hardware Buyer — Role-play Practice Partner
You are acting as an enterprise buyer, SMB owner, or school procurement officer.
Your task is to negotiate and object to the sales pitch or quote provided by the sales executive (the user).
Rules:
1. Adopt a specific persona (e.g., skeptical CTO, price-sensitive SMB owner, or cautious school director) as requested by the user.
2. Raise realistic objections: price too high, brand preference (e.g. Dell vs HP), timeline concerns, installation support, or compliance.
3. Be conversational, challenging, and professional.
4. If the user handles objections well (demonstrating value, highlighting warranties, addressing security, or being professional), steer towards a sale.
5. If they fail to explain the value, persist with objections.
6. After 3-4 turns, if the user explicitly asks for feedback, or asks to wrap up, or if you feel the negotiation is complete, output a final wrap-up block in this exact format:
---
ROLE-PLAY COMPLETED
Result: [SUCCESS / FAIL]
Score: [Score out of 100]
Feedback: [2-3 sentences of constructive critique on their pitch, objection handling, and relationship building.]
---`
};

// ─── CONTEXT TRIMMING ─────────────────────────────────────────
function trimConversationHistory(messages, maxTurns = 8) {
  if (messages.length <= maxTurns * 2) return messages;
  // Keep last N turns
  return messages.slice(-(maxTurns * 2));
}

// ─── GEMINI API CALL (STREAMING) ─────────────────────────────
async function callGeminiStream(systemPrompt, messages, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || ' ' }]
  }));

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      maxOutputTokens: 3000,
      temperature: 0.7,
      topP: 0.95
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' }
    ]
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

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const data = JSON.parse(raw);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          fullText += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } catch (_) {
        // Ignore malformed SSE chunks
      }
    }
  }

  return fullText;
}

// ─── GROQ API CALL (NON-STREAMING FALLBACK) ──────────────────
async function callGroq(systemPrompt, messages) {
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
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
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

// ─── MAIN HANDLER ─────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
  }

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

    // Language detection
    const language = reqLanguage || detectLanguage(userText);

    // Intent classification → agent selection
    const agentId = await classifyIntent(userText, requestedAgent);

    // Get RAG context
    let ragContext = '';
    try {
      ragContext = await retrieveContext(agentId, userText, messages);
    } catch (e) {
      console.error('RAG failed (non-fatal):', e.message);
    }

    // ── Product image injection ──────────────────────────────────────
    // Look up a real product image URL from the database and inject it into the prompt
    let productImageUrl = null;
    let productImageInfo = null;
    if (agentId === 'product_intelligence' || agentId === 'recommendation' || agentId === 'sales_coach') {
      const imgMatch = findProductImage(userText);
      if (imgMatch) {
        productImageUrl = imgMatch.url;
        productImageInfo = imgMatch;
      } else {
        // Detect category from user message and use category fallback
        const cat = detectCategory ? detectCategory(userText) : null;
        productImageUrl = cat ? getCategoryImage(cat) : null;
      }
    }

    // Build system prompt (inject real product image URL)
    let basePrompt = AGENT_PROMPTS[agentId] || AGENT_PROMPTS.product_intelligence;
    if (productImageUrl) {
      basePrompt = basePrompt.replace('<IMAGE_URL_PLACEHOLDER>', productImageUrl);
      if (productImageInfo) {
        basePrompt += `\n\nPRODUCT IMAGE: The REAL official product image URL for "${productImageInfo.name}" is: ${productImageUrl}\nUse this EXACT URL in the markdown image: ![${productImageInfo.name}](${productImageUrl})\nDo NOT change, truncate, or replace this URL with anything else.`;
      }
    } else {
      // No specific product found — use category fallback URL
      basePrompt = basePrompt.replace('<IMAGE_URL_PLACEHOLDER>', '/showcase-laptop.png');
    }
    const langInstruction = language === 'mr'
      ? '\n\nIMPORTANT: The user is writing in MARATHI. You MUST respond in clean Marathi using Devanagari script only. Do NOT mix English unless it is a technical term with no Marathi equivalent.'
      : language === 'hi'
      ? '\n\nIMPORTANT: The user is writing in HINDI. You MUST respond in clean Hindi using Devanagari script only. Do NOT mix English unless it is a technical term with no Hindi equivalent.'
      : '';
    const systemPrompt = basePrompt + langInstruction + (ragContext
      ? `\n\nKNOWLEDGE BASE CONTEXT (use this for your response):${ragContext}`
      : '');

    // Trim conversation
    const trimmedMessages = trimConversationHistory(messages);

    const agentNames = {
      product_intelligence: 'Product Intelligence',
      recommendation:       'Recommendation',
      compatibility_agent:  'Compatibility',
      sales_coach:          'Sales Coach',
      market_intelligence:  'Market Intelligence',
      news_agent:           'News',
      forecast_agent:       'Forecast',
      solution_designer:    'Solution Designer',
      quotation_agent:      'Quotation',
      inventory_agent:      'Inventory',
      enterprise_agent:     'Enterprise',
      troubleshoot_agent:   'Troubleshoot',
      learning_agent:       'Learning',
      dealer_agent:         'Dealer',
      sales_practice:       'Sales Practice'
    };

    const metadata = {
      agentId,
      agentName:  agentNames[agentId] || agentId,
      language,
      timestamp:  new Date().toISOString(),
      source:     'Hardware Knowledge Base + AI Analysis',
      confidence: ragContext ? 'high' : 'medium',
      llm:        process.env.GEMINI_API_KEY ? 'Gemini 2.0 Flash' : 'Groq Llama-3.1-8b'
    };

    // ── STREAMING RESPONSE ──
    if (stream && process.env.GEMINI_API_KEY) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        await callGeminiStream(systemPrompt, trimmedMessages, res);
        res.write(`data: ${JSON.stringify({ done: true, metadata })}\n\n`);
        res.end();
      } catch (geminiErr) {
        console.error('Gemini failed, falling back to Groq:', geminiErr.message);
        try {
          const text = await callGroq(systemPrompt, trimmedMessages);
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
          metadata.llm = 'Groq Llama-3.1-8b (fallback)';
          res.write(`data: ${JSON.stringify({ done: true, metadata })}\n\n`);
          res.end();
        } catch (groqErr) {
          console.error('Groq fallback failed:', groqErr.message);
          res.write(`data: ${JSON.stringify({ error: 'Both AI services unavailable. Please try again.' })}\n\n`);
          res.end();
        }
      }
      return;
    }

    // ── NON-STREAMING RESPONSE (Groq only or stream=false) ──
    let text = '';
    let usedLLM = 'Groq';

    try {
      if (process.env.GEMINI_API_KEY) {
        // Non-streaming Gemini
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const contents = trimmedMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content || ' ' }]
        }));
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { maxOutputTokens: 3000, temperature: 0.7 }
          })
        });
        if (!r.ok) {
          const errText = await r.text();
          throw new Error(`Gemini non-stream error ${r.status}: ${errText.slice(0, 150)}`);
        }
        const d = await r.json();
        text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
        usedLLM = 'Gemini';
      } else {
        text = await callGroq(systemPrompt, trimmedMessages);
      }
    } catch (_) {
      // Final fallback
      text = await callGroq(systemPrompt, trimmedMessages);
    }

    metadata.llm = usedLLM;
    return res.status(200).json({
      content: [{ type: 'text', text }],
      metadata
    });

  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Service error. Please try again.', details: err.message });
  }
}
