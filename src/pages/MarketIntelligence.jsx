import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLOR = '#10b981'; // Green accent for Market Intelligence

export default function MarketIntelligence() {
  const { language, t } = useApp();
  const [marketData, setMarketData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('laptops');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarket = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/market?category=${selectedCategory}&lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          setMarketData(data);
        } else {
          // Fallback to fetch market.json directly
          const fallbackRes = await fetch('/api/data/market.json');
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const catData = data.categories?.find(c => c.name === selectedCategory) || data.categories?.[0];
            const localizedCat = catData ? {
              ...catData,
              seasonal_pattern: catData[`seasonal_pattern_${language}`] || catData.seasonal_pattern,
              forecast: {
                ...catData.forecast,
                description: catData.forecast?.[`description_${language}`] || catData.forecast?.description,
                disclaimer: catData.forecast?.[`disclaimer_${language}`] || catData.forecast?.disclaimer
              }
            } : null;
            const localizedSummary = {
              ...data.market_summary,
              overall_trends: data.market_summary?.[`overall_trends_${language}`] || data.market_summary?.overall_trends
            };
            setMarketData({
              ...data,
              categories: localizedCat ? [localizedCat] : [],
              market_summary: localizedSummary
            });
          }
        }
      } catch (err) {
        console.error("Failed to load market data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMarket();
  }, [selectedCategory, language]);

  const activeCategory = marketData?.categories?.[0];

  // Map data for Recharts
  const demandIndexData = activeCategory?.demand_index?.map((val, idx) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      month: t('market.month.' + months[idx]) || months[idx],
      value: val
    };
  }) || [];

  const history = activeCategory?.price_trend?.history || [];
  const projected = activeCategory?.price_trend?.projected || [];
  
  const priceTrendData = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  
  history.forEach((val, idx) => {
    priceTrendData.push({
      month: t('market.month.' + months[idx]) || months[idx],
      History: val,
      Forecast: null
    });
  });
  
  if (priceTrendData.length > 0 && projected.length > 0) {
    priceTrendData[priceTrendData.length - 1].Forecast = priceTrendData[priceTrendData.length - 1].History;
  }
  
  projected.forEach((val, idx) => {
    const monthIdx = history.length + idx;
    priceTrendData.push({
      month: months[monthIdx] ? (t('market.month.' + months[monthIdx]) || months[monthIdx]) : `F${idx+1}`,
      History: null,
      Forecast: val
    });
  });

  const brandData = activeCategory?.brands || [];
  const pieColors = [COLOR, '#34d399', '#60a5fa', '#f59e0b', '#a78bfa'];

  const CAT_TRANSLATION_KEYS = {
    'laptops': 'sales.playbook.laptop',
    'networking': 'sales.playbook.network',
    'printers': 'sales.playbook.printer'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="aurora-mesh" />

      {/* Header */}
      <div
        style={{
          padding: '32px 40px',
          background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)`,
          borderBottom: '1px solid var(--glass-border-strong)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: `${COLOR}18`,
              border: `2px solid ${COLOR}35`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            📊
          </div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.5em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {t('module.market.title')}
            </h1>
            <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 6 }}>
              {t('module.market.desc')}
            </p>
          </div>
        </div>

        {/* Category selector */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-elevated)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border-strong)' }}>
          {['laptops', 'networking', 'printers'].map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isSelected ? 'var(--bg-surface)' : 'transparent',
                  color: isSelected ? COLOR : 'var(--text-secondary)',
                  fontSize: '0.8em',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {t(CAT_TRANSLATION_KEYS[cat] || cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', zIndex: 10 }} className="custom-scrollbar">
        {loading || !activeCategory ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
            {t('market.loading')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Chart 1: Demand Index */}
            <div className="glass-strong" style={{ padding: 24, display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontSize: '0.96em', fontWeight: 800, margin: '0 0 20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📈 {t('market.demandIndexTitle')}
              </h3>
              
              <div style={{ flex: 1, height: 200, minHeight: 200, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandIndexData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor={COLOR} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--radius-md)' }}
                      labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)' }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Price Trend & Forecast */}
            <div className="glass-strong" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontSize: '0.96em', fontWeight: 800, margin: '0 0 20px', color: 'var(--text-primary)' }}>
                💰 {t('market.priceTrendTitle')}
              </h3>

              <div style={{ height: 200, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={COLOR} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ea580c" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border-strong)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--radius-md)' }}
                      labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)' }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, undefined]}
                    />
                    <Area
                      type="monotone"
                      dataKey="History"
                      stroke={COLOR}
                      strokeWidth={3.5}
                      fillOpacity={1}
                      fill="url(#historyGrad)"
                      dot={{ r: 4, stroke: 'var(--bg-surface)', strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                    />
                    <Area
                      type="monotone"
                      dataKey="Forecast"
                      stroke="#ea580c"
                      strokeWidth={3.5}
                      strokeDasharray="6 4"
                      fillOpacity={1}
                      fill="url(#forecastGrad)"
                      dot={{ r: 4, stroke: 'var(--bg-surface)', strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Custom Labels overlay to match original style */}
                <div style={{ position: 'absolute', top: -12, right: 12, display: 'flex', gap: 12, fontSize: '0.66em', fontWeight: 700 }}>
                  <span style={{ color: COLOR, display: 'flex', alignItems: 'center', gap: 4 }}>● {t('market.chart.history')}</span>
                  <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: 4 }}>-- {t('market.chart.forecast')}</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Brand Market Share */}
            <div className="glass-strong" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontSize: '0.96em', fontWeight: 800, margin: '0 0 20px', color: 'var(--text-primary)' }}>
                🏬 {t('market.brandShareTitle')}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="share"
                    >
                      {brandData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--radius-md)' }}
                      formatter={(value) => [`${value}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 16 }}>
                  {brandData.map((brand, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8em' }} className="hover-scale">
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: pieColors[i % pieColors.length] }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">{brand.name}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontWeight: 800 }}>{brand.share}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Demand Calendar & Seasonal Pattern */}
            <div className="glass-strong" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <h3 className="font-heading" style={{ fontSize: '0.96em', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
                  📅 {t('market.seasonalPatternTitle')}
                </h3>
                <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {activeCategory.seasonal_pattern}
                </p>
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  background: 'rgba(249, 115, 22, 0.04)',
                  border: '1.5px dashed rgba(249, 115, 22, 0.25)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span style={{ fontSize: '0.74em', fontWeight: 850, color: '#e65100', textTransform: 'uppercase', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                  🔥 {t('market.peakWindowTag')}
                </span>
                <span style={{ fontSize: '0.84em', color: 'var(--text-primary)', fontWeight: 650 }}>
                  {t('market.peakWindowDesc')}
                </span>
              </div>
            </div>

            {/* Full-width Section: AI Forecast & Disclaimer */}
            <div className="glass-strong" style={{ padding: 24, gridColumn: '1 / -1', borderRadius: 'var(--radius-lg)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 18,
                  background: 'rgba(16, 185, 129, 0.04)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  padding: 22,
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ fontSize: '2.2em', filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.15))' }}>🔮</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 className="font-heading" style={{ margin: '0 0 8px', fontWeight: 850, fontSize: '1em', color: COLOR }}>
                    {t('market.forecastTitle')}
                  </h4>
                  <p style={{ fontSize: '0.85em', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 14 }}>
                    {activeCategory.forecast?.description}
                  </p>
                  
                  {/* Alert Disclaimer */}
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.04)',
                      borderLeft: '3.5px solid #ef4444',
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: '0.76em',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5
                    }}
                  >
                    ⚠️ <strong>{t('market.disclaimerTag')}:</strong> {activeCategory.forecast?.disclaimer}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
