import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { streamChat } from '../services/api.js';

const PLAYBOOKS = [
  {
    id: 'server',
    title: 'Server & Storage',
    icon: '🖥️',
    color: '#f97316',
    scenarios: ['SMB Server Pitch', 'Enterprise Rack Solution', 'NAS/SAN Upgrade', 'Cloud vs On-Prem'],
  },
  {
    id: 'laptop',
    title: 'Laptops & Mobile',
    icon: '💻',
    color: '#8b5cf6',
    scenarios: ['Corporate Laptop Refresh', 'WFH Setup Bundle', 'Student/Education', 'Gaming Workstation'],
  },
  {
    id: 'network',
    title: 'Networking',
    icon: '🌐',
    color: '#0ea5e9',
    scenarios: ['Office Network Setup', 'Wi-Fi 6 Upgrade', 'SD-WAN Proposal', 'Firewall & Security'],
  },
  {
    id: 'printer',
    title: 'Print & Scan',
    icon: '🖨️',
    color: '#059669',
    scenarios: ['Office MFP Fleet', 'Production Printing', 'Label Solutions', 'Document Management'],
  },
];

const OBJECTIONS = [
  { id: 'price', label: 'Too expensive', icon: '💰' },
  { id: 'vendor', label: 'Happy with current vendor', icon: '🤝' },
  { id: 'timing', label: 'Not the right time', icon: '⏰' },
  { id: 'specs', label: 'Need better specs', icon: '📋' },
  { id: 'support', label: 'Concerned about support', icon: '🔧' },
  { id: 'budget', label: 'Budget not approved', icon: '📊' },
];

