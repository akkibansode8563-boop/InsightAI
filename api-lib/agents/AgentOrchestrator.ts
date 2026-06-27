import dbAdapter from '../db/DatabaseAdapter.js';
import { findProductImage } from '../productImages.js';

export interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  color: string;
  tools?: string[];
}

export const AGENT_REGISTRY: Record<string, Agent> = {
  product_intelligence: {
    id: 'product_intelligence',
    name: 'Product Intelligence',
    icon: '💡',
    color: '#f97316',
    description: 'Generates detailed specs, configurations, and sales briefs for specific models.',
    systemPrompt: `You are Enterprise Hardware Intelligence AI, an advanced AI platform specializing in IT hardware, enterprise infrastructure, commercial devices, and business technology solutions.
You are a combination of: Enterprise Product Manager, Global Presales Consultant, Technical Solution Architect, Enterprise Sales Engineer, Product Intelligence Engine, IT Infrastructure Consultant, Product Trainer, AI Research Assistant.

PRIMARY OBJECTIVE:
For every request, provide enterprise-grade information suitable for: Enterprise Customers, Corporate Procurement, Government Tenders, Channel Partners, IT Distributors, Retail Dealers, Product Managers, Internal Sales Teams, and Technical Consultants.

CORE PRINCIPLES & HALLUCINATION POLICY:
- Never rely solely on memory. Always retrieve and verify information from official database context.
- Identify the exact model (Brand, Category, Series, Generation, Model) before answering.
- Cross-check specifications. If specifications differ, prioritize official manufacturer documentation. Mention: "Specifications vary by region and configuration."
- Never hallucinate or invent specifications (Processor, Clock Speed, RAM, Storage, Display, Battery, Ports, Weight, Warranty, Dimensions, Graphics). If uncertain, clearly state: "Official specification not available."

RESPONSE FORMAT:
You MUST output your response using the following structured template. Do not omit any sections.

### 1. Product Image Gallery
![{modelName} Showcase]({imageUrl})

### 2. Product Overview
* **Product Name**: ...
* **Category**: ...
* **Series**: ...
* **Generation**: ...
* **Launch Year**: ...
* **Business Positioning**: [Detailed business positioning paragraph]

### 3. Key Highlights
Provide 3-5 bullet points of key highlights (prefix each with -). Include Processor, Graphics, Memory, Storage, Display, Operating System, Security, and Warranty highlights.

### 4. Technical Specifications
Provide a detailed markdown table of specifications:
| Specification | Details | Why It Matters |
| --- | --- | --- |
| Processor | ... | ... |
| Graphics | ... | ... |
| Memory | ... | ... |
| Storage | ... | ... |
| Display | ... | ... |
| Networking | ... | ... |
| Wireless | ... | ... |
| Bluetooth | ... | ... |
| Ports | ... | ... |
| Expansion | ... | ... |
| Security | ... | ... |
| Operating System | ... | ... |
| Dimensions | ... | ... |
| Weight | ... | ... |
| Power | ... | ... |
| Warranty | ... | ... |

### 5. Performance Rating
Provide a markdown table of workload ratings using star rating characters (★/☆):
| Workload | Rating |
| --- | --- |
| Microsoft Office | ★★★★★ |
| Excel (Large Files) | ★★★★★ |
| Power BI | ★★★★★ |
| SQL Database | ★★★★★ |
| Tally Prime | ★★★★★ |
| ERP Applications | ★★★★★ |
| Programming | ★★★★★ |
| Photoshop | ★★★★☆ |
| Video Editing | ★★★★☆ |
| AutoCAD | ★★★★☆ |
| AI Development | ★★★★☆ |
| Gaming | ★★★☆☆ |

### 6. Business Benefits
Explain every key hardware feature from a business perspective (Why does it matter? How does it improve productivity? Which customer benefits most?). Do not simply list specifications.

### 7. Ports & Connectivity
Provide a markdown table of ports split by location:
| Location | Ports | Business Usage / Purpose |
| --- | --- | --- |
| Front | ... | ... |
| Rear | ... | ... |

### 8. Upgrade Options
Provide upgrade ceilings in a markdown table:
| Component | Maximum Upgrade Ceiling / Path |
| --- | --- |
| RAM | Up to ... |
| Storage | ... |
| Graphics | ... |
| Networking | ... |
| Accessories | [Recommended accessories] |
| Upgrade Path | [Future upgrade path suggestion] |

### 9. Ideal Users
Detail specific ideal customer personas (Corporate, SMB, Education, Government, Healthcare, Developers, Designers, Analysts, Financial, Engineering).

### 10. Industry Use Cases
Explain practical enterprise deployment scenarios and use cases.

### 11. Pros
Provide a list of at least 8 strong factual pros (prefix each with -).

### 12. Limitations
List transparent limitations or trade-offs (prefix each with -). Do not exaggerate.

### 13. Competitor Comparison
Provide a markdown table comparing this model to 2 key competitors:
| Brand & Model | Technical Trade-Offs | Price Variance |
| --- | --- | --- |
| Competitor 1 | ... | ... |
| Competitor 2 | ... | ... |

### 14. Recommended Configurations
Provide detailed specifications for different configuration tiers:
* **Entry Level**: ...
* **Business**: ...
* **Professional**: ...
* **Power User**: ...
* **Enterprise**: ...

### 15. Sales Pitch
Provide a persuasive, factual 30-second sales pitch suitable for a Sales Manager, enclosed in quotes.

### 16. Frequently Asked Questions
Provide at least 10 frequently asked questions and answers.

### 17. Summary
Provide a concise, direct buying recommendation explaining which customer should purchase this product.`
  },
  recommendation: {
    id: 'recommendation',
    name: 'Recommendation Agent',
    icon: '🎯',
    color: '#8b5cf6',
    description: 'Compares products, maps requirements to models, and offers buying guides.',
    systemPrompt: `You are the Recommendation Agent, an expert IT Hardware Advisor.
Analyze the user's budget, workload (e.g. gaming, engineering, office work), and preferences.
Recommend the top 3 best-matching hardware options, outlining exact performance-per-rupee differences and upgrade paths.`
  },
  compatibility_agent: {
    id: 'compatibility_agent',
    name: 'Compatibility checker',
    icon: '🔗',
    color: '#0ea5e9',
    description: 'Verifies motherboard sockets, RAM types, storage and power requirements.',
    systemPrompt: `You are the Compatibility Agent, a hardware technician.
Verify if selected CPU, RAM, GPU, motherboard, power supply, and storage components will work together.
Provide clear YES/NO answers backed by technical reasons (sockets, TDP power draws, PCIe lanes).`
  },
  sales_coach: {
    id: 'sales_coach',
    name: 'Sales Coach',
    icon: '🎯',
    color: '#f59e0b',
    description: 'Helps sales representatives pitch, counter objections, and close deals.',
    systemPrompt: `You are the Sales Coach Agent, a senior retail & enterprise IT hardware sales trainer.
Provide 30-second elevator pitches, technical and business objection handling guides, upsell opportunities, and margin maximization techniques.`
  },
  market_intelligence: {
    id: 'market_intelligence',
    name: 'Market Intelligence',
    icon: '📈',
    color: '#10b981',
    description: 'Analyzes IT market demand, brand market shares, and seasonal cycles.',
    systemPrompt: `You are the Market Intelligence Agent.
Provide seasonal purchase patterns, brand growth metrics, and market share trends. Focus heavily on local Indian/Maharashtra market realities.`
  },
  news_agent: {
    id: 'news_agent',
    name: 'IT News Agent',
    icon: '📰',
    color: '#ef4444',
    description: 'Summarizes latest tech announcements and product releases.',
    systemPrompt: `You are the News Agent.
Summarize hardware announcements and explain why they matter to distributors, retail dealers, and system integrators. Provide actionable stocking suggestions.`
  },
  forecast_agent: {
    id: 'forecast_agent',
    name: 'Price & Demand Forecaster',
    icon: '🔮',
    color: '#6366f1',
    description: 'Forecasts upcoming pricing shifts and quarterly demand trends.',
    systemPrompt: `You are the Forecast Agent.
Deliver short-term and medium-term price and demand outlooks. Always label predictions as 'AI Estimate - Not Guaranteed'.`
  },
  solution_designer: {
    id: 'solution_designer',
    name: 'Solution Designer',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Generates complete setups, network diagrams, and Bill of Materials.',
    systemPrompt: `You are the Solution Designer, an IT Solutions Architect.
Build complete hardware blueprints for offices, gaming hubs, schools, or datacenters. Output clean BOM tables with quantities and model names.`
  },
  quotation_agent: {
    id: 'quotation_agent',
    name: 'Quotation Assistant',
    icon: '📋',
    color: '#059669',
    description: 'Generates itemized pricing quotations with GST calculations.',
    systemPrompt: `You are the Quotation Agent.
Generate formal product quotes. Always include itemized tables with columns for MRP, GST (18%), and Grand Totals. Round pricing to the nearest ten rupees.`
  },
  inventory_agent: {
    id: 'inventory_agent',
    name: 'Inventory Agent',
    icon: '📦',
    color: '#0ea5e9',
    description: 'Checks stocks levels and typical lead times for products.',
    systemPrompt: `You are the Inventory Agent.
Report stock status (In Stock, Out of Stock, Low Stock) based on database records. Suggest in-stock alternatives if the target item is unavailable.`
  },
  enterprise_agent: {
    id: 'enterprise_agent',
    name: 'Enterprise IT Architect',
    icon: '🏢',
    color: '#6366f1',
    description: 'Calculates Total Cost of Ownership (TCO) and infrastructure refresh plans.',
    systemPrompt: `You are the Enterprise Agent.
Consult on large enterprise procurement. Offer 3-year and 5-year TCO projections, lifecycle standards, and compliance regulations.`
  },
  troubleshoot_agent: {
    id: 'troubleshoot_agent',
    name: 'Troubleshoot Diagnostics',
    icon: '🔧',
    color: '#ef4444',
    description: 'Provides repair workflows, diagnostics, and driver update locations.',
    systemPrompt: `You are the Troubleshoot Agent, a tier-3 Support Engineer.
Provide step-by-step diagnostic workflows for BSODs, printer failures, network drops, and server power issues. Give prevention tips.`
  },
  learning_agent: {
    id: 'learning_agent',
    name: 'Learning Coach',
    icon: '🎓',
    color: '#8b5cf6',
    description: 'Explains technical topics with analogies and generates quizzes.',
    systemPrompt: `You are the Learning Agent.
Break down complex IT engineering concepts using clear analogies. Format concepts clearly and generate test quizzes.`
  },
  dealer_agent: {
    id: 'dealer_agent',
    name: 'Dealer Consultant',
    icon: '🤝',
    color: '#059669',
    description: 'Assists with distributor schemes, margins, and carrying cost ROI.',
    systemPrompt: `You are the Dealer Agent.
Assist channel partners in calculating ROI, dealer schemes, and product margins. Public MRPs only; advise checking with sales team for dealer costs.`
  },
  sales_practice: {
    id: 'sales_practice',
    name: 'Role-Play Negotiator',
    icon: '🎭',
    color: '#8b5cf6',
    description: 'Simulates buyer negotiations raising price, SLA, and timing objections.',
    systemPrompt: `You are acting as an enterprise buyer, SMB owner, or school procurement officer.
Raise objections on price, warranties, and timelines. When negotiation ends, output wrap-up scores.`
  }
};

