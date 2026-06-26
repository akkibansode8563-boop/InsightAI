import dbAdapter from '../db/DatabaseAdapter.js';
import { Product, NewsArticle, SolutionTemplate } from '../../src/types/index.js';

// Cosine similarity helper
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate query embedding via Gemini API
export async function getQueryEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.embedding?.values || null;
  } catch {
    return null;
  }
}

// Pre-retrieval metadata parser
export function parseQueryMetadata(message: string) {
  const msg = message.toLowerCase();
  const brands = ['hp', 'dell', 'lenovo', 'acer', 'asus', 'apple', 'logitech', 'canon', 'epson', 'brother', 'tp-link', 'ubiquiti', 'hikvision', 'cp plus', 'dahua', 'apc', 'seagate', 'intel', 'amd', 'nvidia'];
  const categories = ['laptop', 'desktop', 'printer', 'monitor', 'router', 'switch', 'camera', 'ups', 'ssd', 'ram', 'server', 'nas', 'tablet'];
  const useCases = ['gaming', 'office', 'school', 'lab', 'enterprise', 'home', 'workstation', 'cctv', 'editing', 'ai', 'data science'];

  const detectedBrands = brands.filter(b => msg.includes(b));
  const detectedCategories = categories.filter(c => msg.includes(c));
  const detectedUseCases = useCases.filter(u => msg.includes(u));

  // Extract price constraints (e.g. "under 80000", "below 1.5 lakh")
  const priceMatch = msg.match(/(under|below|budget|within)\s+(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:000)?)/i);
  let maxPrice: number | null = null;
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[2].replace(/,/g, ''));
    // Handle lakhs (e.g. "1.5 lakh" support is optional but good practice)
  }

  return { brand: detectedBrands[0], category: detectedCategories[0], useCase: detectedUseCases[0], maxPrice };
}

/**
 * Perform semantic search over products with Cosine similarity + keyword fallback
 */
export async function semanticSearchProducts(query: string, filters: any = {}): Promise<(Product & { score: number })[]> {
  const allProducts = await dbAdapter.getAllProducts();
  if (allProducts.length === 0) return [];

  // Get query embedding
  const queryVec = await getQueryEmbedding(query);

  const scoredProducts = allProducts.map(p => {
    let score = 0;
    if (queryVec && p.embedding) {
      const pVec = typeof p.embedding === 'string' ? JSON.parse(p.embedding) : p.embedding;
      score = cosineSimilarity(queryVec, pVec);
    } else {
      // Keyword fallback score (token-based keyword matching)
      const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        const brand = (p.brand || '').toLowerCase();
        const model = (p.model || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        const subcategory = (p.subcategory || '').toLowerCase();
        const specs = JSON.stringify(p.specs || {}).toLowerCase();
        const knowledge = JSON.stringify(p.knowledge || {}).toLowerCase();
        
        let matches = 0;
        for (const token of tokens) {
          if (
            brand.includes(token) ||
            model.includes(token) ||
            category.includes(token) ||
            subcategory.includes(token) ||
            specs.includes(token) ||
            knowledge.includes(token)
          ) {
            matches += 1;
          }
        }
        score = matches / tokens.length;
      }
    }
    return { ...p, score };
  });

  // Apply filters
  let filtered = scoredProducts;
  if (filters.brand) {
    filtered = filtered.filter(p => p.brand.toLowerCase() === filters.brand.toLowerCase());
  }
  if (filters.category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
  }
  if (filters.maxPrice) {
    filtered = filtered.filter(p => {
      const price = p.pricing?.street_price_approx || p.pricing?.mrp;
      return price && price <= filters.maxPrice;
    });
  }

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);
  
  // Re-rank top candidates using token density and exact specification overlap
  const candidates = filtered.slice(0, 6);
  if (candidates.length > 0 && query) {
    const qTokens = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    candidates.forEach(c => {
      let reRankBonus = 0;
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const category = (c.category || '').toLowerCase();
      const specsStr = JSON.stringify(c.specs || {}).toLowerCase();
      
      qTokens.forEach(token => {
        if (model.includes(token)) reRankBonus += 0.05;
        if (brand.includes(token)) reRankBonus += 0.03;
        if (category.includes(token)) reRankBonus += 0.02;
        if (specsStr.includes(token)) reRankBonus += 0.01;
      });

      // Boost score if spec measurements (e.g. 16GB, 512GB, 144Hz) match exactly
      const specMentions = query.toLowerCase().match(/\d+\s*(gb|tb|mb|hz)/gi) || [];
      specMentions.forEach(mention => {
        const clean = mention.replace(/\s+/g, '').toLowerCase();
        if (specsStr.includes(clean)) {
          reRankBonus += 0.1;
        }
      });

      c.score = c.score + reRankBonus;
    });

    candidates.sort((a, b) => b.score - a.score);
  }

  return candidates.slice(0, 3);
}

