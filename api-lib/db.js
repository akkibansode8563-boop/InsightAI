import dbAdapter from './db/DatabaseAdapter.js';

export async function searchProducts(query = '', filters = {}) {
  return dbAdapter.searchProducts(query, filters);
}

export async function getProductById(id) {
  return dbAdapter.getProductById(id);
}

export async function getCompatibleProducts(productId) {
  const p = await getProductById(productId);
  if (!p?.compatibility?.compatible_accessories) return [];
  const accessories = p.compatibility.compatible_accessories;
  if (accessories.length === 0) return [];
  const allProds = await getAllProducts();
  return allProds.filter(prod => accessories.includes(prod.id));
}

export async function getRelatedAccessories(productId) {
  return getCompatibleProducts(productId);
}

export async function getPlaybook(category) {
  return dbAdapter.getPlaybook(category);
}

export async function getNewsArticles(category = null, limit = 10, page = 1, lang = 'en') {
  return dbAdapter.getNewsArticles(category, limit, page, lang);
}

export async function getLearningModule(topic) {
  return dbAdapter.getLearningModule(topic);
}

export async function getMarketData(category = null, lang = 'en') {
  return dbAdapter.getMarketData(category, lang);
}

export async function getSolutionTemplate(useCase) {
  return dbAdapter.getSolutionTemplate(useCase);
}

export async function getAllProducts() {
  return dbAdapter.getAllProducts();
}

export async function getAllNews() {
  const all = await dbAdapter.getNewsArticles(null, 1000, 1, 'en');
  return all;
}

export async function getAllLearning() {
  const all = await dbAdapter.getLearningModule('');
  if (dbAdapter.learning) {
    return dbAdapter.learning;
  }
  try {
    const db = await dbAdapter.getDb();
    const rows = await db.all('SELECT * FROM learning');
    return rows.map(r => ({
      ...r,
      keywords: JSON.parse(r.keywords || '[]'),
      quiz: JSON.parse(r.quiz || '[]')
    }));
  } catch {
    return [all];
  }
}

export async function getAllSolutions() {
  try {
    const db = await dbAdapter.getDb();
    const rows = await db.all('SELECT * FROM solutions');
    return rows.map(r => ({
      ...r,
      keywords: JSON.parse(r.keywords || '[]'),
      budget_range: JSON.parse(r.budget_range || '{}'),
      components: JSON.parse(r.components || '[]')
    }));
  } catch {
    if (dbAdapter.solutions) {
      return dbAdapter.solutions;
    }
    const single = await dbAdapter.getSolutionTemplate('');
    return [single];
  }
}
