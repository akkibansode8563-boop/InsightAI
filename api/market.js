import { getMarketData } from './db.js';
import { marketQuerySchema } from './schemas/validation.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const validationResult = marketQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.flatten().fieldErrors
      });
    }
    const { category, lang } = validationResult.data;

    const data = await getMarketData(category || null, lang);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
