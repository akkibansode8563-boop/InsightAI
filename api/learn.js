import { getAllLearning } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lang = 'en' } = req.query;
  try {
    const modules = await getAllLearning();

    if (lang === 'mr' || lang === 'hi') {
      const localized = modules.map(m => ({
        ...m,
        title: m[`title_${lang}`] || m.title,
        content: m[`content_${lang}`] || m.content,
        quiz: m.quiz?.map(q => ({
          ...q,
          question: q[`question_${lang}`] || q.question,
          options: q[`options_${lang}`] || q.options,
          explanation: q[`explanation_${lang}`] || q.explanation
        }))
      }));
      return res.status(200).json(localized);
    }

    return res.status(200).json(modules);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