/**
 * Build a structured citation context block with confidence levels
 */
export function formatContextBlock(items: any[], title: string): string {
  if (items.length === 0) return '';
  let block = `\n\n=== ${title} ===\n`;
  items.forEach((item, idx) => {
    // Add citation metadata
    const confidence = item.score ? `[Source Confidence: ${Math.round(item.score * 100)}%]` : '';
    block += `[Source #${idx + 1}] ${confidence}\n${JSON.stringify(item, null, 0)}\n`;
  });
  return block;
}

/**
 * Complete Advanced RAG context retrieval
 */
export async function retrieveRAGContext(agentId: string, message: string): Promise<{ context: string; confidence: number }> {
  let context = '';
  let overallScore = 0.7; // default average fallback

  try {
    const filters = parseQueryMetadata(message);
    const query = message.slice(0, 150);

    switch (agentId) {
      case 'product_intelligence':
      case 'recommendation':
      case 'inventory_agent': {
        const products = await semanticSearchProducts(query, filters);
        if (products.length > 0) {
          overallScore = products[0].score || 0.8;
        }
        context += formatContextBlock(products.map(p => ({
          id: p.id,
          brand: p.brand,
          model: p.model,
          category: p.category,
          specs: p.specs,
          pricing: p.pricing,
          in_stock: p.catalogue_data?.in_stock,
          selling_points: p.knowledge?.selling_points
        })), 'PRODUCT HARDWARE DATABASE');
        break;
      }

      case 'compatibility_agent': {
        const products = await semanticSearchProducts(query, {});
        context += formatContextBlock(products.map(p => ({
          id: p.id,
          brand: p.brand,
          model: p.model,
          compatibility: p.compatibility
        })), 'COMPATIBILITY MATRIX');
        break;
      }

      case 'sales_coach': {
        const category = filters.category || 'general';
        const playbook = await dbAdapter.getPlaybook(category);
        if (playbook) {
          context += formatContextBlock([playbook], 'SALES TRAINING MANUAL');
        }
        const products = await semanticSearchProducts(query, {});
        context += formatContextBlock(products.map(p => ({
          brand: p.brand,
          model: p.model,
          selling_points: p.knowledge?.selling_points,
          objection_responses: p.knowledge?.objection_responses
        })), 'SALES OBJECTIONS HANDLING');
        break;
      }

      case 'news_agent': {
        const articles = await dbAdapter.getNewsArticles(filters.category || null, 2, 1, 'en');
        context += formatContextBlock(articles.map(a => ({
          title: a.title,
          date: a.date,
          summary: a.ai_summary,
          highlights: a.key_highlights,
          business_impact: a.business_impact
        })), 'IT HARDWARE NEWS BULLETIN');
        break;
      }

      case 'solution_designer': {
        const template = await dbAdapter.getSolutionTemplate(filters.useCase || message);
        if (template) {
          context += formatContextBlock([template], 'REFERENCE SOLUTIONS ARCHITECTURE');
        }
        const products = await semanticSearchProducts(query, {});
        context += formatContextBlock(products.slice(0, 5).map(p => ({
          brand: p.brand,
          model: p.model,
          pricing: p.pricing,
          specs: p.specs
        })), 'PRODUCT CATALOG');
        break;
      }

      case 'market_intelligence':
      case 'forecast_agent': {
        const mktData = await dbAdapter.getMarketData(filters.category || null, 'en');
        context += formatContextBlock([mktData], 'MARKET DATA & SEASONAL INDEX');
        break;
      }

      default: {
        const products = await semanticSearchProducts(query, {});
        context += formatContextBlock(products.slice(0, 5).map(p => ({
          brand: p.brand,
          model: p.model,
          pricing: p.pricing
        })), 'GENERAL HARDWARE REFERENCE');
      }
    }
  } catch (err: any) {
    console.error('Advanced RAG retrieval failed:', err.message);
  }

  return { context, confidence: overallScore };
}
