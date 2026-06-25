# Insight AI 2.0 — Enterprise IT Hardware Intelligence Platform
*InsightAI IT Hardware Intelligence Platform*

Insight AI 2.0 is a premium, modular, multi-agent AI consulting and business intelligence platform designed for enterprise IT hardware planning and sales consultation. It is designed to assist sales executives, channel partners, dealers, and enterprise clients with IT hardware configurations, pricing, sales coaching, and compatibility analysis.

---

## 🏗️ Platform Architecture

Insight AI 2.0 uses a modern serverless model-fallback architecture. It leverages 100% free AI APIs: Google Gemini 2.0 Flash as the primary model and Groq Llama-3.3-70b-versatile as a robust fallback.

```
                  ┌────────────────────────────────────────┐
                  │          Client UI (React SPA)         │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼ [Proxy Route: /api/*]
                  ┌────────────────────────────────────────┐
                  │       Zero-Dependency API Server       │
                  │             (dev-server.js)            │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼ [Orchestrator: api/chat.js]
                  ┌────────────────────────────────────────┐
                  │            Agent Intent Router         │
                  └──────┬────────────┬────────────┬───────┘
                         │            │            │
                         ▼            ▼            ▼
                     [Agent 1]    [Agent 2]    [Agent ...]
                         │            │            │
                         └────────────┼────────────┘
                                      │
                                      ▼ [RAG Context: api/rag.js]
                  ┌────────────────────────────────────────┐
                  │          Knowledge Graph (JSON)        │
                  │   Products · Playbooks · Solutions...  │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         Primary: Gemini 2.0            │
                  │         Fallback: Groq Llama           │
                  └────────────────────────────────────────┘
```

### Key Architectural Enhancements
1. **Multi-Agent Orchestration**: Features 14 server-side specialized agents (e.g., Compatibility, Sales Coach, Solution Designer, Quotation, Market Intelligence) triggered dynamically based on user intent.
2. **Deterministic Mathematical Engine**: Formulas for ROI, TCO, Margins, and Break-even are parsed programmatically via [calculator.js](src/services/calculator.js), delivering 100% accurate mathematical calculations rather than relying on LLM guesses.
3. **i18n & Language Auto-detection**: Detects and switches automatically between English, Marathi (मराठी), and Hindi (हिन्दी) based on text character ranges or manual toggle.
4. **Server-Side API Keys**: Sensitive API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`) reside purely on the backend, protected from exposure in the client browser bundle.

---

## 📂 Project Structure

```
├── api/                        # Serverless API routes (Vercel compatible)
│   ├── data/                   # JSON Knowledge Base Databases
│   │   ├── products.json       # 150+ products, specifications, and hardware graph
│   │   ├── playbooks.json      # Sales discovery questions & objection scripts
│   │   ├── solutions.json      # Predefined workstation and infrastructure blueprints
│   │   ├── news.json           # Curated IT news feed
│   │   ├── learning.json       # 8 courses, articles, and interactive quizzes
│   │   └── market.json         # Demand indices and regional pricing trends
│   ├── chat.js                 # Multi-agent orchestrator and streaming endpoint
│   ├── db.js                   # JSON database interface
│   ├── dealer.js               # Quotation calculation and schemes endpoint
│   ├── dev-server.js           # Local HTTP node server (runs on port 3001)
│   ├── health.js               # Platform status and active configurations
│   ├── market.js               # Market intelligence analytics endpoint
│   ├── news.js                 # IT news feed endpoint
│   └── rag.js                  # Knowledge graph retrieval engine
├── src/                        # React SPA Frontend
│   ├── components/             # Reusable UI elements (NavBar, etc.)
│   ├── context/                # AppContext global state manager
│   ├── pages/                  # Portal Pages (AIChat, SalesCoach, DealerPortal, etc.)
│   └── services/               # Client-side utility adaptors (calculator, api, language)
├── capacitor.config.ts         # Capacitor Android wrapper config
├── vercel.json                 # Vercel Serverless router rewrites
└── vite.config.js              # Vite bundler configuration (with API dev proxy)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Active Google Gemini API Key or Groq API Key

### Installation

1. Clone the project repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables. Edit the `.env` file in the root folder:
   ```env
   # Google Gemini (Primary API)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.0-flash

   # Groq (Fallback API)
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

### Running Locally

1. **Start the API Dev Server**:
   ```bash
   node api/dev-server.js
   ```
   *The backend will boot up at `http://localhost:3001`.*

2. **Start the Frontend Client**:
   ```bash
   npm run dev
   ```
   *The Vite dev server will boot up at `http://localhost:5173` with proxy forwarding to port 3001.*

---

## 🧪 Testing and Verification

To verify the endpoints locally, you can run the pre-configured verification scripts:

1. **Verify all endpoints**:
   ```bash
   node C:\Users\InsightAI\.gemini\antigravity\brain\982fd788-4794-4714-825f-3b3cf2234b69\scratch\test-endpoints.js
   ```
   *This checks /api/health, /api/news, /api/market, and /api/dealer.*

2. **Verify Gemini API connection directly**:
   ```bash
   node C:\Users\InsightAI\.gemini\antigravity\brain\982fd788-4794-4714-825f-3b3cf2234b69\scratch\test-gemini.js
   ```

3. **Verify Chat Streaming & Fallback**:
   ```bash
   node C:\Users\InsightAI\.gemini\antigravity\brain\982fd788-4794-4714-825f-3b3cf2234b69\scratch\test-chat-stream.js
   ```

---

## 📱 Mobile Build (Capacitor Android)

To build and compile the mobile application wrapper using Capacitor:

```bash
# Compile client app for production
npm run build

# Synchronize assets and plugins with Android project
npm run cap:sync

# Open project in Android Studio
npm run cap:open
```
