import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { streamChat } from '../services/api';

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

const PRIORITY_MAPPING = {
  'Performance': 'solutions.priority.performance',
  'Cost-effective': 'solutions.priority.cost',
  'Energy efficient': 'solutions.priority.energy',
  'Scalable': 'solutions.priority.scalable',
  'Easy to manage': 'solutions.priority.manage',
  'High availability': 'solutions.priority.availability'
};

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
  const [copied, setCopied] = useState(false);

  const PRIORITY_OPTIONS = ['Performance', 'Cost-effective', 'Energy efficient', 'Scalable', 'Easy to manage', 'High availability'];

  const togglePriority = (p) => setPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleCopy = () => {
    navigator.clipboard.writeText(response).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="aurora-mesh" />
      
      {/* Header */}
      <div className="p-6 md:px-10 md:py-8 border-b border-[var(--glass-border-strong)] flex-shrink-0" style={{ background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: `${COLOR}18`, border: `2px solid ${COLOR}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: 'var(--shadow-sm)' }}>⚡</div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.5em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{t('module.solutions.title')}</h1>
            <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 6 }}>{t('module.solutions.desc')}</p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-6 items-start max-w-[1200px] mx-auto">

          {/* Configuration Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Use Cases */}
            <div className="glass-strong" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.85em', marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('solutions.selectUseCase')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                {USE_CASES.map(uc => {
                  const isSelected = selectedUseCase?.id === uc.id;
                  return (
                    <button
                      key={uc.id}
                      onClick={() => { setSelectedUseCase(uc); setCustom(''); }}
                      className="hover-scale"
                      style={{
                        padding: '12px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                        background: isSelected ? `${COLOR}12` : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{uc.icon}</div>
                      <div style={{ fontSize: '0.74em', fontWeight: 700, color: 'var(--text-primary)' }}>{t('solutions.usecase.' + uc.id)}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14 }}>
                <input
                  className="input-field"
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setSelectedUseCase(null); }}
                  placeholder={t('solutions.customPlaceholder')}
                />
              </div>
            </div>

            {/* Users & Budget */}
            <div className="glass-strong" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.85em', marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('solutions.scaleBudget')}
              </h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('solutions.userCount')}</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {USER_COUNT_OPTIONS.map(u => (
                    <button
                      key={u}
                      onClick={() => setUsers(u)}
                      className={users === u ? 'premium-btn' : 'btn-ghost'}
                      style={users === u ? { padding: '6px 12px', fontSize: '0.76em', background: `linear-gradient(135deg, ${COLOR}, #d97706)` } : { padding: '6px 12px', fontSize: '0.76em' }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('solutions.budgedRange')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {BUDGET_RANGES.map(b => {
                    const isSelected = budget === b.label;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setBudget(b.label)}
                        style={{
                          padding: '10px 14px', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '0.8em', fontWeight: 650, cursor: 'pointer',
                          border: isSelected ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                          background: isSelected ? `${COLOR}12` : 'var(--bg-surface)',
                          color: isSelected ? COLOR : 'var(--text-primary)',
                          transition: 'var(--transition-fast)',
                        }}
                      >
                        {t(b.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Priorities */}
            <div className="glass-strong" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.85em', marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('solutions.priorities')}
              </h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRIORITY_OPTIONS.map(p => {
                  const isSelected = priorities.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePriority(p)}
                      className="hover-scale"
                      style={{
                        padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.74em', fontWeight: 700, cursor: 'pointer',
                        border: isSelected ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                        background: isSelected ? `${COLOR}18` : 'transparent',
                        color: isSelected ? COLOR : 'var(--text-secondary)',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{t(PRIORITY_MAPPING[p] || p)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={loading || (!selectedUseCase && !custom.trim())}
              className="premium-btn hover-scale"
              style={{
                padding: '14px 20px',
                fontSize: '0.9em',
                fontWeight: 800,
                background: loading || (!selectedUseCase && !custom.trim())
                  ? 'var(--bg-elevated)'
                  : `linear-gradient(135deg, ${COLOR}, #d97706)`,
                color: loading || (!selectedUseCase && !custom.trim()) ? 'var(--text-muted)' : '#fff',
                width: '100%',
                boxShadow: loading || (!selectedUseCase && !custom.trim()) ? 'none' : `0 4px 14px rgba(245, 158, 11, 0.25)`,
              }}
            >
              {loading ? t('solutions.designProgress') : t('solutions.designBtn')}
            </button>
          </div>

          {/* Output Panel */}
          <div>
            {!response && !loading && !error && (
              <div
                style={{
                  padding: '80px 40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  border: '2px dashed var(--glass-border-strong)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'rgba(255, 255, 255, 0.01)',
                }}
              >
                <div style={{ fontSize: 52, marginBottom: 18 }}>⚡</div>
                <div className="font-heading" style={{ fontSize: '1.1em', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {t('solutions.configureGenerate')}
                </div>
                <div style={{ fontSize: '0.84em', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
                  {t('solutions.configureGenerateDesc')}
                </div>
              </div>
            )}

            {loading && !response && (
              <div className="glass-strong" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 28, color: 'var(--text-secondary)', fontSize: '0.88em', borderRadius: 'var(--radius-lg)' }}>
                {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i*0.16}s`, background: COLOR }} />)}
                <span style={{ marginLeft: 6 }}>{t('solutions.designingMessage')}</span>
              </div>
            )}

            {error && (
              <div className="glass-strong" style={{ padding: 20, borderLeft: `4px solid #ef4444`, borderRadius: 'var(--radius-lg)' }}>
                <div style={{ color: '#dc2626', fontSize: '0.86em' }}>⚠️ {error}</div>
              </div>
            )}

            {response && (
              <div className="glass-strong" style={{ padding: 28, borderLeft: `4px solid ${COLOR}`, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--glass-border-strong)', paddingBottom: 12 }}>
                  <span className="font-heading" style={{ fontWeight: 850, fontSize: '0.96em', color: 'var(--text-primary)' }}>
                    ⚡ {selectedUseCase ? t('solutions.usecase.' + selectedUseCase.id) : custom} — {t('solutions.titleOutput')}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="btn-ghost hover-scale"
                    style={{ fontSize: '0.74em', padding: '4px 10px' }}
                  >
                    {copied ? '✅' : '📋'} {copied ? 'Copied' : t('solutions.copyBtn')}
                  </button>
                </div>
                <div style={{ fontSize: '0.9em', lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
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
