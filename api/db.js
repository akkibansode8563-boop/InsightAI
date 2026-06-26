import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'data', 'database.sqlite');

let dbInstance = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  return dbInstance;
}

export async function searchProducts(query = '', filters = {}) {
  const db = await getDb();
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  
  if (query) {
    sql += ` AND (
      brand LIKE ? OR
      model LIKE ? OR
      category LIKE ? OR
      subcategory LIKE ? OR
      specs LIKE ? OR
      knowledge LIKE ?
    )`;
    const searchPattern = `%${query}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  if (filters.brand) {
    sql += ' AND LOWER(brand) = LOWER(?)';
    params.push(filters.brand);
  }
  
  if (filters.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }
  
  if (filters.maxPrice) {
    sql += ' AND street_price_approx <= ?';
    params.push(filters.maxPrice);
  }
  
  sql += ' LIMIT 10';
  
  const rows = await db.all(sql, params);
  return rows.map(r => ({
    ...r,
    specs: JSON.parse(r.specs || '{}'),
    pricing: JSON.parse(r.pricing || '{}'),
    catalogue_data: JSON.parse(r.catalogue_data || '{}'),
    compatibility: JSON.parse(r.compatibility || '{}'),
    knowledge: JSON.parse(r.knowledge || '{}'),
    metadata: JSON.parse(r.metadata || '{}')
  }));
}

export async function getProductById(id) {
  const db = await getDb();
  const r = await db.get('SELECT * FROM products WHERE id = ?', id);
  if (!r) return null;
  return {
    ...r,
    specs: JSON.parse(r.specs || '{}'),
    pricing: JSON.parse(r.pricing || '{}'),
    catalogue_data: JSON.parse(r.catalogue_data || '{}'),
    compatibility: JSON.parse(r.compatibility || '{}'),
    knowledge: JSON.parse(r.knowledge || '{}'),
    metadata: JSON.parse(r.metadata || '{}')
  };
}

export async function getCompatibleProducts(productId) {
  const product = await getProductById(productId);
  if (!product?.compatibility?.compatible_accessories) return [];
  const accessories = product.compatibility.compatible_accessories;
  if (accessories.length === 0) return [];
  
  const db = await getDb();
  const placeholders = accessories.map(() => '?').join(',');
  const rows = await db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, accessories);
  
  const map = {};
  for (const r of rows) {
    const p = {
      ...r,
      specs: JSON.parse(r.specs || '{}'),
      pricing: JSON.parse(r.pricing || '{}'),
      catalogue_data: JSON.parse(r.catalogue_data || '{}'),
      compatibility: JSON.parse(r.compatibility || '{}'),
      knowledge: JSON.parse(r.knowledge || '{}'),
      metadata: JSON.parse(r.metadata || '{}')
    };
    map[p.id] = p;
  }
  return accessories.map(id => map[id]).filter(Boolean);
}

export async function getRelatedAccessories(productId) {
  return getCompatibleProducts(productId);
}

export async function getPlaybook(category) {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM playbooks');
  const playbook = rows.find(r => {
    const keywords = JSON.parse(r.keywords || '[]');
    return r.category === category || keywords.includes(category);
  });
  if (!playbook) return null;
  return {
    ...playbook,
    keywords: JSON.parse(playbook.keywords || '[]'),
    discovery_questions: JSON.parse(playbook.discovery_questions || '[]'),
    qualification_checklist: JSON.parse(playbook.qualification_checklist || '[]'),
    pitch_formats: JSON.parse(playbook.pitch_formats || '{}'),
    objection_handling: JSON.parse(playbook.objection_handling || '{}'),
    cross_sell: JSON.parse(playbook.cross_sell || '[]'),
    closing_techniques: JSON.parse(playbook.closing_techniques || '[]')
  };
}

export async function getNewsArticles(category = null, limit = 10, page = 1, lang = 'en') {
  const db = await getDb();
  let rows = await db.all('SELECT * FROM news ORDER BY date DESC');
  
  const articles = rows.map(r => ({
    ...r,
    category: JSON.parse(r.category || '[]'),
    key_highlights: JSON.parse(r.key_highlights || '[]'),
    key_highlights_mr: JSON.parse(r.key_highlights_mr || '[]'),
    key_highlights_hi: JSON.parse(r.key_highlights_hi || '[]'),
    related_products: JSON.parse(r.related_products || '[]')
  }));
  
  let filtered = articles;
  if (category) {
    filtered = articles.filter(a => a.category.includes(category));
  }
  
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  
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
  const db = await getDb();
  const rows = await db.all('SELECT * FROM learning');
  const parsed = rows.map(r => ({
    ...r,
    keywords: JSON.parse(r.keywords || '[]'),
    quiz: JSON.parse(r.quiz || '[]')
  }));
  
  const match = parsed.find(m => m.topic === topic || m.keywords.some(k => topic.toLowerCase().includes(k)));
  return match || parsed[0];
}

export async function getMarketData(category = null, lang = 'en') {
  const db = await getDb();
  
  let catSql = 'SELECT * FROM market_categories';
  const catParams = [];
  if (category) {
    catSql += ' WHERE name = ?';
    catParams.push(category);
  }
  const catRows = await db.all(catSql, catParams);
  const categories = catRows.map(c => ({
    name: c.name,
    demand_index: JSON.parse(c.demand_index || '[]'),
    price_trend: JSON.parse(c.price_trend || '{}'),
    brands: JSON.parse(c.brands || '[]'),
    top_products: JSON.parse(c.top_products || '[]'),
    seasonal_pattern: c.seasonal_pattern,
    seasonal_pattern_mr: c.seasonal_pattern_mr,
    seasonal_pattern_hi: c.seasonal_pattern_hi,
    forecast: JSON.parse(c.forecast || '{}'),
    forecast_mr: JSON.parse(c.forecast_mr || '{}'),
    forecast_hi: JSON.parse(c.forecast_hi || '{}')
  }));
  
  const summaryRow = await db.get('SELECT * FROM market_summary LIMIT 1');
  const market_summary = summaryRow ? {
    overall_trends: summaryRow.overall_trends,
    overall_trends_mr: summaryRow.overall_trends_mr,
    overall_trends_hi: summaryRow.overall_trends_hi,
    last_updated: summaryRow.last_updated
  } : {};
  
  let result = {
    categories,
    market_summary
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
  const db = await getDb();
  const rows = await db.all('SELECT * FROM solutions');
  const parsed = rows.map(s => ({
    ...s,
    keywords: JSON.parse(s.keywords || '[]'),
    budget_range: JSON.parse(s.budget_range || '{}'),
    components: JSON.parse(s.components || '[]'),
    software: JSON.parse(s.software || '[]')
  }));
  
  const uc = useCase.toLowerCase();
  const match = parsed.find(s =>
    s.use_case.toLowerCase().includes(uc) ||
    s.keywords.some(k => uc.includes(k))
  );
  return match || parsed[0];
}

export async function getAllProducts() {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM products');
  return rows.map(r => ({
    ...r,
    specs: JSON.parse(r.specs || '{}'),
    pricing: JSON.parse(r.pricing || '{}'),
    catalogue_data: JSON.parse(r.catalogue_data || '{}'),
    compatibility: JSON.parse(r.compatibility || '{}'),
    knowledge: JSON.parse(r.knowledge || '{}'),
    metadata: JSON.parse(r.metadata || '{}')
  }));
}

export async function getAllNews() {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM news ORDER BY date DESC');
  return rows.map(r => ({
    ...r,
    category: JSON.parse(r.category || '[]'),
    key_highlights: JSON.parse(r.key_highlights || '[]'),
    key_highlights_mr: JSON.parse(r.key_highlights_mr || '[]'),
    key_highlights_hi: JSON.parse(r.key_highlights_hi || '[]'),
    related_products: JSON.parse(r.related_products || '[]')
  }));
}

export async function getAllLearning() {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM learning');
  return rows.map(r => ({
    ...r,
    keywords: JSON.parse(r.keywords || '[]'),
    quiz: JSON.parse(r.quiz || '[]')
  }));
}

export async function getAllSolutions() {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM solutions');
  return rows.map(s => ({
    ...s,
    keywords: JSON.parse(s.keywords || '[]'),
    budget_range: JSON.parse(s.budget_range || '{}'),
    components: JSON.parse(s.components || '[]'),
    software: JSON.parse(s.software || '[]')
  }));
}
