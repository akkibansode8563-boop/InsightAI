import { useState, useEffect } from 'react';
import { formatINR } from '../../services/calculator.js';

interface RichProductPageProps {
  modelName: string;
  imageUrl?: string;
  overviewText: string;
  highlights?: string[];
  specs: Array<{ category: string; spec: string; why: string }>;
  performanceRatings?: Array<{ workload: string; rating: string }>;
  ports?: Array<{ location: string; ports: string }>;
  upgradeOptions?: Array<{ component: string; maxUpgrade: string }>;
  idealUsers?: string[];
  competitors: Array<{ brand: string; model: string; specDiff: string; priceDiff: string }>;
  recommendedConfigs?: Array<{ tier: string; details: string }>;
  salesPitch: string;
  mrp?: number;
  streetPrice?: number;
}

export default function RichProductPage({
  modelName,
  imageUrl,
  overviewText,
  highlights = [],
  specs = [],
  performanceRatings = [],
  ports = [],
  upgradeOptions = [],
  idealUsers = [],
  competitors = [],
  recommendedConfigs = [],
  salesPitch,
  mrp = 0,
  streetPrice = 0
}: RichProductPageProps) {
  // Gallery states
  const [gallery, setGallery] = useState<string[]>(imageUrl ? [imageUrl] : []);
  const [activeImage, setActiveImage] = useState<string>(imageUrl || '');
  
  // Margin calculator states
  const [purchaseCost, setPurchaseCost] = useState<number>(Math.round(streetPrice * 0.9) || Math.round(mrp * 0.8));
  const [quantity, setQuantity] = useState<number>(10);
  const [gstRate] = useState<number>(18);

  const unitProfit = (streetPrice || mrp) - purchaseCost;
  const totalProfit = unitProfit * quantity;
  const marginPercent = ((streetPrice || mrp) - purchaseCost) / (streetPrice || mrp) * 100;
  const gstAmount = Math.round((streetPrice || mrp) * quantity * (gstRate / 100));
  const grandTotal = ((streetPrice || mrp) * quantity) + gstAmount;

  // Fetch dynamic gallery images from product-image API
  useEffect(() => {
    const loadImages = async () => {
      try {
        const res = await fetch(`/api/product-image?model=${encodeURIComponent(modelName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.gallery) {
            setGallery(data.gallery);
            setActiveImage(data.imageUrl);
          } else if (data.imageUrl) {
            setGallery([data.imageUrl]);
            setActiveImage(data.imageUrl);
          }
        }
      } catch (e) {
        console.error("Failed to load product showcase images:", e);
      }
    };
    loadImages();
  }, [modelName, imageUrl]);

  return (
    <div className="w-full my-6 overflow-hidden rounded-2xl border border-[var(--glass-border-strong)] bg-[var(--bg-surface)] shadow-lg transition-all duration-300 hover:shadow-xl">
      
      {/* ── 1. Clean Product Showcase Gallery (Top Section) ── */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-6 flex flex-col items-center justify-center border-b border-[var(--glass-border-strong)]">
        <span className="text-orange-500 text-[10px] font-extrabold uppercase tracking-widest mb-3">
          Product Gallery Showcase
        </span>
        
        {/* Main Clean Image Viewport */}
        <div className="w-60 h-60 md:w-72 md:h-72 flex items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 hover:scale-[1.02]">
          {activeImage ? (
            <img src={activeImage} alt={modelName} className="max-w-full max-h-full object-contain drop-shadow-md" />
          ) : (
            <span className="text-7xl">💻</span>
          )}
        </div>

        {/* Gallery Thumbnails List */}
        {gallery.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto py-1 max-w-full justify-center">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-12 h-12 rounded-lg border p-1 bg-white dark:bg-slate-800 transition-all ${
                  activeImage === img
                    ? 'border-orange-500 ring-2 ring-orange-500/20 scale-105'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <img src={img} alt={`${modelName} thumbnail ${idx}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. Hero Info Banner ── */}
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white">
        <div className="absolute top-4 right-4 bg-orange-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
          Hardware Intelligence Sheet
        </div>
        
        <div className="text-center md:text-left flex-1 min-w-0">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Enterprise Specification Brief</span>
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mt-1 mb-2">
            {modelName}
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
            {overviewText}
          </p>
          {(mrp > 0 || streetPrice > 0) && (
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-xs font-semibold">
              {mrp > 0 && (
                <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                  MRP: {formatINR(mrp)}
                </span>
              )}
              {streetPrice > 0 && (
                <span className="bg-orange-500/20 text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/30">
                  Street Price: {formatINR(streetPrice)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Document Flow ── */}
      <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-800/40 text-[var(--text-primary)]">
        
        {/* Row 1: Highlights & Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Key Highlights */}
          {highlights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                ⭐ Key Highlights
              </h3>
              <ul className="space-y-3">
                {highlights.map((pt, i) => (
                  <li key={i} className="text-sm flex items-start gap-2.5 leading-relaxed">
                    <span className="text-orange-500 mt-0.5">⚡</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specs Table */}
          {specs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                ⚙️ Technical Specifications
              </h3>
              <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Specification</th>
                      <th className="px-4 py-2.5">Why It Matters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border-weak)]">
                    {specs.map((sp, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 font-bold capitalize">{sp.category}</td>
                        <td className="px-4 py-2.5 font-mono text-[var(--text-secondary)]">{sp.spec}</td>
                        <td className="px-4 py-2.5 text-orange-600 dark:text-orange-400 font-semibold">{sp.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Performance Ratings & Connectivity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workload Performance */}
          {performanceRatings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                🚀 Performance Ratings
              </h3>
              <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                      <th className="px-4 py-2.5">Workload Application</th>
                      <th className="px-4 py-2.5">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border-weak)]">
                    {performanceRatings.map((pr, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 font-bold">{pr.workload}</td>
                        <td className="px-4 py-2.5 text-yellow-500 font-mono text-sm tracking-widest">{pr.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ports & Connectivity */}
          {ports.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                🔌 Ports & Connectivity
              </h3>
              <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                      <th className="px-4 py-2.5">Location</th>
                      <th className="px-4 py-2.5">Connectivity Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border-weak)]">
                    {ports.map((po, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-bold">{po.location}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)] font-medium leading-relaxed">{po.ports}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Upgrade Options & Recommended Configurations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upgrade Options */}
          {upgradeOptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                💾 Upgrade Options
              </h3>
              <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                      <th className="px-4 py-2.5">Component</th>
                      <th className="px-4 py-2.5">Maximum Upgrade Ceiling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border-weak)]">
                    {upgradeOptions.map((up, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 font-bold">{up.component}</td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)] font-medium">{up.maxUpgrade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommended Configurations */}
          {recommendedConfigs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                🎯 Recommended Configurations
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {recommendedConfigs.map((cfg, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)] hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all">
                    <span className="text-xs font-extrabold text-orange-500 uppercase tracking-wider">{cfg.tier}</span>
                    <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1 leading-relaxed">{cfg.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Row 4: Ideal Users & Competitor Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ideal Users */}
          {idealUsers.length > 0 && (
            <div className="space-y-4 lg:col-span-1">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                👤 Ideal Target Users
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {idealUsers.map((user, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--glass-border-strong)] shadow-sm">
                    👤 {user}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Competitor Comparison */}
          {competitors.length > 0 && (
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
                🆚 Competitor Comparison Matrix
              </h3>
              <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                      <th className="px-4 py-2.5">Brand & Model</th>
                      <th className="px-4 py-2.5">Technical Differences / Trade-offs</th>
                      <th className="px-4 py-2.5">Price Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border-weak)]">
                    {competitors.map((comp, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 font-bold text-indigo-500">{comp.brand} {comp.model}</td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)] leading-relaxed">{comp.specDiff}</td>
                        <td className={`px-4 py-2.5 font-bold ${
                          comp.priceDiff.includes('-') || comp.priceDiff.toLowerCase().includes('lower') || comp.priceDiff.toLowerCase().includes('save')
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}>
                          {comp.priceDiff}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Row 5: Elevator Pitch & Margin Calculator */}
        <div className="space-y-6 pt-4 border-t border-[var(--glass-border-strong)]">
          {/* Elevator Pitch */}
          {salesPitch && (
            <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-xl border border-orange-500/15">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-700 dark:text-orange-400 mb-2">💬 30-Second Elevator Pitch</h3>
              <blockquote className="text-sm italic leading-relaxed text-[var(--text-primary)] font-medium">
                "{salesPitch}"
              </blockquote>
            </div>
          )}

          {/* Pricing & Margins Calculator */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 border-b border-[var(--glass-border-strong)] pb-2 flex items-center gap-2">
              💰 Proposal Pricing & Deal Margins Calculator
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[var(--glass-border-strong)] bg-slate-50 dark:bg-slate-900/20">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Proposal Selling Price (INR)
                </label>
                <div className="text-xl font-extrabold text-[var(--text-primary)]">
                  {formatINR(streetPrice || mrp)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Established retail/street value</div>
              </div>
              
              <div className="p-4 rounded-xl border border-[var(--glass-border-strong)] bg-slate-50 dark:bg-slate-900/20">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Dealer Landed Cost (INR)
                </label>
                <input
                  type="number"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-[var(--glass-border-strong)] rounded px-2.5 py-1 text-sm font-bold focus:outline-none focus:border-orange-500 text-[var(--text-primary)]"
                />
                <div className="text-[10px] text-slate-400 mt-1">Input wholesale procurement price</div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--glass-border-strong)] bg-slate-50 dark:bg-slate-900/20">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Proposed Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-[var(--glass-border-strong)] rounded px-2.5 py-1 text-sm font-bold focus:outline-none focus:border-orange-500 text-[var(--text-primary)]"
                />
                <div className="text-[10px] text-slate-400 mt-1">Units in this transaction</div>
              </div>
            </div>

            {/* Margin Outputs */}
            <div className="p-6 rounded-xl border border-emerald-500/15 bg-emerald-50/20 dark:bg-emerald-950/10 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Unit Gross Profit
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {formatINR(unitProfit)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Dealer Profit Margin
                </span>
                <span className={`text-lg font-extrabold ${marginPercent >= 15 ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {marginPercent.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Total Profit yield
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatINR(totalProfit)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Grand Proposal (w/ 18% GST)
                </span>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
