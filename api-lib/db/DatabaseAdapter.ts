import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product, Playbook, NewsArticle, LearningModule, MarketData, SolutionTemplate } from '../../src/types/index';

// Resolve directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

export interface IDatabaseAdapter {
  getAllProducts(): Promise<Product[]>;
  searchProducts(query?: string, filters?: Record<string, any>): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getPlaybook(category: string): Promise<Playbook | null>;
  getNewsArticles(category: string | null, limit: number, page: number, lang: string): Promise<NewsArticle[]>;
  getLearningModule(topic: string): Promise<any>;
  getMarketData(category: string | null, lang: string): Promise<any>;
  getSolutionTemplate(useCase: string): Promise<SolutionTemplate | null>;
}

/**
 * JSON File-based Database Adapter (highly compatible with serverless/static hosting)
 */
export class JsonDatabaseAdapter implements IDatabaseAdapter {
  private products: Product[] = [];
  private playbooks: Playbook[] = [];
  private news: NewsArticle[] = [];
  private learning: any[] = [];
  private market: any = {};
  private solutions: SolutionTemplate[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
      this.playbooks = JSON.parse(fs.readFileSync(path.join(dataDir, 'playbooks.json'), 'utf-8'));
      this.news = JSON.parse(fs.readFileSync(path.join(dataDir, 'news.json'), 'utf-8'));
      this.learning = JSON.parse(fs.readFileSync(path.join(dataDir, 'learning.json'), 'utf-8'));
      this.market = JSON.parse(fs.readFileSync(path.join(dataDir, 'market.json'), 'utf-8'));
      this.solutions = JSON.parse(fs.readFileSync(path.join(dataDir, 'solutions.json'), 'utf-8'));
    } catch (err: any) {
      console.warn("JsonDatabaseAdapter: Failed to load json data:", err.message);
    }
  }

  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  async getAllProducts(): Promise<Product[]> {
    return this.clone(this.products);
  }

  async searchProducts(query: string = '', filters: Record<string, any> = {}): Promise<Product[]> {
    let list = this.clone(this.products);

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

  async getProductById(id: string): Promise<Product | null> {
    const p = this.products.find(prod => prod.id === id);
    return p ? this.clone(p) : null;
  }

  async getPlaybook(category: string): Promise<Playbook | null> {
    const match = this.playbooks.find(pb => {
      const keywords = pb.keywords || [];
      return pb.category === category || keywords.includes(category);
    });
    return match ? this.clone(match) : null;
  }

  async getNewsArticles(category: string | null = null, limit: number = 10, page: number = 1, lang: string = 'en'): Promise<NewsArticle[]> {
    let list = this.clone(this.news);

    if (category) {
      list = list.filter(a => a.category && a.category.includes(category));
    }

    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    if (lang === 'mr' || lang === 'hi') {
      return items.map(item => ({
        ...item,
        title: (item as any)[`title_${lang}`] || item.title,
        ai_summary: (item as any)[`ai_summary_${lang}`] || item.ai_summary,
        key_highlights: (item as any)[`key_highlights_${lang}`]?.length ? (item as any)[`key_highlights_${lang}`] : item.key_highlights,
        business_impact: (item as any)[`business_impact_${lang}`] || item.business_impact,
        technical_impact: (item as any)[`technical_impact_${lang}`] || item.technical_impact
      }));
    }
    return items;
  }

  async getLearningModule(topic: string): Promise<any> {
    const match = this.learning.find(l => 
      l.topic === topic || (l.keywords && l.keywords.some((k: string) => topic.toLowerCase().includes(k)))
    );
    return match ? this.clone(match) : this.clone(this.learning[0]);
  }

  async getMarketData(category: string | null = null, lang: string = 'en'): Promise<any> {
    let cats = this.clone(this.market.categories || []);
    if (category) {
      cats = cats.filter((c: any) => c.name === category);
    }

    let summary = this.clone(this.market.market_summary || {});

    const result = {
      categories: cats,
      market_summary: summary
    };

    if (lang === 'mr' || lang === 'hi') {
      return {
        ...result,
        categories: result.categories.map((c: any) => ({
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

  async getSolutionTemplate(useCase: string): Promise<SolutionTemplate | null> {
    const uc = useCase.toLowerCase();
    const match = this.solutions.find(s =>
      s.use_case.toLowerCase().includes(uc) ||
      (s.keywords && s.keywords.some(k => uc.includes(k)))
    );
    return match ? this.clone(match) : this.clone(this.solutions[0]);
  }
}

/**
 * SQLite Database Adapter utilizing dynamic database queries
 */
export class SqliteDatabaseAdapter implements IDatabaseAdapter {
  private db: any = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(dataDir, 'database.sqlite');
  }

  private async getDb() {
    if (this.db) return this.db;
    
    // SQLite dynamic imports
    const sqlite3 = await import('sqlite3');
    const { open } = await import('sqlite');
    
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.default.Database
    });
    return this.db;
  }

  async getAllProducts(): Promise<Product[]> {
    const db = await this.getDb();
    const rows = await db.all('SELECT * FROM products');
    return rows.map((r: any) => ({
      ...r,
      specs: JSON.parse(r.specs || '{}'),
      pricing: JSON.parse(r.pricing || '{}'),
      catalogue_data: JSON.parse(r.catalogue_data || '{}'),
      compatibility: JSON.parse(r.compatibility || '{}'),
      knowledge: JSON.parse(r.knowledge || '{}'),
      metadata: JSON.parse(r.metadata || '{}'),
      embedding: r.embedding ? JSON.parse(r.embedding) : undefined
    }));
  }

  async searchProducts(query: string = '', filters: Record<string, any> = {}): Promise<Product[]> {
    const db = await this.getDb();
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (query) {
      sql += ' AND (brand LIKE ? OR model LIKE ? OR category LIKE ? OR subcategory LIKE ? OR specs LIKE ? OR knowledge LIKE ?)';
      const searchWildcard = `%${query}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
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
    const rows = await db.all(sql, ...params);
    return rows.map((r: any) => ({
      ...r,
      specs: JSON.parse(r.specs || '{}'),
      pricing: JSON.parse(r.pricing || '{}'),
      catalogue_data: JSON.parse(r.catalogue_data || '{}'),
      compatibility: JSON.parse(r.compatibility || '{}'),
      knowledge: JSON.parse(r.knowledge || '{}'),
      metadata: JSON.parse(r.metadata || '{}'),
      embedding: r.embedding ? JSON.parse(r.embedding) : undefined
    }));
  }

  async getProductById(id: string): Promise<Product | null> {
    const db = await this.getDb();
    const row = await db.get('SELECT * FROM products WHERE id = ?', id);
    if (!row) return null;
    return {
      ...row,
      specs: JSON.parse(row.specs || '{}'),
      pricing: JSON.parse(row.pricing || '{}'),
      catalogue_data: JSON.parse(row.catalogue_data || '{}'),
      compatibility: JSON.parse(row.compatibility || '{}'),
      knowledge: JSON.parse(row.knowledge || '{}'),
      metadata: JSON.parse(row.metadata || '{}'),
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined
    };
  }

  async getPlaybook(category: string): Promise<Playbook | null> {
    const db = await this.getDb();
    const rows = await db.all('SELECT * FROM playbooks');
    const playbooks = rows.map((r: any) => ({
      ...r,
      keywords: JSON.parse(r.keywords || '[]'),
      discovery_questions: JSON.parse(r.discovery_questions || '[]'),
      qualification_checklist: JSON.parse(r.qualification_checklist || '[]'),
      pitch_formats: JSON.parse(r.pitch_formats || '{}'),
      objection_handling: JSON.parse(r.objection_handling || '{}'),
      cross_sell: JSON.parse(r.cross_sell || '[]'),
      closing_techniques: JSON.parse(r.closing_techniques || '[]')
    }));

    const match = playbooks.find(pb => {
      const keywords = pb.keywords || [];
      return pb.category === category || keywords.includes(category);
    });
    return match || null;
  }

  async getNewsArticles(category: string | null = null, limit: number = 10, page: number = 1, lang: string = 'en'): Promise<NewsArticle[]> {
    const db = await this.getDb();
    let sql = 'SELECT * FROM news WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }

    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await db.all(sql, ...params);
    return rows.map((r: any) => {
      const article = {
        ...r,
        category: JSON.parse(r.category || '[]'),
        key_highlights: JSON.parse(r.key_highlights || '[]'),
        related_products: JSON.parse(r.related_products || '[]')
      };

      if (lang === 'mr' || lang === 'hi') {
        return {
          ...article,
          title: r[`title_${lang}`] || r.title,
          ai_summary: r[`ai_summary_${lang}`] || r.ai_summary,
          key_highlights: r[`key_highlights_${lang}`] ? JSON.parse(r[`key_highlights_${lang}`]) : article.key_highlights,
          business_impact: r[`business_impact_${lang}`] || r.business_impact,
          technical_impact: r[`technical_impact_${lang}`] || r.technical_impact
        };
      }
      return article;
    });
  }

  async getLearningModule(topic: string): Promise<any> {
    const db = await this.getDb();
    const rows = await db.all('SELECT * FROM learning');
    const modules = rows.map((r: any) => ({
      ...r,
      keywords: JSON.parse(r.keywords || '[]'),
      quiz: JSON.parse(r.quiz || '[]')
    }));

    const match = modules.find(l => 
      l.topic === topic || (l.keywords && l.keywords.some((k: string) => topic.toLowerCase().includes(k)))
    );
    return match || modules[0];
  }

  async getMarketData(category: string | null = null, lang: string = 'en'): Promise<any> {
    const db = await this.getDb();
    
    let cats = await db.all('SELECT * FROM market_categories');
    cats = cats.map((c: any) => ({
      ...c,
      demand_index: JSON.parse(c.demand_index || '[]'),
      price_trend: JSON.parse(c.price_trend || '{}'),
      brands: JSON.parse(c.brands || '[]'),
      top_products: JSON.parse(c.top_products || '[]'),
      forecast: JSON.parse(c.forecast || '{}')
    }));

    if (category) {
      cats = cats.filter((c: any) => c.name === category);
    }

    const summaryRow = await db.get('SELECT * FROM market_summary ORDER BY id DESC LIMIT 1');
    const summary = summaryRow ? {
      overall_trends: summaryRow.overall_trends,
      overall_trends_mr: summaryRow.overall_trends_mr,
      overall_trends_hi: summaryRow.overall_trends_hi,
      last_updated: summaryRow.last_updated
    } : {};

    const result = {
      categories: cats,
      market_summary: summary
    };

    if (lang === 'mr' || lang === 'hi') {
      return {
        ...result,
        categories: result.categories.map((c: any) => {
          const forecastMrHi = c[`forecast_${lang}`] ? JSON.parse(c[`forecast_${lang}`]) : {};
          return {
            ...c,
            seasonal_pattern: c[`seasonal_pattern_${lang}`] || c.seasonal_pattern,
            forecast: {
              ...c.forecast,
              ...forecastMrHi,
              description: forecastMrHi.description || c.forecast?.description,
              disclaimer: forecastMrHi.disclaimer || c.forecast?.disclaimer
            }
          };
        }),
        market_summary: {
          ...result.market_summary,
          overall_trends: (result.market_summary as any)[`overall_trends_${lang}`] || result.market_summary.overall_trends
        }
      };
    }

    return result;
  }

  async getSolutionTemplate(useCase: string): Promise<SolutionTemplate | null> {
    const db = await this.getDb();
    const rows = await db.all('SELECT * FROM solutions');
    const templates = rows.map((r: any) => ({
      ...r,
      keywords: JSON.parse(r.keywords || '[]'),
      budget_range: JSON.parse(r.budget_range || '{}'),
      components: JSON.parse(r.components || '[]')
    }));

    const uc = useCase.toLowerCase();
    const match = templates.find(s =>
      s.use_case.toLowerCase().includes(uc) ||
      (s.keywords && s.keywords.some(k => uc.includes(k)))
    );
    return match || templates[0];
  }
}

// Export singleton database client based on environment
let adapter: IDatabaseAdapter;
const dbType = process.env.DB_ADAPTER || 'json';

if (dbType === 'sqlite' && fs.existsSync(path.join(dataDir, 'database.sqlite'))) {
  adapter = new SqliteDatabaseAdapter();
} else {
  adapter = new JsonDatabaseAdapter();
}

export default adapter;
