import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { streamChat } from '../services/api.js';

const COLOR = '#ef4444'; // Red accent for News Center

const CATEGORY_TABS = [
  { id: 'all', key: 'news.allNews' },
  { id: 'global_it', key: 'news.globalIt' },
  { id: 'india_it', key: 'news.indiaIt' },
  { id: 'brand_news', key: 'news.brandNews' },
  { id: 'product_launch', key: 'news.launches' },
  { id: 'ai_hardware', key: 'news.aiHardware' },
  { id: 'semiconductors', key: 'news.semiconductors' },
  { id: 'supply_chain', key: 'news.supplyChain' },
  { id: 'market_trends', key: 'news.trends' },
  { id: 'govt_policy', key: 'news.govtPolicy' }
];

export default function NewsCenter() {
  const { language, t, setActiveModule, setActiveAgent } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local news from api endpoint or local JSON database via fetch
    const loadNews = async () => {
      try {
        setLoading(true);
        // In local development or production, we read the news.json data
        const res = await fetch(`/api/news?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          setNews(data.articles || []);
        } else {
          // Fallback to fetch directly from data folder if api is not running
          const fallbackRes = await fetch('/api/data/news.json');
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const localized = data.map(item => ({
              ...item,
              title: item[`title_${language}`] || item.title,
              ai_summary: item[`ai_summary_${language}`] || item.ai_summary,
              key_highlights: item[`key_highlights_${language}`] || item.key_highlights,
              business_impact: item[`business_impact_${language}`] || item.business_impact,
              technical_impact: item[`technical_impact_${language}`] || item.technical_impact
            }));
            setNews(localized);
          }
        }
      } catch (err) {
        console.error("Failed to load news:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [language]);

  const handleAskAI = (article) => {
    // Navigate to Chat, set active agent to news_agent, and pass context
    setActiveAgent('news_agent');
    setActiveModule('chat');
    // Save to sessionStorage or pass via global state if needed
    // In our implementation, we'll store the context in sessionStorage to be picked up by the chat
    sessionStorage.setItem('insightai_chat_context', `User clicked 'Ask AI' on this news article:\nTitle: ${article.title}\nSummary: ${article.ai_summary}\nBusiness Impact: ${article.business_impact}\nTechnical Impact: ${article.technical_impact}`);
  };

  const filteredNews = news.filter(item => {
    const matchesTab = activeTab === 'all' || item.category?.includes(activeTab);
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.key_highlights?.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="p-6 md:px-8 md:py-6 border-b border-[var(--glass-border-strong)] flex justify-between items-center flex-wrap gap-4"
        style={{
          background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)`
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
            📰
          </div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {t('module.news.title')}
            </h1>
            <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 4 }}>
              {t('module.news.desc')}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={t('news.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass"
            style={{
              padding: '10px 16px 10px 40px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85em',
              width: 240,
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border-strong)'
            }}
          />
          <span style={{ position: 'absolute', left: 14, top: 10, fontSize: '1.1em', color: 'var(--text-secondary)' }}>🔍</span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-2 px-6 py-3 md:px-8 overflow-x-auto scrollbar-none border-b border-[var(--glass-border-strong)] flex-shrink-0 bg-black/5 dark:bg-white/5"
      >
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.78em',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: activeTab === tab.id ? COLOR : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)'
            }}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: 'var(--text-secondary)' }}>
            {t('news.loading')}
          </div>
        ) : filteredNews.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('news.noNews')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNews.map(item => (
              <div
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--glass-border-strong)',
                  overflow: 'hidden',
                  background: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ padding: 20, flex: 1 }}>
                  {/* Meta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', fontWeight: 600 }}>
                      📅 {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65em',
                        padding: '3px 8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: COLOR,
                        fontWeight: 700,
                        borderRadius: 4,
                        textTransform: 'uppercase'
                      }}
                    >
                      {item.source}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: '1.05em',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      marginBottom: 10
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Summary */}
                  <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                    {item.ai_summary}
                  </p>

                  {/* Highlights */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {item.key_highlights?.slice(0, 3).map((h, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.68em',
                          padding: '4px 10px',
                          background: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-primary)',
                          fontWeight: 500
                        }}
                      >
                        🔹 {h}
                      </span>
                    ))}
                  </div>

                  {/* Expanded Section */}
                  {expandedId === item.id && (
                    <div
                      style={{
                        paddingTop: 16,
                        borderTop: '1px solid var(--glass-border-strong)',
                        animation: 'fadeIn 0.3s ease'
                      }}
                    >
                      {/* Business Impact */}
                      <div
                        style={{
                          background: 'rgba(5, 150, 105, 0.06)',
                          borderLeft: '3px solid #059669',
                          padding: 10,
                          borderRadius: 4,
                          marginBottom: 12
                        }}
                      >
                        <h4 style={{ fontSize: '0.75em', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 4, margin: '0 0 4px' }}>
                          {t('news.businessImpactTitle')}
                        </h4>
                        <p style={{ fontSize: '0.78em', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {item.business_impact}
                        </p>
                      </div>

                      {/* Technical Impact */}
                      <div
                        style={{
                          background: 'rgba(14, 165, 233, 0.06)',
                          borderLeft: '3px solid #0ea5e9',
                          padding: 10,
                          borderRadius: 4,
                          marginBottom: 12
                        }}
                      >
                        <h4 style={{ fontSize: '0.75em', fontWeight: 800, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4, margin: '0 0 4px' }}>
                          {t('news.technicalImpactTitle')}
                        </h4>
                        <p style={{ fontSize: '0.78em', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {item.technical_impact}
                        </p>
                      </div>

                      {/* Related Products */}
                      {item.related_products && item.related_products.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: '0.75em', fontWeight: 700, color: 'var(--text-primary)' }}>{t('news.relatedProducts')}</span>
                          <span style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>
                            {item.related_products.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div
                  style={{
                    padding: '12px 20px',
                    background: 'var(--bg-elevated)',
                    borderTop: '1px solid var(--glass-border-strong)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.78em',
                      fontWeight: 700,
                      color: COLOR,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {expandedId === item.id ? t('news.readLess') : t('news.readMore')}
                  </button>

                  <button
                    onClick={() => handleAskAI(item)}
                    style={{
                      padding: '6px 12px',
                      background: `linear-gradient(135deg, ${COLOR}, #ea580c)`,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75em',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {t('news.askAi')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
