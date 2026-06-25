export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  return res.status(200).json({
    status: 'ok',
    version: '2.0.0',
    platform: 'Insight AI — Enterprise IT Hardware Intelligence',
    company: 'Enterprise IT Hardware Distribution',
    timestamp: new Date().toISOString(),
    agents: 14,
    primary_llm: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'groq-llama-3.3-70b',
    fallback_llm: 'groq-llama-3.3-70b',
    modules: ['ai_chat', 'sales_coach', 'dealer_portal', 'enterprise_portal', 'solution_designer', 'news_center', 'learning_center', 'market_intelligence'],
    data_categories: 155,
    total_skus: 330000
  });
}
