import { findProductImage, getCategoryImage } from '../api-lib/productImages.js';
import { productImageQuerySchema } from '../api-lib/schemas/validation.js';

/**
 * GET /api/product-image?model=HP+ProLiant+DL380+Gen11
 *
 * Looks up the best matching product image for the given model name.
 * Falls back to Bing Image Search if not in local DB (and BING_KEY is set).
 * Final fallback: category-based placeholder.
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const validationResult = productImageQuerySchema.safeParse(req.query);
  if (!validationResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validationResult.error.flatten().fieldErrors
    });
  }
  const { model, redirect: redirectMode } = validationResult.data;

  const sendImage = async (url) => {
    try {
      const imgRes = await fetch(url);
      if (imgRes.ok) {
        const contentType = imgRes.headers.get('Content-Type') || 'image/png';
        const buffer = await imgRes.arrayBuffer();
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.status(200).end(Buffer.from(buffer));
        return;
      }
    } catch (e) {
      console.error(`Proxy fetch failed for ${url}:`, e.message);
    }
    // Fallback: 302 Redirect
    res.status(302);
    res.setHeader('Location', url);
    res.end();
  };

  // ── 1. Try local product image database ──────────────────────────
  const localMatch = findProductImage(model);
  if (localMatch) {
    if (redirectMode) {
      return sendImage(localMatch.url);
    }
    return res.json({
      found: true,
      source: 'database',
      name: localMatch.name,
      brand: localMatch.brand,
      category: localMatch.category,
      imageUrl: localMatch.url,
      fallbackUrl: localMatch.fallback || getCategoryImage(localMatch.category),
    });
  }

  // ── 2. Try Bing Image Search API (if API key is set) ──────────────
  const bingKey = process.env.BING_SEARCH_KEY;
  if (bingKey) {
    try {
      const searchQ = encodeURIComponent(`${model} official product image transparent background`);
      const bingRes = await fetch(
        `https://api.bing.microsoft.com/v7.0/images/search?q=${searchQ}&count=5&safeSearch=Strict&imageType=Photo`,
        { headers: { 'Ocp-Apim-Subscription-Key': bingKey } }
      );
      if (bingRes.ok) {
        const data = await bingRes.json();
        const imgs = (data.value || []).filter(img =>
          img.contentUrl &&
          (img.contentUrl.includes('.png') || img.contentUrl.includes('.jpg')) &&
          img.width > 200 && img.height > 200
        );
        if (imgs.length > 0) {
          const imageUrl = imgs[0].contentUrl;
          if (redirectMode) {
            return sendImage(imageUrl);
          }
          return res.json({
            found: true,
            source: 'bing',
            name: model,
            brand: detectBrand(model),
            category: detectCategory(model),
            imageUrl,
            thumbnailUrl: imgs[0].thumbnailUrl,
            fallbackUrl: getCategoryImage(detectCategory(model)),
          });
        }
      }
    } catch (e) {
      console.error('Bing image search error:', e.message);
    }
  }

  // ── 3. Try manufacturer website pattern matching ──────────────────
  const patternUrl = getManufacturerPatternUrl(model);
  if (patternUrl) {
    if (redirectMode) {
      return sendImage(patternUrl);
    }
    return res.json({
      found: true,
      source: 'manufacturer_pattern',
      name: model,
      brand: detectBrand(model),
      category: detectCategory(model),
      imageUrl: patternUrl,
      fallbackUrl: getCategoryImage(detectCategory(model)),
    });
  }

  // ── 4. Final fallback: category image ─────────────────────────────
  const category = detectCategory(model);
  const categoryUrl = getCategoryImage(category);
  if (redirectMode) {
    res.status(302);
    res.setHeader('Location', categoryUrl);
    res.end();
    return;
  }
  return res.json({
    found: false,
    source: 'fallback',
    name: model,
    brand: detectBrand(model),
    category,
    imageUrl: categoryUrl,
    fallbackUrl: categoryUrl,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────
function detectBrand(model) {
  const m = model.toLowerCase();
  if (m.startsWith('hp') || m.startsWith('hpe')) return 'HP';
  if (m.startsWith('dell')) return 'Dell';
  if (m.startsWith('lenovo') || m.includes('thinkpad') || m.includes('thinkbook') || m.includes('ideapad')) return 'Lenovo';
  if (m.startsWith('asus')) return 'ASUS';
  if (m.startsWith('acer')) return 'Acer';
  if (m.startsWith('cisco')) return 'Cisco';
  if (m.startsWith('epson')) return 'Epson';
  if (m.startsWith('canon')) return 'Canon';
  if (m.startsWith('samsung')) return 'Samsung';
  if (m.startsWith('seagate')) return 'Seagate';
  if (m.startsWith('western digital') || m.startsWith('wd ')) return 'WD';
  if (m.includes('tp-link') || m.includes('tplink')) return 'TP-Link';
  if (m.startsWith('apple')) return 'Apple';
  if (m.startsWith('microsoft') || m.includes('surface')) return 'Microsoft';
  return 'Unknown';
}

function detectCategory(model) {
  const m = model.toLowerCase();
  if (m.includes('printer') || m.includes('laserjet') || m.includes('deskjet') || m.includes('ecotank') || m.includes('pixma') || m.includes('imagerunner')) return 'printer';
  if (m.includes('server') || m.includes('proliant') || m.includes('poweredge') || m.includes('thinkserver')) return 'server';
  if (m.includes('switch') || m.includes('router') || m.includes('catalyst') || m.includes('eap') || m.includes('wireless') || m.includes('access point')) return 'networking';
  if (m.includes('ssd') || m.includes('hdd') || m.includes('nvme') || m.includes('storage') || m.includes('ironwolf') || m.includes('barracuda') || m.includes('evo')) return 'storage';
  if (m.includes('desktop') || m.includes('tower') || m.includes('workstation') || m.includes('elitedesk') || m.includes('prodesk') || m.includes('optiplex') || m.includes('thinkstation')) return 'desktop';
  // Default to laptop
  return 'laptop';
}

function getManufacturerPatternUrl(model) {
  const m = model.toLowerCase();
  const brand = detectBrand(model).toLowerCase();

  // HP SSL product images — try SKU-based pattern
  if (brand === 'hp' || brand === 'hpe') {
    // HP EliteBook pattern
    if (m.includes('elitebook 840')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08246931.png';
    if (m.includes('elitebook 860')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08413534.png';
    if (m.includes('probook 450')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08213905.png';
    if (m.includes('probook 440')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08213905.png';
    if (m.includes('spectre')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08521804.png';
    if (m.includes('envy')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08194393.png';
    if (m.includes('zbook')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08443571.png';
    if (m.includes('pavilion')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08224424.png';
    if (m.includes('laptop 15')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08169424.png';
    if (m.includes('elitedesk')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08164649.png';
    if (m.includes('prodesk')) return 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08164683.png';
  }

  // Lenovo pattern
  if (brand === 'lenovo') {
    if (m.includes('thinkpad e14')) return 'https://p3-ofp.static.pub/fes/cms/2023/09/21/a81ksq9c36xvfgzm57uh0e1dkpf4ow539289.png';
    if (m.includes('thinkpad x1')) return 'https://p3-ofp.static.pub/fes/cms/2024/02/01/fsa2m8pjm7cqbf9mj4s9x7h3y8lw6r540261.png';
    if (m.includes('thinkbook 14')) return 'https://p3-ofp.static.pub/fes/cms/2023/09/21/t8b52yr3p9w0n5khq6j4v1mx7cg0el941625.png';
    if (m.includes('ideapad slim')) return 'https://p3-ofp.static.pub/fes/cms/2023/02/22/f4mk17w0u89q6bhnx5zrt2gj3v9ce056853.png';
  }

  return null;
}
