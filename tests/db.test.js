import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  searchProducts,
  getProductById,
  getCompatibleProducts,
  getPlaybook,
  getNewsArticles,
  getLearningModule,
  getMarketData,
  getSolutionTemplate
} from '../api-lib/db.js';
import { cosineSimilarity, semanticSearchProducts } from '../api-lib/rag.js';

describe('Database Query unit tests (JSON)', () => {
  // Load environment variables
  beforeAll(async () => {
    try {
      const envPath = path.resolve('.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const idx = trimmed.indexOf('=');
          if (idx === -1) return;
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          process.env[key] = val;
        });
      }
    } catch (e) {
      console.warn("Could not load env in test:", e.message);
    }
  });

  it('should search products with query matching model and brand', async () => {
    const results = await searchProducts('Victus');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].brand.toLowerCase()).toBe('hp');
    expect(results[0].model).toContain('Victus');
  });

  it('should search products with maxPrice filter', async () => {
    const results = await searchProducts('', { maxPrice: 75000 });
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.pricing.street_price_approx).toBeLessThanOrEqual(75000);
    }
  });

  it('should get product by id', async () => {
    const p = await getProductById('hp-victus-15-rtx3050');
    expect(p).not.toBeNull();
    expect(p.brand).toBe('HP');
    expect(p.model).toContain('Victus 15 FA1327TX');
  });

  it('should get null for invalid product id', async () => {
    const p = await getProductById('non-existent-product');
    expect(p).toBeNull();
  });

  it('should get compatible accessories', async () => {
    const acc = await getCompatibleProducts('hp-victus-15-rtx3050');
    expect(acc).toBeInstanceOf(Array);
    expect(acc.length).toBeGreaterThan(0);
  });

  it('should get playbook by category', async () => {
    const playbook = await getPlaybook('laptop');
    expect(playbook).not.toBeNull();
    expect(playbook.title).toContain('Laptop');
  });

  it('should get news articles with localization', async () => {
    const enArticles = await getNewsArticles(null, 5, 1, 'en');
    expect(enArticles.length).toBeGreaterThan(0);

    const mrArticles = await getNewsArticles(null, 5, 1, 'mr');
    expect(mrArticles.length).toBeGreaterThan(0);
    expect(mrArticles[0].title).toBeDefined();
  });

  it('should get learning module by topic', async () => {
    const module = await getLearningModule('hardware-fundamentals');
    expect(module).not.toBeNull();
    expect(module.topic).toBe('hardware-fundamentals');
  });

  it('should get market data and filter categories', async () => {
    const data = await getMarketData('laptops', 'en');
    expect(data.categories).toHaveLength(1);
    expect(data.categories[0].name).toBe('laptops');
    expect(data.market_summary.overall_trends).toBeDefined();
  });

  it('should get solution template matching useCase', async () => {
    const solution = await getSolutionTemplate('Gaming');
    expect(solution).not.toBeNull();
    expect(solution.use_case.toLowerCase()).toContain('gaming');
  });

  it('should calculate cosine similarity correctly', () => {
    const vecA = [1, 2, 3];
    const vecB = [1, 2, 3];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0);

    const vecC = [0, 1, 0];
    const vecD = [1, 0, 0];
    expect(cosineSimilarity(vecC, vecD)).toBeCloseTo(0.0);
  });

  it('should retrieve products semantically', async () => {
    const results = await semanticSearchProducts('High performance gaming laptop');
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    // Highest score should correspond to a gaming device or laptop
    expect(results[0].category).toBe('laptop');
  });
});
