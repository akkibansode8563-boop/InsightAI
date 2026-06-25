import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJSON(filename) {
  try {
    const filePath = join(__dirname, 'data', filename);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to load ${filename}:`, e.message);
    return [];
  }
}

let _products = null, _playbooks = null, _news = null, _learning = null, _market = null, _solutions = null;

function products() { if (!_products) _products = loadJSON('products.json'); return _products; }
function playbooks() { if (!_playbooks) _playbooks = loadJSON('playbooks.json'); return _playbooks; }
function news() { if (!_news) _news = loadJSON('news.json'); return _news; }
function learning() { if (!_learning) _learning = loadJSON('learning.json'); return _learning; }
function market() { if (!_market) _market = loadJSON('market.json'); return _market; }
function solutions() { if (!_solutions) _solutions = loadJSON('solutions.json'); return _solutions; }

export function searchProducts(query = '', filters = {}) {
  const q = query.toLowerCase();
  return products().filter(p => {
    const text = `${p.brand} ${p.model} ${p.category} ${p.subcategory} ${JSON.stringify(p.specs)} ${JSON.stringify(p.knowledge?.use_cases || [])}`.toLowerCase();
    const matchesQuery = !q || text.includes(q);
    const matchesBrand = !filters.brand || p.brand.toLowerCase() === filters.brand.toLowerCase();
    const matchesCategory = !filters.category || p.category === filters.category;
    const matchesPrice = !filters.maxPrice || (p.pricing?.street_price_approx || 0) <= filters.maxPrice;
    return matchesQuery && matchesBrand && matchesCategory && matchesPrice;
  }).slice(0, 10);
}

export function getProductById(id) {
  return products().find(p => p.id === id) || null;
}

export function getCompatibleProducts(productId) {
  const product = getProductById(productId);
  if (!product?.compatibility?.compatible_accessories) return [];
  return product.compatibility.compatible_accessories
    .map(id => getProductById(id))
    .filter(Boolean);
}

export function getRelatedAccessories(productId) {
  return getCompatibleProducts(productId);
}

export function getPlaybook(category) {
  return playbooks().find(p => p.category === category || p.keywords?.includes(category)) || null;
}

export function getNewsArticles(category = null, limit = 10, page = 1, lang = 'en') {
  let articles = news();
  if (category) articles = articles.filter(a => a.category?.includes(category));
  const start = (page - 1) * limit;
  const items = articles.slice(start, start + limit);
  if (lang === 'mr' || lang === 'hi') {
    return items.map(item => ({
      ...item,
      title: item[`title_${lang}`] || item.title,
      ai_summary: item[`ai_summary_${lang}`] || item.ai_summary,
      key_highlights: item[`key_highlights_${lang}`] || item.key_highlights,
      business_impact: item[`business_impact_${lang}`] || item.business_impact,
      technical_impact: item[`technical_impact_${lang}`] || item.technical_impact
    }));
  }
  return items;
}

export function getLearningModule(topic) {
  return learning().find(m => m.topic === topic || m.keywords?.some(k => topic.toLowerCase().includes(k))) || learning()[0];
}

export function getMarketData(category = null, lang = 'en') {
  const m = market();
  let result = m;
  if (category) {
    result = {
      ...m,
      categories: m.categories?.filter(c => c.name === category)
    };
  }
  if (lang === 'mr' || lang === 'hi') {
    return {
      ...result,
      categories: result.categories?.map(c => ({
        ...c,
        seasonal_pattern: c[`seasonal_pattern_${lang}`] || c.seasonal_pattern,
        forecast: {
          ...c.forecast,
          description: c.forecast?.[`description_${lang}`] || c.forecast?.description,
          disclaimer: c.forecast?.[`disclaimer_${lang}`] || c.forecast?.disclaimer
        }
      })),
      market_summary: {
        ...result.market_summary,
        overall_trends: result.market_summary?.[`overall_trends_${lang}`] || result.market_summary?.overall_trends
      }
    };
  }
  return result;
}

export function getSolutionTemplate(useCase) {
  const uc = useCase.toLowerCase();
  return solutions().find(s =>
    s.use_case.toLowerCase().includes(uc) ||
    s.keywords?.some(k => uc.includes(k))
  ) || solutions()[0];
}

export function getAllProducts() { return products(); }
export function getAllNews() { return news(); }
export function getAllLearning() { return learning(); }
export function getAllSolutions() { return solutions(); }
