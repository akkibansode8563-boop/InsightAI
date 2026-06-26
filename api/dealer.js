import { searchProducts } from '../api-lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET' && req.url?.includes('schemes')) {
    return res.status(200).json({
      schemes: [
        { brand: 'HP', offer: 'Buy 10 laptops get 2% extra margin', valid_until: '2026-07-31', category: 'laptop' },
        { brand: 'Dell', offer: '3-year warranty on all Vostro desktops at no extra cost', valid_until: '2026-07-15', category: 'desktop' },
        { brand: 'Logitech', offer: 'Buy 20 units MK295, get 5% additional discount', valid_until: '2026-06-30', category: 'peripheral' },
        { brand: 'CP Plus', offer: 'CCTV bundle: 8-cam + DVR + cables at ₹18,500', valid_until: '2026-07-31', category: 'cctv' },
        { brand: 'APC', offer: 'Buy 5+ UPS units, get free installation kit', valid_until: '2026-07-31', category: 'ups' }
      ]
    });
  }

  if (req.method === 'POST') {
    const { items = [], gstRate = 18 } = req.body;
    if (!items.length) return res.status(400).json({ error: 'No items provided' });

    const lineItems = items.map((item, i) => {
      const unitPrice = Math.round(item.unitPrice || 0);
      const qty = item.qty || 1;
      const subtotal = unitPrice * qty;
      const margin = item.marginPercent || 10;
      const dealerPrice = Math.round(unitPrice * (1 - margin / 100));
      return {
        sr: i + 1,
        description: item.description || 'Item',
        brand: item.brand || '',
        model: item.model || '',
        qty,
        unitPrice,
        subtotal,
        marginPercent: margin,
        dealerNet: dealerPrice * qty
      };
    });

    const subtotal = lineItems.reduce((s, i) => s + i.subtotal, 0);
    const gstAmount = Math.round(subtotal * gstRate / 100);
    const grandTotal = subtotal + gstAmount;

    const lang = req.body.lang || 'en';
    const termsMap = {
      en: [
        'All prices are MRP inclusive',
        `GST @${gstRate}% applicable as above`,
        'Warranty as per manufacturer terms',
        'Delivery: 2-5 working days for in-stock items',
        'This quotation is valid for 30 days'
      ],
      mr: [
        'सर्व किमती एमआरपी समाविष्ट आहेत',
        `वरीलप्रमाणे जीएसटी @${gstRate}% लागू होईल`,
        'उत्पादकाच्या अटींनुसार वॉरंटी',
        'डिलिव्हरी: स्टॉक असलेल्या वस्तूंसाठी २-५ कामाचे दिवस',
        'हे कोटेशन ३० दिवसांसाठी वैध आहे'
      ],
      hi: [
        'सभी कीमतें एमआरपी सहित हैं',
        `उपरोक्त अनुसार जीएसटी @${gstRate}% लागू होगा`,
        'निर्माता की शर्तों के अनुसार वारंटी',
        'डिलिवरी: स्टॉक वाली वस्तुओं के लिए २-५ कार्य दिवस',
        'यह कोटेशन ३० दिनों के लिए मान्य है'
      ]
    };

    return res.status(200).json({
      quotation: {
        number: `QT-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-IN'),
        valid_until: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-IN'),
        items: lineItems,
        subtotal,
        gstRate,
        gstAmount,
        grandTotal,
        terms: termsMap[lang] || termsMap['en']
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