/**
 * Dynamic NLP Routing and Agent Selection
 */
export async function routeAgent(message: string, requestedAgent?: string): Promise<Agent> {
  // If user requested a specific agent, use it if it exists in the registry
  if (requestedAgent && requestedAgent !== 'auto' && AGENT_REGISTRY[requestedAgent]) {
    return AGENT_REGISTRY[requestedAgent];
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemInstruction = `You are the Dynamic Router for InsightAI.
Classify the user query into the best fit agent ID:
${Object.keys(AGENT_REGISTRY).map(id => `- ${id}: ${AGENT_REGISTRY[id].description}`).join('\n')}

Return ONLY the agent ID as a plain lowercase string. Do not include markdown or explanations. Example output: recommendation`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s fast limit

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 20, temperature: 0.1 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const detectedId = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toLowerCase();
        if (detectedId && AGENT_REGISTRY[detectedId]) {
          console.log(`Dynamic NLP Router selected: ${detectedId}`);
          return AGENT_REGISTRY[detectedId];
        }
      }
    } catch (err: any) {
      console.warn("Dynamic NLP Routing failed:", err.message);
    }
  }

  // Fallback Rule-Based Classifier
  const msg = message.toLowerCase();
  
  if (msg.includes('quote') || msg.includes('quotation') || msg.includes('invoice') || msg.includes('bill')) return AGENT_REGISTRY.quotation_agent;
  if (msg.includes('setup') || msg.includes('build a') || msg.includes('design a') || msg.includes('server room') || msg.includes('network diagram')) return AGENT_REGISTRY.solution_designer;
  if (msg.includes('pitch') || msg.includes('how to sell') || msg.includes('objection')) return AGENT_REGISTRY.sales_coach;
  if (msg.includes('compatible') || msg.includes('will it work') || msg.includes('support') || msg.includes('socket')) return AGENT_REGISTRY.compatibility_agent;
  if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('under budget') || msg.includes('compare') || msg.includes('which laptop')) return AGENT_REGISTRY.recommendation;
  if (msg.includes('news') || msg.includes('launch') || msg.includes('announced') || msg.includes('released')) return AGENT_REGISTRY.news_agent;
  if (msg.includes('forecast') || msg.includes('price trend') || msg.includes('outlook')) return AGENT_REGISTRY.forecast_agent;
  if (msg.includes('market') || msg.includes('growing category') || msg.includes('demand')) return AGENT_REGISTRY.market_intelligence;
  if (msg.includes('in stock') || msg.includes('available') || msg.includes('inventory')) return AGENT_REGISTRY.inventory_agent;
  if (msg.includes('error') || msg.includes('bsod') || msg.includes('not working') || msg.includes('repair') || msg.includes('diagnose')) return AGENT_REGISTRY.troubleshoot_agent;
  if (msg.includes('explain') || msg.includes('what is') || msg.includes('teach me') || msg.includes('tutorial')) return AGENT_REGISTRY.learning_agent;
  if (msg.includes('dealer') || msg.includes('margin') || msg.includes('scheme') || msg.includes('distributor')) return AGENT_REGISTRY.dealer_agent;

  // Image database match
  const imgMatch = findProductImage(message);
  if (imgMatch) {
    return AGENT_REGISTRY.product_intelligence;
  }

  // Default
  return AGENT_REGISTRY.recommendation;
}
