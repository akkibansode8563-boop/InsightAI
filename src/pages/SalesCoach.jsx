import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { streamChat } from '../services/api.js';

const PLAYBOOKS = [
  {
    id: 'server',
    titleKey: 'sales.playbook.server',
    icon: '🖥️',
    color: '#f97316',
    scenarios: ['SMB Server Pitch', 'Enterprise Rack Solution', 'NAS/SAN Upgrade', 'Cloud vs On-Prem'],
  },
  {
    id: 'laptop',
    titleKey: 'sales.playbook.laptop',
    icon: '💻',
    color: '#8b5cf6',
    scenarios: ['Corporate Laptop Refresh', 'WFH Setup Bundle', 'Student/Education', 'Gaming Workstation'],
  },
  {
    id: 'network',
    titleKey: 'sales.playbook.network',
    icon: '🌐',
    color: '#0ea5e9',
    scenarios: ['Office Network Setup', 'Wi-Fi 6 Upgrade', 'SD-WAN Proposal', 'Firewall & Security'],
  },
  {
    id: 'printer',
    titleKey: 'sales.playbook.printer',
    icon: '🖨️',
    color: '#059669',
    scenarios: ['Office MFP Fleet', 'Production Printing', 'Label Solutions', 'Document Management'],
  },
];

const OBJECTIONS = [
  { id: 'price', labelKey: 'sales.objection.price', icon: '💰' },
  { id: 'vendor', labelKey: 'sales.objection.vendor', icon: '🤝' },
  { id: 'timing', labelKey: 'sales.objection.timing', icon: '⏰' },
  { id: 'specs', labelKey: 'sales.objection.specs', icon: '📋' },
  { id: 'support', labelKey: 'sales.objection.support', icon: '🔧' },
  { id: 'budget', labelKey: 'sales.objection.budget', icon: '📊' },
];

function PageHeader({ icon, title, desc, color }) {
  return (
    <div
      style={{
        padding: '32px 40px',
        background: `linear-gradient(135deg, ${color}12 0%, transparent 60%)`,
        borderBottom: '1px solid var(--glass-border-strong)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-md)',
            background: `${color}18`,
            border: `2px solid ${color}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {icon}
        </div>
        <div>
          <h1 className="font-heading" style={{ fontSize: '1.5em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {title}
          </h1>
          <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 6 }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

function TabBar({ tabs, active, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '12px 32px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-surface)', overflowX: 'auto', scrollbarWidth: 'none' }} className="custom-scrollbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`nav-tab ${active === tab.id ? 'active' : ''}`}
          style={active === tab.id ? { color, background: `${color}14`, boxShadow: 'var(--shadow-sm)' } : {}}
        >
          {tab.icon && <span style={{ fontSize: '1.1em' }}>{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function AIResponseBox({ loading, response, error }) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(response).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!loading && !response && !error) return null;
  return (
    <div
      className="glass-strong"
      style={{
        padding: 24,
        marginTop: 20,
        borderLeft: '4px solid var(--accent-sales)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
      }}
    >
      {response && (
        <button
          onClick={handleCopy}
          className="btn-ghost hover-scale"
          style={{ position: 'absolute', top: 16, right: 16, padding: '4px 8px', fontSize: '0.7em' }}
        >
          {copied ? '✅' : '📋'} {copied ? 'Copied' : 'Copy'}
        </button>
      )}
      {loading && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85em', minHeight: 40 }}>
          {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i*0.16}s`, background: 'var(--accent-sales)' }} />)}
          <span style={{ marginLeft: 6 }}>{t('sales.playbookGenerating')}</span>
        </div>
      )}
      {error && <div style={{ color: '#dc2626', fontSize: '0.85em' }}>⚠️ {error}</div>}
      {response && <div style={{ fontSize: '0.9em', lineHeight: 1.75, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginTop: 12 }}>{response}</div>}
    </div>
  );
}

