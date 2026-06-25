import { getNewsArticles } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { category, limit = 10, page = 1, lang = 'en' } = req.query;
  try {
    const articles = getNewsArticles(category || null, parseInt(limit), parseInt(page), lang);
    return res.status(200).json({ articles, total: articles.length, page: parseInt(page) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
