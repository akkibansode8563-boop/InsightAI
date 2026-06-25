import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

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
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 200, paddingBottom: 12, borderBottom: '1.5px solid var(--glass-border-strong)', position: 'relative' }}>
                {activeCategory.demand_index?.map((val, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }} className="hover-scale">
                    <span style={{ fontSize: '0.7em', fontWeight: 800, color: COLOR, marginBottom: 6 }}>
                      {val}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${val * 1.6}px`,
                        background: `linear-gradient(to top, ${COLOR}, #34d399)`,
                        borderRadius: '6px 6px 0 0',
                        boxShadow: `0 4px 12px ${COLOR}20`,
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10 }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
                  <span key={i} style={{ fontSize: '0.74em', color: 'var(--text-secondary)', fontWeight: 650 }}>{t('market.month.' + month)}</span>
                ))}
              </div>
            </div>

            {/* Chart 2: Price Trend & Forecast */}
            <div className="glass-strong" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontSize: '0.96em', fontWeight: 800, margin: '0 0 20px', color: 'var(--text-primary)' }}>
                💰 {t('market.priceTrendTitle')}
              </h3>

              <div style={{ height: 200, position: 'relative', borderBottom: '1.5px solid var(--glass-border-strong)', borderLeft: '1.5px solid var(--glass-border-strong)', padding: '10px 10px 0 10px' }}>
                <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="0" y1="37" x2="300" y2="37" stroke="var(--glass-border-strong)" strokeDasharray="3" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="var(--glass-border-strong)" strokeDasharray="3" />
                  <line x1="0" y1="112" x2="300" y2="112" stroke="var(--glass-border-strong)" strokeDasharray="3" />

                  {/* Area Gradient Background */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={COLOR} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area Fill */}
                  <path
                    d="M10,150 L10,120 L50,110 L90,115 L130,95 L170,90 L210,80 L210,150 Z"
                    fill="url(#chartGrad)"
                  />

                  {/* History Line */}
                  <polyline
                    fill="none"
                    stroke={COLOR}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="10,120 50,110 90,115 130,95 170,90 210,80"
                  />
                  
                  {/* Forecast Area Fill */}
                  <defs>
                    <linearGradient id="chartGradFore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ea580c" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M210,150 L210,80 L240,78 L270,70 L295,60 L295,150 Z"
                    fill="url(#chartGradFore)"
                  />

                  {/* Forecast Dotted Line */}
                  <polyline
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="210,80 240,78 270,70 295,60"
                  />
                  
                  {/* Data Points */}
                  <circle cx="210" cy="80" r="5" fill={COLOR} stroke="var(--bg-surface)" strokeWidth="1.5" />
                  <circle cx="295" cy="60" r="5" fill="#ea580c" stroke="var(--bg-surface)" strokeWidth="1.5" />
                </svg>
                
                {/* Labels overlay */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 12, fontSize: '0.66em', fontWeight: 700 }}>
                  <span style={{ color: COLOR, display: 'flex', alignItems: 'center', gap: 4 }}>● {t('market.chart.history')}</span>
                  <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: 4 }}>-- {t('market.chart.forecast')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: '0.7em', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('market.month.Jan')} ({t('market.chart.prev')})</span>
                <span style={{ fontSize: '0.7em', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('market.month.Jun')} ({t('market.chart.current')})</span>
                <span style={{ fontSize: '0.7em', color: '#ea580c', fontWeight: 750 }}>{language === 'mr' ? 'सप्टें' : language === 'hi' ? 'सितंबर' : 'Sep'} ({t('market.chart.forecast')})</span>
              </div>
            </div>

            {/* Chart 3: Brand Market Share */}
            <div className="glass-strong" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontSize: '0.96em', fontWeight: 800, margin: '0 0 20px', color: 'var(--text-primary)' }}>
                🏬 {t('market.brandShareTitle')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeCategory.brands?.map((brand, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }} className="hover-scale">
                    <span style={{ width: 68, fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {brand.name}
                    </span>
                    <div style={{ flex: 1, height: 10, background: 'var(--bg-elevated)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--glass-border-strong)' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${brand.share}%`,
                          background: `linear-gradient(to right, ${COLOR}, #68d391)`,
                          borderRadius: 5,
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                    </div>
                    <span style={{ width: 42, fontSize: '0.8em', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>
                      {brand.share}%
                    </span>
                  </div>
                ))}
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
