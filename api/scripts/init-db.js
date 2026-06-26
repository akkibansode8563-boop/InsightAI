import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const envPath = path.join(__dirname, '..', '..', '.env');
const dataDir = path.join(__dirname, '..', 'data');

// Load environment variables from .env file manually
try {
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
    console.log("Loaded environment variables from .env");
  }
} catch (err) {
  console.warn("Warning: Could not load .env file:", err.message);
}

// Helper to generate text embeddings using Gemini
async function generateEmbedding(text, apiKey) {
  if (!apiKey) {
    console.warn("Skipping embedding generation: GEMINI_API_KEY is not set.");
    return null;
  }
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
    if (!response.ok) {
      console.warn(`Embedding API response error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data.embedding?.values || null;
  } catch (err) {
    console.warn(`Error calling embedding API: ${err.message}`);
    return null;
  }
}

async function init() {
  console.log('Initializing SQLite database at:', dbPath);

  // Remove existing database file if it exists to clean start
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Deleted existing database file.');
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Enable WAL mode for performance
    await db.exec('PRAGMA journal_mode = WAL;');

    // 1. Products Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        brand TEXT,
        model TEXT,
        category TEXT,
        subcategory TEXT,
        specs TEXT, -- JSON
        pricing TEXT, -- JSON
        street_price_approx INTEGER,
        catalogue_data TEXT, -- JSON
        compatibility TEXT, -- JSON
        knowledge TEXT, -- JSON
        metadata TEXT, -- JSON
        embedding TEXT -- JSON vector array
      )
    `);

    // 2. Playbooks Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS playbooks (
        id TEXT PRIMARY KEY,
        category TEXT,
        subcategory TEXT,
        keywords TEXT, -- JSON Array
        title TEXT,
        discovery_questions TEXT, -- JSON Array
        qualification_checklist TEXT, -- JSON Array
        pitch_formats TEXT, -- JSON Object
        objection_handling TEXT, -- JSON Object
        cross_sell TEXT, -- JSON Array
        upsell TEXT,
        closing_techniques TEXT -- JSON Array
      )
    `);

    // 3. News Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT, -- JSON Array
        date TEXT,
        ai_summary TEXT,
        key_highlights TEXT, -- JSON Array
        business_impact TEXT,
        technical_impact TEXT,
        related_products TEXT, -- JSON Array
        source TEXT,
        confidence TEXT,
        title_mr TEXT,
        title_hi TEXT,
        ai_summary_mr TEXT,
        ai_summary_hi TEXT,
        key_highlights_mr TEXT, -- JSON Array
        key_highlights_hi TEXT, -- JSON Array
        business_impact_mr TEXT,
        business_impact_hi TEXT,
        technical_impact_mr TEXT,
        technical_impact_hi TEXT
      )
    `);

    // 4. Learning Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS learning (
        id TEXT PRIMARY KEY,
        topic TEXT,
        title TEXT,
        keywords TEXT, -- JSON Array
        content TEXT,
        quiz TEXT, -- JSON Array
        title_mr TEXT,
        title_hi TEXT,
        content_mr TEXT,
        content_hi TEXT
      )
    `);

    // 5. Market Categories Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS market_categories (
        name TEXT PRIMARY KEY,
        demand_index TEXT, -- JSON Array
        price_trend TEXT, -- JSON Object
        brands TEXT, -- JSON Array
        top_products TEXT, -- JSON Array
        seasonal_pattern TEXT,
        seasonal_pattern_mr TEXT,
        seasonal_pattern_hi TEXT,
        forecast TEXT, -- JSON Object
        forecast_mr TEXT, -- JSON Object
        forecast_hi TEXT -- JSON Object
      )
    `);

    // 6. Market Summary Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS market_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        overall_trends TEXT,
        overall_trends_mr TEXT,
        overall_trends_hi TEXT,
        last_updated TEXT
      )
    `);

    // 7. Solutions Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS solutions (
        id TEXT PRIMARY KEY,
        use_case TEXT,
        use_case_mr TEXT,
        use_case_hi TEXT,
        keywords TEXT, -- JSON Array
        budget_range TEXT, -- JSON Object
        description TEXT,
        description_mr TEXT,
        description_hi TEXT,
        components TEXT, -- JSON Array
        networking TEXT,
        networking_mr TEXT,
        networking_hi TEXT,
        software TEXT, -- JSON Array
        installation_notes TEXT,
        installation_notes_mr TEXT,
        installation_notes_hi TEXT,
        upgrade_path TEXT,
        upgrade_path_mr TEXT,
        upgrade_path_hi TEXT
      )
    `);

    console.log('Tables created successfully.');

    // --- Seeding Data ---

    // 1. Seed Products
    const productsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
    const insertProduct = await db.prepare(`
      INSERT INTO products (id, brand, model, category, subcategory, specs, pricing, street_price_approx, catalogue_data, compatibility, knowledge, metadata, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of productsData) {
      // Create semantic representation string for embeddings
      const specsStr = Object.entries(p.specs || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
      const useCases = p.knowledge?.use_cases?.join(', ') || '';
      const sellingPoints = p.knowledge?.selling_points?.join(', ') || '';
      const textToEmbed = `${p.brand} ${p.model} - ${p.category} (${p.subcategory}). Specs: ${specsStr}. Use cases: ${useCases}. Selling points: ${sellingPoints}.`.slice(0, 1000);
      
      console.log(`Generating embedding for: ${p.brand} ${p.model}...`);
      const embedding = await generateEmbedding(textToEmbed, process.env.GEMINI_API_KEY);

      await insertProduct.run(
        p.id,
        p.brand,
        p.model,
        p.category,
        p.subcategory,
        JSON.stringify(p.specs || {}),
        JSON.stringify(p.pricing || {}),
        p.pricing?.street_price_approx || null,
        JSON.stringify(p.catalogue_data || {}),
        JSON.stringify(p.compatibility || {}),
        JSON.stringify(p.knowledge || {}),
        JSON.stringify(p.metadata || {}),
        embedding ? JSON.stringify(embedding) : null
      );

      // Sleep briefly to avoid hit of rate-limits in free tier
      if (embedding) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    await insertProduct.finalize();
    console.log(`Seeded ${productsData.length} products.`);

    // 2. Seed Playbooks
    const playbooksData = JSON.parse(fs.readFileSync(path.join(dataDir, 'playbooks.json'), 'utf-8'));
    const insertPlaybook = await db.prepare(`
      INSERT INTO playbooks (id, category, subcategory, keywords, title, discovery_questions, qualification_checklist, pitch_formats, objection_handling, cross_sell, upsell, closing_techniques)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const pb of playbooksData) {
      await insertPlaybook.run(
        pb.id,
        pb.category,
        pb.subcategory,
        JSON.stringify(pb.keywords || []),
        pb.title,
        JSON.stringify(pb.discovery_questions || []),
        JSON.stringify(pb.qualification_checklist || []),
        JSON.stringify(pb.pitch_formats || {}),
        JSON.stringify(pb.objection_handling || {}),
        JSON.stringify(pb.cross_sell || []),
        pb.upsell || null,
        JSON.stringify(pb.closing_techniques || [])
      );
    }
    await insertPlaybook.finalize();
    console.log(`Seeded ${playbooksData.length} playbooks.`);

    // 3. Seed News
    const newsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'news.json'), 'utf-8'));
    const insertNews = await db.prepare(`
      INSERT INTO news (id, title, category, date, ai_summary, key_highlights, business_impact, technical_impact, related_products, source, confidence, title_mr, title_hi, ai_summary_mr, ai_summary_hi, key_highlights_mr, key_highlights_hi, business_impact_mr, business_impact_hi, technical_impact_mr, technical_impact_hi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of newsData) {
      await insertNews.run(
        n.id,
        n.title,
        JSON.stringify(n.category || []),
        n.date,
        n.ai_summary,
        JSON.stringify(n.key_highlights || []),
        n.business_impact,
        n.technical_impact,
        JSON.stringify(n.related_products || []),
        n.source,
        n.confidence,
        n.title_mr || null,
        n.title_hi || null,
        n.ai_summary_mr || null,
        n.ai_summary_hi || null,
        JSON.stringify(n.key_highlights_mr || []),
        JSON.stringify(n.key_highlights_hi || []),
        n.business_impact_mr || null,
        n.business_impact_hi || null,
        n.technical_impact_mr || null,
        n.technical_impact_hi || null
      );
    }
    await insertNews.finalize();
    console.log(`Seeded ${newsData.length} news articles.`);

    // 4. Seed Learning
    const learningData = JSON.parse(fs.readFileSync(path.join(dataDir, 'learning.json'), 'utf-8'));
    const insertLearning = await db.prepare(`
      INSERT INTO learning (id, topic, title, keywords, content, quiz, title_mr, title_hi, content_mr, content_hi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const l of learningData) {
      await insertLearning.run(
        l.id,
        l.topic,
        l.title,
        JSON.stringify(l.keywords || []),
        l.content,
        JSON.stringify(l.quiz || []),
        l.title_mr || null,
        l.title_hi || null,
        l.content_mr || null,
        l.content_hi || null
      );
    }
    await insertLearning.finalize();
    console.log(`Seeded ${learningData.length} learning modules.`);

    // 5. Seed Market Data
    const marketData = JSON.parse(fs.readFileSync(path.join(dataDir, 'market.json'), 'utf-8'));
    
    // Seed market categories
    const insertMarketCat = await db.prepare(`
      INSERT INTO market_categories (name, demand_index, price_trend, brands, top_products, seasonal_pattern, seasonal_pattern_mr, seasonal_pattern_hi, forecast, forecast_mr, forecast_hi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of marketData.categories || []) {
      await insertMarketCat.run(
        c.name,
        JSON.stringify(c.demand_index || []),
        JSON.stringify(c.price_trend || {}),
        JSON.stringify(c.brands || []),
        JSON.stringify(c.top_products || []),
        c.seasonal_pattern || null,
        c.seasonal_pattern_mr || null,
        c.seasonal_pattern_hi || null,
        JSON.stringify(c.forecast || {}),
        JSON.stringify(c.forecast_mr || {}),
        JSON.stringify(c.forecast_hi || {})
      );
    }
    await insertMarketCat.finalize();
    console.log(`Seeded ${marketData.categories?.length || 0} market categories.`);

    // Seed market summary
    const sum = marketData.market_summary || {};
    await db.run(`
      INSERT INTO market_summary (overall_trends, overall_trends_mr, overall_trends_hi, last_updated)
      VALUES (?, ?, ?, ?)
    `,
      sum.overall_trends || null,
      sum.overall_trends_mr || null,
      sum.overall_trends_hi || null,
      sum.last_updated || null
    );
    console.log('Seeded market summary.');

    // 6. Seed Solutions
    const solutionsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'solutions.json'), 'utf-8'));
    const insertSolution = await db.prepare(`
      INSERT INTO solutions (id, use_case, use_case_mr, use_case_hi, keywords, budget_range, description, description_mr, description_hi, components, networking, networking_mr, networking_hi, software, installation_notes, installation_notes_mr, installation_notes_hi, upgrade_path, upgrade_path_mr, upgrade_path_hi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of solutionsData) {
      await insertSolution.run(
        s.id,
        s.use_case,
        s.use_case_mr || null,
        s.use_case_hi || null,
        JSON.stringify(s.keywords || []),
        JSON.stringify(s.budget_range || {}),
        s.description,
        s.description_mr || null,
        s.description_hi || null,
        JSON.stringify(s.components || []),
        s.networking || null,
        s.networking_mr || null,
        s.networking_hi || null,
        JSON.stringify(s.software || []),
        s.installation_notes || null,
        s.installation_notes_mr || null,
        s.installation_notes_hi || null,
        s.upgrade_path || null,
        s.upgrade_path_mr || null,
        s.upgrade_path_hi || null
      );
    }
    await insertSolution.finalize();
    console.log(`Seeded ${solutionsData.length} solutions.`);

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  } finally {
    await db.close();
  }
}

init().catch(err => {
  console.error(err);
  process.exit(1);
});
