import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');

const loadJson = (filename) => {
  return JSON.parse(fs.readFileSync(join(dataDir, filename), 'utf-8'));
};

// Load in-memory JSON data
const products = loadJson('products.json');
const playbooks = loadJson('playbooks.json');
const news = loadJson('news.json');
const learning = loadJson('learning.json');
const market = loadJson('market.json');
const solutions = loadJson('solutions.json');

// Helper to deep copy objects to prevent mutation of the in-memory cache
const clone = (obj) => JSON.parse(JSON.stringify(obj));

export async function searchProducts(query = '', filters = {}) {
  let list = clone(products);

  if (query) {
    const q = query.toLowerCase();
    list = list.filter(p => {
      const brand = (p.brand || '').toLowerCase();
      const model = (p.model || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const subcategory = (p.subcategory || '').toLowerCase();
      const specs = JSON.stringify(p.specs || {}).toLowerCase();
      const knowledge = JSON.stringify(p.knowledge || {}).toLowerCase();
      return brand.includes(q) ||
             model.includes(q) ||
             category.includes(q) ||
             subcategory.includes(q) ||
             specs.includes(q) ||
             knowledge.includes(q);
    });
  }

  if (filters.brand) {
    list = list.filter(p => p.brand.toLowerCase() === filters.brand.toLowerCase());
  }

  if (filters.category) {
    list = list.filter(p => p.category === filters.category);
  }

  if (filters.maxPrice) {
    list = list.filter(p => {
      const price = p.pricing?.street_price_approx || p.street_price_approx;
      return price && price <= filters.maxPrice;
    });
  }

  return list.slice(0, 10);
}

export async function getProductById(id) {
  const p = products.find(p => p.id === id);
  return p ? clone(p) : null;
}

export async function getCompatibleProducts(productId) {
  const p = await getProductById(productId);
  if (!p?.compatibility?.compatible_accessories) return [];
  const accessories = p.compatibility.compatible_accessories;
  if (accessories.length === 0) return [];
  return clone(products.filter(prod => accessories.includes(prod.id)));
}

export async function getRelatedAccessories(productId) {
  return getCompatibleProducts(productId);
}

export async function getPlaybook(category) {
  const match = playbooks.find(pb => {
    const keywords = pb.keywords || [];
    return pb.category === category || keywords.includes(category);
  });
  return match ? clone(match) : null;
}

export async function getNewsArticles(category = null, limit = 10, page = 1, lang = 'en') {
  let list = clone(news);

  if (category) {
    list = list.filter(a => a.category && a.category.includes(category));
  }

  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  if (lang === 'mr' || lang === 'hi') {
    return items.map(item => ({
      ...item,
      title: item[`title_${lang}`] || item.title,
      ai_summary: item[`ai_summary_${lang}`] || item.ai_summary,
      key_highlights: item[`key_highlights_${lang}`]?.length ? item[`key_highlights_${lang}`] : item.key_highlights,
      business_impact: item[`business_impact_${lang}`] || item.business_impact,
      technical_impact: item[`technical_impact_${lang}`] || item.technical_impact
    }));
  }
  return items;
}

export async function getLearningModule(topic) {
  const match = learning.find(l => 
    l.topic === topic || (l.keywords && l.keywords.some(k => topic.toLowerCase().includes(k)))
  );
  return match ? clone(match) : clone(learning[0]);
}

export async function getMarketData(category = null, lang = 'en') {
  let cats = clone(market.categories || []);
  if (category) {
    cats = cats.filter(c => c.name === category);
  }

  let summary = clone(market.market_summary || {});

  let result = {
    categories: cats,
    market_summary: summary
  };

  if (lang === 'mr' || lang === 'hi') {
    return {
      ...result,
      categories: result.categories.map(c => ({
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

export async function getSolutionTemplate(useCase) {
  const uc = useCase.toLowerCase();
  const match = solutions.find(s =>
    s.use_case.toLowerCase().includes(uc) ||
    (s.keywords && s.keywords.some(k => uc.includes(k)))
  );
  return match ? clone(match) : clone(solutions[0]);
}

export async function getAllProducts() {
  return clone(products);
}

export async function getAllNews() {
  return clone(news);
}

export async function getAllLearning() {
  return clone(learning);
}

export async function getAllSolutions() {
  return clone(solutions);
}
