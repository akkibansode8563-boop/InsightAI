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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)`,
          borderBottom: '1px solid var(--glass-border-strong)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `${COLOR}20`,
              border: `2px solid ${COLOR}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}
          >
            📊
          </div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {t('module.market.title')}
            </h1>
            <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 4 }}>
              {t('module.market.desc')}
            </p>
          </div>
        </div>

        {/* Category selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['laptops', 'networking', 'printers'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: selectedCategory === cat ? `1px solid ${COLOR}` : '1px solid var(--glass-border-strong)',
                background: selectedCategory === cat ? `${COLOR}15` : 'var(--bg-surface)',
                color: selectedCategory === cat ? COLOR : 'var(--text-secondary)',
                fontSize: '0.8em',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {t(CAT_TRANSLATION_KEYS[cat] || cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="custom-scrollbar">
        {loading || !activeCategory ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
            {t('market.loading')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Chart 1: Demand Index (Pure CSS / SVG Bar Chart) */}
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <h3 className="font-heading" style={{ fontSize: '0.98em', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                {t('market.demandIndexTitle')}
              </h3>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 180, paddingBottom: 10, borderBottom: '1px solid var(--glass-border-strong)', position: 'relative' }}>
                {activeCategory.demand_index?.map((val, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <span style={{ fontSize: '0.7em', fontWeight: 700, color: COLOR, marginBottom: 4 }}>
                      {val}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${val * 1.5}px`,
                        background: `linear-gradient(to top, ${COLOR}, #34d399)`,
                        borderRadius: '4px 4px 0 0',
                        boxShadow: `0 4px 10px ${COLOR}20`,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
                  <span key={i} style={{ fontSize: '0.72em', color: 'var(--text-muted)', fontWeight: 600 }}>{t('market.month.' + month)}</span>
                ))}
              </div>
            </div>

            {/* Chart 2: Price Trend & Forecast (SVG Line Chart) */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="font-heading" style={{ fontSize: '0.98em', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                {t('market.priceTrendTitle')}
              </h3>

              <div style={{ height: 180, position: 'relative', borderBottom: '1px solid var(--glass-border-strong)', borderLeft: '1px solid var(--glass-border-strong)', padding: '10px 10px 0 10px' }}>
                <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="37" x2="300" y2="37" stroke="var(--glass-border-strong)" strokeDasharray="3" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="var(--glass-border-strong)" strokeDasharray="3" />
                  <line x1="0" y1="112" x2="300" y2="112" stroke="var(--glass-border-strong)" strokeDasharray="3" />

                  {/* History Line */}
                  <polyline
                    fill="none"
                    stroke={COLOR}
                    strokeWidth="3"
                    points="10,120 50,110 90,115 130,95 170,90 210,80"
                  />
                  {/* Forecast Dotted Line */}
                  <polyline
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="3"
                    strokeDasharray="5"
                    points="210,80 240,78 270,70 295,60"
                  />
                  
                  {/* Data Points */}
                  <circle cx="210" cy="80" r="4" fill={COLOR} />
                  <circle cx="295" cy="60" r="4" fill="#ea580c" />
                </svg>
                
                {/* Labels overlay */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 10, fontSize: '0.65em', fontWeight: 700 }}>
                  <span style={{ color: COLOR }}>● {t('market.chart.history')}</span>
                  <span style={{ color: '#ea580c' }}>-- {t('market.chart.forecast')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: '0.68em', color: 'var(--text-muted)' }}>{t('market.month.Jan')} ({t('market.chart.prev')})</span>
                <span style={{ fontSize: '0.68em', color: 'var(--text-muted)' }}>{t('market.month.Jun')} ({t('market.chart.current')})</span>
                <span style={{ fontSize: '0.68em', color: '#ea580c', fontWeight: 700 }}>{language === 'mr' ? 'सप्टें' : language === 'hi' ? 'सितंबर' : 'Sep'} ({t('market.chart.forecast')})</span>
              </div>
            </div>

            {/* Chart 3: Brand Market Share (Horizontal Bar Chart) */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="font-heading" style={{ fontSize: '0.98em', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                {t('market.brandShareTitle')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeCategory.brands?.map((brand, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 60, fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {brand.name}
                    </span>
                    <div style={{ flex: 1, height: 12, background: 'var(--bg-elevated)', borderRadius: 6, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${brand.share}%`,
                          background: `linear-gradient(to right, ${COLOR}, #68d391)`,
                          borderRadius: 6
                        }}
                      />
                    </div>
                    <span style={{ width: 35, fontSize: '0.78em', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>
                      {brand.share}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Demand Calendar & Seasonal Pattern */}
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 className="font-heading" style={{ fontSize: '0.98em', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
                  {t('market.seasonalPatternTitle')}
                </h3>
                <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {activeCategory.seasonal_pattern}
                </p>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background: 'rgba(249, 115, 22, 0.05)',
                  border: '1px dashed rgba(249, 115, 22, 0.25)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span style={{ fontSize: '0.72em', fontWeight: 800, color: '#e65100', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  {t('market.peakWindowTag')}
                </span>
                <span style={{ fontSize: '0.8em', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {t('market.peakWindowDesc')}
                </span>
              </div>
            </div>

            {/* Full-width Section: AI Forecast & Disclaimer */}
            <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  padding: 20,
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ fontSize: '2em' }}>🔮</div>
                <div>
                  <h4 className="font-heading" style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '0.95em', color: COLOR }}>
                    {t('market.forecastTitle')}
                  </h4>
                  <p style={{ fontSize: '0.82em', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                    {activeCategory.forecast?.description}
                  </p>
                  
                  {/* Alert Disclaimer */}
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      borderLeft: '3px solid #ef4444',
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: '0.72em',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4
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