export default function SalesCoach() {
  const { language, t } = useApp();
  const [activeTab, setActiveTab] = useState('playbooks');
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedObjection, setSelectedObjection] = useState(null);
  const [pitchProduct, setPitchProduct] = useState('');
  const [pitchBudget, setPitchBudget] = useState('');
  const [pitchCustomer, setPitchCustomer] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const COLOR = '#8b5cf6';

  const TABS = [
    { id: 'playbooks', label: t('sales.playbooks'), icon: '📖' },
    { id: 'pitch', label: t('sales.pitch'), icon: '🎤' },
    { id: 'objection', label: t('sales.objection'), icon: '🛡️' },
    { id: 'negotiation', label: t('sales.negotiation'), icon: '🤝' },
    { id: 'discovery', label: t('sales.discovery'), icon: '🔍' },
  ];

  const ask = async (prompt) => {
    setLoading(true);
    setResponse('');
    setError('');
    let acc = '';
    await streamChat(
      { messages: [{ role: 'user', content: prompt }], agent: 'sales_coach', language },
      chunk => { acc += chunk; setResponse(acc); },
      () => setLoading(false),
      err => { setError(err); setLoading(false); }
    );
  };

  const handlePlaybookScenario = () => {
    if (!selectedPlaybook || !selectedScenario) return;
    const title = t(selectedPlaybook.titleKey);
    ask(`Generate a complete sales playbook for: ${title} - ${selectedScenario}. Include: opening pitch, key value propositions, feature highlights, typical objections and responses, and closing techniques.`);
  };

  const handlePitchGen = () => {
    if (!pitchProduct) return;
    ask(`Generate a compelling 2-minute elevator pitch for: "${pitchProduct}". Customer profile: ${pitchCustomer || 'SMB owner'}. Budget range: ${pitchBudget || 'not specified'}. Make it conversational, benefit-focused, and end with a clear call to action.`);
  };

  const handleObjection = () => {
    if (!selectedObjection) return;
    const label = t(selectedObjection.labelKey);
    ask(`Provide 5 professional, empathetic responses to the sales objection: "${label}" in context of IT hardware sales. Include: acknowledgment, reframe, value proof point, social proof, and next step.`);
  };

  const handleNegotiation = () => {
    ask(`Give me a negotiation coaching script for IT hardware deals. Cover: anchoring price, making concessions strategically, value-based selling over discounting, handling "best price" pressure, and deal structuring tips.`);
  };

  const handleDiscovery = () => {
    const product = pitchProduct || 'IT hardware';
    ask(`Generate 15 powerful discovery questions to qualify an IT hardware prospect for ${product}. Group them by: business needs, technical environment, budget & timeline, and decision process.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="aurora-mesh" />
      
      <PageHeader icon="🎯" title={t('module.sales.title')} desc={t('module.sales.desc')} color={COLOR} />
      <TabBar tabs={TABS} active={activeTab} onChange={(id) => { setActiveTab(id); setResponse(''); setError(''); }} color={COLOR} />

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px', zIndex: 10 }}>
        
        {/* Playbooks Tab */}
        {activeTab === 'playbooks' && (
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              {PLAYBOOKS.map(pb => {
                const isSelected = selectedPlaybook?.id === pb.id;
                return (
                  <div
                    key={pb.id}
                    className="card-premium hover-scale"
                    style={{
                      padding: 20,
                      cursor: 'pointer',
                      border: isSelected ? `2.5px solid ${pb.color}` : '1.5px solid var(--glass-border-strong)',
                      background: isSelected ? `${pb.color}08` : 'var(--bg-surface)',
                    }}
                    onClick={() => { setSelectedPlaybook(pb); setSelectedScenario(null); setResponse(''); }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 12 }}>{pb.icon}</div>
                    <div className="font-heading" style={{ fontWeight: 800, fontSize: '0.96em', color: 'var(--text-primary)', marginBottom: 6 }}>
                      {t(pb.titleKey)}
                    </div>
                    <div style={{ fontSize: '0.74em', color: 'var(--text-muted)' }}>
                      {pb.scenarios.length} {language === 'mr' ? 'प्रसंग' : language === 'hi' ? 'परिदृश्य' : 'scenarios'}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedPlaybook && (
              <div className="glass-strong" style={{ padding: 28, borderRadius: 'var(--radius-lg)' }}>
                <h3 className="font-heading" style={{ fontWeight: 850, fontSize: '1.05em', marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{selectedPlaybook.icon}</span> <span>{t(selectedPlaybook.titleKey)} — {t('sales.selectScenario')}</span>
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {selectedPlaybook.scenarios.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedScenario(s)}
                      className={selectedScenario === s ? 'premium-btn' : 'btn-ghost'}
                      style={selectedScenario === s ? {
                        padding: '8px 16px', fontSize: '0.8em',
                        background: `linear-gradient(135deg, ${selectedPlaybook.color}, ${selectedPlaybook.color}cc)`,
                        boxShadow: `0 4px 12px ${selectedPlaybook.color}25`,
                      } : { padding: '8px 16px', fontSize: '0.8em' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {selectedScenario && (
                  <button
                    onClick={handlePlaybookScenario}
                    className="premium-btn hover-scale"
                    style={{
                      padding: '12px 24px',
                      fontSize: '0.85em',
                      background: `linear-gradient(135deg, ${selectedPlaybook.color}, ${selectedPlaybook.color}cc)`,
                    }}
                    disabled={loading}
                  >
                    {loading ? t('sales.playbookGenerating') : t('sales.generatePlaybook')}
                  </button>
                )}
                <AIResponseBox loading={loading} response={response} error={error} />
              </div>
            )}
          </div>
        )}

        {/* Pitch Generator Tab */}
        {activeTab === 'pitch' && (
          <div className="glass-strong" style={{ padding: 32, maxWidth: 680, margin: '0 auto', borderRadius: 'var(--radius-lg)' }}>
            <h3 className="font-heading" style={{ fontWeight: 850, fontSize: '1.1em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎤</span> <span>{t('sales.pitch')}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('sales.pitchProduct')}</label>
                <input className="input-field" value={pitchProduct} onChange={e => setPitchProduct(e.target.value)} placeholder="e.g. HP ProLiant DL380 Gen11 Server" />
              </div>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('sales.pitchCustomer')}</label>
                <input className="input-field" value={pitchCustomer} onChange={e => setPitchCustomer(e.target.value)} placeholder="e.g. 50-person manufacturing company IT manager" />
              </div>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('sales.pitchBudget')}</label>
                <input className="input-field" value={pitchBudget} onChange={e => setPitchBudget(e.target.value)} placeholder="e.g. ₹2–5 lakh" />
              </div>
              <button
                onClick={handlePitchGen}
                disabled={!pitchProduct || loading}
                className="premium-btn hover-scale"
                style={{ padding: '12px 24px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', marginTop: 8 }}
              >
                {loading ? t('sales.playbookGenerating') : t('sales.generatePitch')}
              </button>
            </div>
            <AIResponseBox loading={loading} response={response} error={error} />
          </div>
        )}

        {/* Objection Handler Tab */}
        {activeTab === 'objection' && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              {OBJECTIONS.map(obj => {
                const isSelected = selectedObjection?.id === obj.id;
                return (
                  <div
                    key={obj.id}
                    className="card-premium hover-scale"
                    style={{
                      padding: 20,
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                      background: isSelected ? `${COLOR}08` : 'var(--bg-surface)',
                    }}
                    onClick={() => { setSelectedObjection(obj); setResponse(''); }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{obj.icon}</div>
                    <div style={{ fontSize: '0.86em', fontWeight: 750, color: 'var(--text-primary)' }}>{t(obj.labelKey)}</div>
                  </div>
                );
              })}
            </div>
            {selectedObjection && (
              <div className="glass-strong" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
                <button
                  onClick={handleObjection}
                  disabled={loading}
                  className="premium-btn hover-scale"
                  style={{ padding: '12px 24px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', marginBottom: 16 }}
                >
                  {loading ? t('sales.playbookGenerating') : `🛡️ ${t('sales.handleObjection')}: "${t(selectedObjection.labelKey)}"`}
                </button>
                <AIResponseBox loading={loading} response={response} error={error} />
              </div>
            )}
          </div>
        )}

        {/* Negotiation Tab */}
        {activeTab === 'negotiation' && (
          <div className="glass-strong" style={{ padding: 32, maxWidth: 680, margin: '0 auto', borderRadius: 'var(--radius-lg)' }}>
            <h3 className="font-heading" style={{ fontWeight: 850, fontSize: '1.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🤝</span> <span>{t('sales.negotiationTitle')}</span>
            </h3>
            <p style={{ fontSize: '0.88em', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7 }}>
              {t('sales.negotiationDesc')}
            </p>
            <button
              onClick={handleNegotiation}
              disabled={loading}
              className="premium-btn hover-scale"
              style={{ padding: '12px 24px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
            >
              {loading ? t('sales.playbookGenerating') : t('sales.negotiationBtn')}
            </button>
            <AIResponseBox loading={loading} response={response} error={error} />
          </div>
        )}

        {/* Discovery Tab */}
        {activeTab === 'discovery' && (
          <div className="glass-strong" style={{ padding: 32, maxWidth: 680, margin: '0 auto', borderRadius: 'var(--radius-lg)' }}>
            <h3 className="font-heading" style={{ fontWeight: 850, fontSize: '1.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔍</span> <span>{t('sales.discoveryTitle')}</span>
            </h3>
            <p style={{ fontSize: '0.88em', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7 }}>
              {t('sales.discoveryDesc')}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('sales.discoveryProduct')}</label>
              <input className="input-field" value={pitchProduct} onChange={e => setPitchProduct(e.target.value)} placeholder="e.g. Servers, Laptops, Networking" />
            </div>
            <button
              onClick={handleDiscovery}
              disabled={loading}
              className="premium-btn hover-scale"
              style={{ padding: '12px 24px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
            >
              {loading ? t('sales.playbookGenerating') : t('sales.discoveryBtn')}
            </button>
            <AIResponseBox loading={loading} response={response} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}
