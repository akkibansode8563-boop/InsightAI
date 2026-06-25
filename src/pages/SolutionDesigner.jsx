import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { streamChat } from '../services/api.js';

const COLOR = '#f59e0b';

const USE_CASES = [
  { id: 'office', label: 'Office Setup', icon: '🏢', prompt: 'Design a complete office IT setup', },
  { id: 'video', label: 'Video Production', icon: '🎬', prompt: 'Design IT infrastructure for video production studio', },
  { id: 'retail', label: 'Retail/POS', icon: '🛍️', prompt: 'Design IT setup for retail store with POS system', },
  { id: 'datacenter', label: 'Mini Data Center', icon: '🖥️', prompt: 'Design a mini data center setup', },
  { id: 'creative', label: 'Creative Agency', icon: '🎨', prompt: 'Design IT setup for a creative design agency', },
  { id: 'hospital', label: 'Clinic / Hospital', icon: '🏥', prompt: 'Design IT infrastructure for a medical clinic', },
  { id: 'school', label: 'School Lab', icon: '🎓', prompt: 'Design a computer lab setup for a school', },
  { id: 'warehouse', label: 'Warehouse / Logistics', icon: '📦', prompt: 'Design IT setup for warehouse and logistics operations', },
];

const BUDGET_RANGES = [
  { id: 'under2l', label: 'Under ₹2 Lakh' },
  { id: '2to5l', label: '₹2–5 Lakh' },
  { id: '5to15l', label: '₹5–15 Lakh' },
  { id: '15to50l', label: '₹15–50 Lakh' },
  { id: 'above50l', label: 'Above ₹50 Lakh' },
];

const USER_COUNT_OPTIONS = ['1–5', '6–20', '21–50', '51–100', '100+'];

export default function SolutionDesigner() {
  const { language, t } = useApp();
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [budget, setBudget] = useState('');
  const [users, setUsers] = useState('');
  const [custom, setCustom] = useState('');
  const [priorities, setPriorities] = useState([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PRIORITY_OPTIONS = ['Performance', 'Cost-effective', 'Energy efficient', 'Scalable', 'Easy to manage', 'High availability'];

  const togglePriority = (p) => setPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const generate = async () => {
    const useCase = selectedUseCase || { label: custom };
    if (!useCase?.label && !custom.trim()) return;
    setLoading(true);
    setResponse('');
    setError('');

    const prompt = [
      `Design a complete IT hardware solution for: ${useCase.label || custom}.`,
      users ? `User count: ${users} users.` : '',
      budget ? `Budget: ${budget}.` : '',
      priorities.length ? `Priorities: ${priorities.join(', ')}.` : '',
      `Include: complete bill of materials with SKUs, pricing in INR, vendor recommendations (prioritize HP, Dell, Lenovo, Cisco), network diagram description, implementation timeline, and support/warranty recommendations.`,
    ].filter(Boolean).join(' ');

    let acc = '';
    await streamChat(
      { messages: [{ role: 'user', content: prompt }], agent: 'solution_designer', language },
      c => { acc += c; setResponse(acc); },
      () => setLoading(false),
      e => { setError(e); setLoading(false); }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 24px', background: `linear-gradient(135deg, ${COLOR}14 0%, transparent 60%)`, borderBottom: '1px solid var(--glass-border-strong)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${COLOR}20`, border: `2px solid ${COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚡</div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{t('module.solutions.title')}</h1>
            <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 4 }}>{t('module.solutions.desc')}</p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 20, alignItems: 'start' }}>

          {/* Config Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Use Case Selection */}
            <div className="card" style={{ padding: 18 }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.85em', marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Select Use Case
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {USE_CASES.map(uc => (
                  <button
                    key={uc.id}
                    onClick={() => { setSelectedUseCase(uc); setCustom(''); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: selectedUseCase?.id === uc.id ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                      background: selectedUseCase?.id === uc.id ? `${COLOR}12` : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{uc.icon}</div>
                    <div style={{ fontSize: '0.7em', fontWeight: 700, color: 'var(--text-primary)' }}>{uc.label}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <input
                  className="input-field"
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setSelectedUseCase(null); }}
                  placeholder="Or describe your custom use case..."
                />
              </div>
            </div>

            {/* Users & Budget */}
            <div className="card" style={{ padding: 18 }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.85em', marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Scale & Budget
              </h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.76em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Number of Users</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {USER_COUNT_OPTIONS.map(u => (
                    <button
                      key={u}
                      onClick={() => setUsers(u)}
                      className={users === u ? 'premium-btn' : 'btn-ghost'}
                      style={users === u ? { padding: '5px 10px', fontSize: '0.76em', background: `linear-gradient(135deg, ${COLOR}, #d97706)` } : { padding: '5px 10px', fontSize: '0.76em' }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.76em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Budget Range</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {BUDGET_RANGES.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setBudget(b.label)}
                      style={{
                        padding: '8px 12px', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '0.8em', fontWeight: 600, cursor: 'pointer',
                        border: budget === b.label ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                        background: budget === b.label ? `${COLOR}12` : 'var(--bg-elevated)',
                        color: budget === b.label ? COLOR : 'var(--text-primary)',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Priorities */}
            <div className="card" style={{ padding: 18 }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.85em', marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3. Priorities
              </h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    style={{
                      padding: '5px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.74em', fontWeight: 700, cursor: 'pointer',
                      border: priorities.includes(p) ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                      background: priorities.includes(p) ? `${COLOR}15` : 'transparent',
                      color: priorities.includes(p) ? COLOR : 'var(--text-secondary)',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    {priorities.includes(p) ? '✓ ' : ''}{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={loading || (!selectedUseCase && !custom.trim())}
              className="premium-btn"
              style={{
                padding: '14px 20px',
                fontSize: '0.9em',
                fontWeight: 800,
                background: loading || (!selectedUseCase && !custom.trim())
                  ? 'var(--bg-elevated)'
                  : `linear-gradient(135deg, ${COLOR}, #d97706)`,
                color: loading || (!selectedUseCase && !custom.trim()) ? 'var(--text-muted)' : '#fff',
                width: '100%',
                letterSpacing: '-0.01em',
              }}
            >
              {loading ? '⚡ Designing Solution...' : '⚡ Design My Solution'}
            </button>
          </div>

          {/* Output Panel */}
          <div>
            {!response && !loading && !error && (
              <div
                style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  border: '2px dashed var(--glass-border-strong)',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <div className="font-heading" style={{ fontSize: '1.1em', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Configure & Generate
                </div>
                <div style={{ fontSize: '0.82em', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                  Select a use case, set your scale and budget, then click Design My Solution for a complete IT setup recommendation.
                </div>
              </div>
            )}

            {loading && !response && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: '0.88em' }}>
                {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i*0.16}s` }} />)}
                <span style={{ marginLeft: 8 }}>Designing your custom IT solution...</span>
              </div>
            )}

            {error && (
              <div className="card" style={{ padding: 20, borderLeft: `3px solid #ef4444` }}>
                <div style={{ color: '#dc2626', fontSize: '0.85em' }}>⚠️ {error}</div>
              </div>
            )}

            {response && (
              <div className="card" style={{ padding: 24, borderLeft: `3px solid ${COLOR}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="font-heading" style={{ fontWeight: 800, fontSize: '0.9em', color: 'var(--text-primary)' }}>
                    ⚡ {selectedUseCase?.label || custom} — Solution Design
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(response)}
                    className="btn-ghost"
                    style={{ fontSize: '0.74em' }}
                  >
                    📋 Copy
                  </button>
                </div>
                <div style={{ fontSize: '0.875em', lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  {response}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
