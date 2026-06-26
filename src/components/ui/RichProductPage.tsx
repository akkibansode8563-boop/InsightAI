import { useState } from 'react';
import { formatINR } from '../../services/calculator.js';

interface RichProductPageProps {
  modelName: string;
  imageUrl?: string;
  overviewText: string;
  specs: Array<{ category: string; spec: string; why: string }>;
  sellingPoints: string[];
  salesPitch: string;
  industries: Array<{ industry: string; useCase: string }>;
  benefits: Array<{ customerType: string; benefit: string }>;
  competitors: Array<{ brand: string; model: string; specDiff: string; priceDiff: string }>;
  compatibilityList?: string[];
  mrp?: number;
  streetPrice?: number;
}

export default function RichProductPage({
  modelName,
  imageUrl,
  overviewText,
  specs,
  sellingPoints,
  salesPitch,
  industries,
  benefits,
  competitors,
  compatibilityList = [],
  mrp = 0,
  streetPrice = 0
}: RichProductPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'sales' | 'pricing' | 'competitors'>('overview');
  
  // Margin calculator states
  const [purchaseCost, setPurchaseCost] = useState<number>(Math.round(streetPrice * 0.9) || Math.round(mrp * 0.8));
  const [quantity, setQuantity] = useState<number>(10);
  const [gstRate] = useState<number>(18);

  const unitProfit = (streetPrice || mrp) - purchaseCost;
  const totalProfit = unitProfit * quantity;
  const marginPercent = ((streetPrice || mrp) - purchaseCost) / (streetPrice || mrp) * 100;
  const gstAmount = Math.round((streetPrice || mrp) * quantity * (gstRate / 100));
  const grandTotal = ((streetPrice || mrp) * quantity) + gstAmount;

  return (
    <div className="w-full my-6 overflow-hidden rounded-2xl border border-[var(--glass-border-strong)] bg-[var(--bg-surface)] shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Hero Banner Header */}
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white flex flex-col md:flex-row items-center gap-6">
        <div className="absolute top-4 right-4 bg-orange-500 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
          Hardware Intelligence Sheet
        </div>
        
        {/* Product Image */}
        {imageUrl ? (
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-white/10 backdrop-blur p-2.5 flex items-center justify-center border border-white/10 shrink-0">
            <img src={imageUrl} alt={modelName} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 p-2.5 flex items-center justify-center border border-white/5 shrink-0 text-4xl">
            💻
          </div>
        )}

        {/* Title Details */}
        <div className="text-center md:text-left flex-1 min-w-0">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-2 truncate">
            {modelName}
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
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

      {/* Tabs Navigation */}
      <div className="border-b border-[var(--glass-border-strong)] bg-slate-50 dark:bg-slate-900/40 flex overflow-x-auto scrollbar-hide">
        {(['overview', 'specs', 'sales', 'pricing', 'competitors'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all duration-200 ${
              activeTab === tab
                ? 'border-orange-500 text-orange-600 bg-white dark:bg-slate-800'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab === 'overview' && '📋 Overview'}
            {tab === 'specs' && '⚙️ Specifications'}
            {tab === 'sales' && '🎯 Pitch & Benefits'}
            {tab === 'pricing' && '💰 Pricing & Margins'}
            {tab === 'competitors' && '⚔️ Competitors'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="p-6 bg-white dark:bg-slate-800/40">
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">Key Highlights</h3>
              <ul className="space-y-2.5">
                {sellingPoints.map((pt, i) => (
                  <li key={i} className="text-sm flex items-start gap-2.5 text-[var(--text-primary)]">
                    <span className="text-orange-500 mt-0.5">⚡</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">Recommended Use-Cases</h3>
              <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)]">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                      <th className="px-4 py-2.5">Target Audience</th>
                      <th className="px-4 py-2.5">Application</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industries.map((ind, i) => (
                      <tr key={i} className="border-b border-[var(--glass-border-strong)] last:border-0">
                        <td className="px-4 py-2.5 font-bold text-[var(--text-primary)]">{ind.industry}</td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">{ind.useCase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {compatibilityList.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Compatible Upgrades</h3>
                  <div className="flex flex-wrap gap-2">
                    {compatibilityList.map((item, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--glass-border-strong)]">
                        🔌 {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Specifications */}
        {activeTab === 'specs' && (
          <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Specification Details</th>
                  <th className="px-4 py-3">Why It Matters</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((sp, i) => (
                  <tr key={i} className="border-b border-[var(--glass-border-strong)] last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)] capitalize">{sp.category}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)] font-mono">{sp.spec}</td>
                    <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-semibold">{sp.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Pitch & Benefits */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-xl border border-orange-500/15">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-700 dark:text-orange-400 mb-2">30-Second Elevator Pitch</h3>
              <p className="text-sm leading-relaxed text-[var(--text-primary)] font-medium">
                "{salesPitch}"
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">Customer Profile Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((b, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[var(--glass-border-strong)] bg-[var(--bg-base)]">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {b.customerType}
                    </div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {b.benefit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Pricing & Margins */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[var(--glass-border-strong)] bg-slate-50 dark:bg-slate-900/20">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Selling Price (INR)
                </label>
                <div className="text-xl font-extrabold text-[var(--text-primary)]">
                  {formatINR(streetPrice || mrp)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Established retail street price</div>
              </div>
              
              <div className="p-4 rounded-xl border border-[var(--glass-border-strong)] bg-slate-50 dark:bg-slate-900/20">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Dealer Cost (INR)
                </label>
                <input
                  type="number"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-[var(--glass-border-strong)] rounded px-2.5 py-1 text-sm font-bold focus:outline-none focus:border-orange-500"
                />
                <div className="text-[10px] text-slate-400 mt-1">Input wholesale purchase cost</div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--glass-border-strong)] bg-slate-50 dark:bg-slate-900/20">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Deal Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-[var(--glass-border-strong)] rounded px-2.5 py-1 text-sm font-bold focus:outline-none focus:border-orange-500"
                />
                <div className="text-[10px] text-slate-400 mt-1">Volume of proposal units</div>
              </div>
            </div>

            {/* Calculations Dashboard */}
            <div className="p-6 rounded-xl border border-emerald-500/15 bg-emerald-50/30 dark:bg-emerald-950/10 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Unit Net Profit
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {formatINR(unitProfit)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Dealer Margin
                </span>
                <span className={`text-lg font-extrabold ${marginPercent >= 15 ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {marginPercent.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Total Deal Profit
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatINR(totalProfit)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Grand Total (w/GST)
                </span>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Competitor Comparison */}
        {activeTab === 'competitors' && (
          <div className="overflow-hidden rounded-xl border border-[var(--glass-border-strong)]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-[var(--glass-border-strong)] text-[var(--text-secondary)] font-bold">
                  <th className="px-4 py-3">Brand & Model</th>
                  <th className="px-4 py-3">Technical Trade-Offs</th>
                  <th className="px-4 py-3">Price Variance</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, i) => (
                  <tr key={i} className="border-b border-[var(--glass-border-strong)] last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{comp.brand} {comp.model}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{comp.specDiff}</td>
                    <td className={`px-4 py-3 font-bold ${comp.priceDiff.includes('-') || comp.priceDiff.includes('Lower') ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {comp.priceDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
