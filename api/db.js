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

export function getNewsArticles(category = null, limit = 10, page = 1) {
  let articles = news();
  if (category) articles = articles.filter(a => a.category?.includes(category));
  const start = (page - 1) * limit;
  return articles.slice(start, start + limit);
}

export function getLearningModule(topic) {
  return learning().find(m => m.topic === topic || m.keywords?.some(k => topic.toLowerCase().includes(k))) || learning()[0];
}

export function getMarketData(category = null) {
  const m = market();
  if (!category) return m;
  return {
    ...m,
    categories: m.categories?.filter(c => c.name === category)
  };
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
