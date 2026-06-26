import http from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file manually
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = join(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf-8');
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
} catch (err) {
  console.warn("Warning: Could not load .env file:", err.message);
}

// Import handlers dynamically
import healthHandler from './api/health.js';
// db is not a serverless endpoint itself, but we have news, market, dealer, chat
import newsHandler from './api/news.js';
import marketHandler from './api/market.js';
import dealerHandler from './api/dealer.js';
import chatHandler from './api/chat.ts';
import learnHandler from './api/learn.js';
import productImageHandler from './api/product-image.js';
import telemetryHandler from './api/telemetry.ts';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Helper to construct Vercel-like response object
  const vercelRes = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      res.setHeader(name, value);
      return this;
    },
    status(code) {
      this.statusCode = code;
      res.statusCode = code;
      return this;
    },
    json(body) {
      if (!this.headers['Content-Type']) {
        this.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(body));
      return this;
    },
    write(chunk) {
      res.write(chunk);
      return this;
    },
    end(data) {
      res.end(data);
      return this;
    }
  };

  // Helper to parse JSON body
  const getBody = () => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  // Vercel-like request object extension
  const vercelReq = {
    method: req.method,
    headers: req.headers,
    url: req.url,
    query: parsedUrl.query,
    body: req.method === 'POST' ? await getBody() : {},
    socket: req.socket
  };

  console.log(`[API] ${req.method} ${pathname}`);

  try {
    if (pathname === '/api/health') {
      await healthHandler(vercelReq, vercelRes);
    } else if (pathname === '/api/news') {
      await newsHandler(vercelReq, vercelRes);
    } else if (pathname === '/api/market') {
      await marketHandler(vercelReq, vercelRes);
    } else if (pathname.startsWith('/api/dealer')) {
      await dealerHandler(vercelReq, vercelRes);
    } else if (pathname === '/api/chat') {
      await chatHandler(vercelReq, vercelRes);
    } else if (pathname === '/api/learn') {
      await learnHandler(vercelReq, vercelRes);
    } else if (pathname === '/api/product-image') {
      await productImageHandler(vercelReq, vercelRes);
    } else if (pathname === '/api/telemetry') {
      await telemetryHandler(vercelReq, vercelRes);
    } else {
      vercelRes.status(404).json({ error: 'Not Found' });
    }
  } catch (err) {
    console.error(`[API Error] at ${pathname}:`, err);
    vercelRes.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`API Dev Server running at http://localhost:${PORT}`);
});
