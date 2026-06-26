import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const productsJsonPath = path.join(__dirname, '..', 'data', 'products.json');

async function run() {
  if (!fs.existsSync(dbPath)) {
    console.error("Database file not found at:", dbPath);
    return;
  }

  console.log("Reading SQLite database from:", dbPath);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const dbProducts = await db.all("SELECT id, embedding FROM products");
  await db.close();

  console.log(`Fetched ${dbProducts.length} products from SQLite.`);

  const productsJson = JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));
  let updatedCount = 0;

  for (const p of productsJson) {
    const dbMatch = dbProducts.find(dp => dp.id === p.id);
    if (dbMatch && dbMatch.embedding) {
      p.embedding = JSON.parse(dbMatch.embedding);
      updatedCount++;
    }
  }

  fs.writeFileSync(productsJsonPath, JSON.stringify(productsJson, null, 2), 'utf-8');
  console.log(`Successfully updated products.json with ${updatedCount} embedding vectors!`);
}

run().catch(err => {
  console.error("Error exporting embeddings:", err);
});