function PageHeader({ icon, title, desc, color }) {
  return (
    <div
      style={{
        padding: '28px 32px 24px',
        background: `linear-gradient(135deg, ${color}14 0%, transparent 60%)`,
        borderBottom: '1px solid var(--glass-border-strong)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `${color}20`,
            border: `2px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {icon}
        </div>
        <div>
          <h1 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
            {title}
          </h1>
          <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 4 }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

function TabBar({ tabs, active, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-surface)', overflowX: 'auto' }} className="custom-scrollbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`nav-tab${active === tab.id ? ' active' : ''}`}
          style={active === tab.id ? { color, background: `${color}18` } : {}}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AIResponseBox({ loading, response, error }) {
  if (!loading && !response && !error) return null;
  return (
    <div
      className="card"
      style={{
        padding: 20,
        marginTop: 16,
        borderLeft: '3px solid var(--accent-sales)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {loading && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85em' }}>
          {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i*0.16}s` }} />)}
          <span style={{ marginLeft: 4 }}>Generating...</span>
        </div>
      )}
      {error && <div style={{ color: '#dc2626', fontSize: '0.85em' }}>⚠️ {error}</div>}
      {response && <div style={{ fontSize: '0.875em', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{response}</div>}
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
    ask(`Generate a complete sales playbook for: ${selectedPlaybook.title} - ${selectedScenario}. Include: opening pitch, key value propositions, feature highlights, typical objections and responses, and closing techniques.`);
  };

  const handlePitchGen = () => {
    if (!pitchProduct) return;
    ask(`Generate a compelling 2-minute elevator pitch for: "${pitchProduct}". Customer profile: ${pitchCustomer || 'SMB owner'}. Budget range: ${pitchBudget || 'not specified'}. Make it conversational, benefit-focused, and end with a clear call to action.`);
  };

  const handleObjection = () => {
    if (!selectedObjection) return;
    ask(`Provide 5 professional, empathetic responses to the sales objection: "${selectedObjection.label}" in context of IT hardware sales. Include: acknowledgment, reframe, value proof point, social proof, and next step.`);
  };

  const handleNegotiation = () => {
    ask(`Give me a negotiation coaching script for IT hardware deals. Cover: anchoring price, making concessions strategically, value-based selling over discounting, handling "best price" pressure, and deal structuring tips.`);
  };

  const handleDiscovery = () => {
    const product = pitchProduct || 'IT hardware';
    ask(`Generate 15 powerful discovery questions to qualify an IT hardware prospect for ${product}. Group them by: business needs, technical environment, budget & timeline, and decision process.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PageHeader icon="🎯" title={t('module.sales.title')} desc={t('module.sales.desc')} color={COLOR} />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} color={COLOR} />

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* Playbooks Tab */}
        {activeTab === 'playbooks' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
              {PLAYBOOKS.map(pb => (
                <div
                  key={pb.id}
                  className="card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    border: selectedPlaybook?.id === pb.id ? `2px solid ${pb.color}` : '1px solid var(--glass-border-strong)',
                    background: selectedPlaybook?.id === pb.id ? `${pb.color}10` : 'var(--bg-surface)',
                    transition: 'var(--transition-smooth)',
                  }}
                  onClick={() => { setSelectedPlaybook(pb); setSelectedScenario(null); setResponse(''); }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{pb.icon}</div>
                  <div className="font-heading" style={{ fontWeight: 800, fontSize: '0.9em', color: 'var(--text-primary)', marginBottom: 4 }}>{pb.title}</div>
                  <div style={{ fontSize: '0.72em', color: 'var(--text-muted)' }}>{pb.scenarios.length} scenarios</div>
                </div>
              ))}
            </div>

            {selectedPlaybook && (
              <div className="card" style={{ padding: 20 }}>
                <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.95em', marginBottom: 12, color: 'var(--text-primary)' }}>
                  {selectedPlaybook.icon} {selectedPlaybook.title} — Select Scenario
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {selectedPlaybook.scenarios.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedScenario(s)}
                      className={selectedScenario === s ? 'premium-btn' : 'btn-ghost'}
                      style={selectedScenario === s ? {
                        padding: '7px 14px', fontSize: '0.8em',
                        background: `linear-gradient(135deg, ${selectedPlaybook.color}, ${selectedPlaybook.color}cc)`,
                      } : { padding: '7px 14px', fontSize: '0.8em' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {selectedScenario && (
                  <button
                    onClick={handlePlaybookScenario}
                    className="premium-btn"
                    style={{ padding: '10px 20px', fontSize: '0.85em', background: `linear-gradient(135deg, ${selectedPlaybook.color}, ${selectedPlaybook.color}cc)` }}
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : '🚀 Generate Playbook'}
                  </button>
                )}
                <AIResponseBox loading={loading} response={response} error={error} />
              </div>
            )}
          </div>
        )}

        {/* Pitch Generator Tab */}
        {activeTab === 'pitch' && (
          <div className="card" style={{ padding: 24, maxWidth: 640 }}>
            <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '1em', marginBottom: 16 }}>🎤 Pitch Generator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Product / Solution</label>
                <input className="input-field" value={pitchProduct} onChange={e => setPitchProduct(e.target.value)} placeholder="e.g. HP ProLiant DL380 Gen11 Server" />
              </div>
              <div>
                <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Customer Profile</label>
                <input className="input-field" value={pitchCustomer} onChange={e => setPitchCustomer(e.target.value)} placeholder="e.g. 50-person manufacturing company IT manager" />
              </div>
              <div>
                <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Budget Range</label>
                <input className="input-field" value={pitchBudget} onChange={e => setPitchBudget(e.target.value)} placeholder="e.g. ₹2–5 lakh" />
              </div>
              <button onClick={handlePitchGen} disabled={!pitchProduct || loading} className="premium-btn" style={{ padding: '11px 20px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', marginTop: 4 }}>
                {loading ? 'Generating...' : '✨ Generate Pitch'}
              </button>
            </div>
            <AIResponseBox loading={loading} response={response} error={error} />
          </div>
        )}

        {/* Objection Handler Tab */}
        {activeTab === 'objection' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
              {OBJECTIONS.map(obj => (
                <div
                  key={obj.id}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    border: selectedObjection?.id === obj.id ? `2px solid ${COLOR}` : '1px solid var(--glass-border-strong)',
                    background: selectedObjection?.id === obj.id ? `${COLOR}10` : 'var(--bg-surface)',
                    transition: 'var(--transition-smooth)',
                  }}
                  onClick={() => { setSelectedObjection(obj); setResponse(''); }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{obj.icon}</div>
                  <div style={{ fontSize: '0.82em', fontWeight: 700, color: 'var(--text-primary)' }}>{obj.label}</div>
                </div>
              ))}
            </div>
            {selectedObjection && (
              <div>
                <button onClick={handleObjection} disabled={loading} className="premium-btn" style={{ padding: '11px 22px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', marginBottom: 16 }}>
                  {loading ? 'Generating...' : `🛡️ Handle: "${selectedObjection.label}"`}
                </button>
                <AIResponseBox loading={loading} response={response} error={error} />
              </div>
            )}
          </div>
        )}

        {/* Negotiation Tab */}
        {activeTab === 'negotiation' && (
          <div className="card" style={{ padding: 24, maxWidth: 640 }}>
            <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '1em', marginBottom: 8 }}>🤝 Negotiation Coach</h3>
            <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Get AI-powered negotiation strategies specifically for IT hardware deals in the Indian market.
            </p>
            <button onClick={handleNegotiation} disabled={loading} className="premium-btn" style={{ padding: '11px 22px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              {loading ? 'Generating...' : '🚀 Get Negotiation Script'}
            </button>
            <AIResponseBox loading={loading} response={response} error={error} />
          </div>
        )}

        {/* Discovery Tab */}
        {activeTab === 'discovery' && (
          <div className="card" style={{ padding: 24, maxWidth: 640 }}>
            <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '1em', marginBottom: 8 }}>🔍 Discovery Questions</h3>
            <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
              Qualify your prospect with the right questions before making a pitch.
            </p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Product Focus (optional)</label>
              <input className="input-field" value={pitchProduct} onChange={e => setPitchProduct(e.target.value)} placeholder="e.g. Servers, Laptops, Networking" />
            </div>
            <button onClick={handleDiscovery} disabled={loading} className="premium-btn" style={{ padding: '11px 22px', fontSize: '0.85em', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              {loading ? 'Generating...' : '🔍 Generate Discovery Questions'}
            </button>
            <AIResponseBox loading={loading} response={response} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}
