import { searchProducts, getPlaybook, getNewsArticles, getSolutionTemplate, getCompatibleProducts } from './db.js';

// Extract entities from user message
function extractEntities(message) {
  const msg = message.toLowerCase();
  const brands = ['hp', 'dell', 'lenovo', 'acer', 'asus', 'apple', 'logitech', 'canon', 'epson', 'brother', 'tp-link', 'ubiquiti', 'hikvision', 'cp plus', 'dahua', 'apc', 'artis', 'samsung', 'lg', 'aoc', 'benq', 'western digital', 'wd', 'kingston', 'seagate', 'intel', 'amd', 'nvidia', 'corsair', 'zebronics'];
  const categories = ['laptop', 'desktop', 'printer', 'monitor', 'router', 'switch', 'camera', 'ups', 'ssd', 'ram', 'keyboard', 'mouse', 'webcam', 'headset', 'projector', 'server', 'nas', 'tablet'];
  const useCases = ['gaming', 'office', 'school', 'lab', 'enterprise', 'home', 'workstation', 'cctv', 'surveillance', 'editing', 'streaming', 'ai', 'data science'];

  const detectedBrands = brands.filter(b => msg.includes(b));
  const detectedCategories = categories.filter(c => msg.includes(c));
  const detectedUseCases = useCases.filter(u => msg.includes(u));

  // Extract price mentions
  const priceMatch = msg.match(/(under|below|budget|within)\s+(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:000)?)/i);
  const maxPrice = priceMatch ? parseInt(priceMatch[2].replace(/,/g, '')) : null;

  return { brands: detectedBrands, categories: detectedCategories, useCases: detectedUseCases, maxPrice };
}

// Build context string with token budget
function buildContextBlock(items, prefix, maxChars = 1500) {
  if (!items || items.length === 0) return '';
  let block = `\n\n=== ${prefix} ===\n`;
  let charCount = block.length;
  for (const item of items) {
    const str = JSON.stringify(item, null, 0) + '\n';
    if (charCount + str.length > maxChars) break;
    block += str;
    charCount += str.length;
  }
  return block;
}

export async function retrieveContext(agentId, message, conversationHistory = []) {
  let context = '';

  try {
    const entities = extractEntities(message);
    const query = message.slice(0, 150);

    switch (agentId) {
      case 'product_intelligence':
      case 'recommendation':
      case 'inventory_agent': {
        const filters = {};
        if (entities.brands[0]) filters.brand = entities.brands[0];
        if (entities.categories[0]) filters.category = entities.categories[0];
        if (entities.maxPrice) filters.maxPrice = entities.maxPrice;
        const products = searchProducts(query, filters);
        context += buildContextBlock(products.map(p => ({
          id: p.id, brand: p.brand, model: p.model, category: p.category,
          specs: p.specs, pricing: p.pricing, in_stock: p.dcc_data?.in_stock,
          use_cases: p.knowledge?.use_cases, selling_points: p.knowledge?.selling_points
        })), 'DCC PRODUCT KNOWLEDGE BASE');
        break;
      }

      case 'compatibility_agent': {
        const products = searchProducts(query, {});
        context += buildContextBlock(products.map(p => ({
          id: p.id, brand: p.brand, model: p.model,
          compatibility: p.compatibility
        })), 'HARDWARE COMPATIBILITY DATA');
        break;
      }

      case 'sales_coach': {
        const category = entities.categories[0] || 'general';
        const playbook = getPlaybook(category);
        if (playbook) {
          context += buildContextBlock([playbook], 'SALES PLAYBOOK');
        }
        const products = searchProducts(query, {});
        context += buildContextBlock(products.map(p => ({
          brand: p.brand, model: p.model,
          selling_points: p.knowledge?.selling_points,
          objection_responses: p.knowledge?.objection_responses,
          target_persona: p.knowledge?.target_persona
        })), 'PRODUCT PITCH DATA');
        break;
      }

      case 'news_agent': {
        const category = entities.categories[0] || null;
        const articles = getNewsArticles(category, 5);
        context += buildContextBlock(articles.map(a => ({
          title: a.title, date: a.date, summary: a.ai_summary,
          highlights: a.key_highlights, business_impact: a.business_impact,
          technical_impact: a.technical_impact
        })), 'LATEST IT NEWS');
        break;
      }

      case 'solution_designer': {
        const useCase = entities.useCases[0] || message.split(' ').slice(0, 5).join(' ');
        const template = getSolutionTemplate(useCase);
        if (template) {
          context += buildContextBlock([template], 'SOLUTION TEMPLATE');
        }
        const products = searchProducts(query, {});
        context += buildContextBlock(products.slice(0, 5).map(p => ({
          id: p.id, brand: p.brand, model: p.model, category: p.category,
          pricing: p.pricing, use_cases: p.knowledge?.use_cases
        })), 'AVAILABLE DCC PRODUCTS');
        break;
      }

      case 'market_intelligence':
      case 'forecast_agent': {
        const { getMarketData } = await import('./db.js');
        const category = entities.categories[0] || null;
        const mktData = getMarketData(category);
        context += buildContextBlock([mktData], 'MARKET INTELLIGENCE DATA');
        break;
      }

      case 'quotation_agent':
      case 'dealer_agent': {
        const products = searchProducts(query, {});
        context += buildContextBlock(products.map(p => ({
          id: p.id, brand: p.brand, model: p.model,
          pricing: p.pricing, in_stock: p.dcc_data?.in_stock
        })), 'PRODUCT PRICING DATA');
        break;
      }

      case 'enterprise_agent': {
        const products = searchProducts('enterprise server workstation', {});
        context += buildContextBlock(products.map(p => ({
          brand: p.brand, model: p.model, category: p.category,
          specs: p.specs, pricing: p.pricing
        })), 'ENTERPRISE PRODUCT CATALOG');
        break;
      }

      case 'learning_agent': {
        const { getLearningModule } = await import('./db.js');
        const module = getLearningModule(message);
        if (module) {
          context += buildContextBlock([module], 'LEARNING CONTENT');
        }
        break;
      }

      default: {
        const products = searchProducts(query, {});
        context += buildContextBlock(products.slice(0, 5).map(p => ({
          brand: p.brand, model: p.model, category: p.category, pricing: p.pricing
        })), 'DCC PRODUCT REFERENCE');
      }
    }
  } catch (err) {
    console.error('RAG error:', err.message);
  }

  return context;
}
