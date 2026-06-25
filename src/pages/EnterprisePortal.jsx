import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { calcTCO, formatINR } from '../services/calculator.js';
import { streamChat } from '../services/api.js';

const COLOR = '#0ea5e9';

const INFRA_TEMPLATES = [
  { id: 'smb', label: 'SMB Office (25 users)', icon: '🏢', desc: 'Complete setup for small business', components: ['2× HP DL380 Gen11', 'Cisco Catalyst 24-port switch', '10× Dell Latitude laptops', 'Epson multifunction printer', 'Synology NAS 8-bay'] },
  { id: 'enterprise', label: 'Enterprise (200 users)', icon: '🏛️', desc: 'Full data center + end-user compute', components: ['8× HPE ProLiant rack servers', 'Cisco Nexus core switches', 'Dell PowerEdge VRTX blade', 'NetScaler load balancer', 'Pure Storage FlashArray'] },
  { id: 'hospital', label: 'Hospital / Healthcare', icon: '🏥', desc: 'HIPAA-compliant setup', components: ['4× Dell PowerEdge R750', 'Cisco ISR router', '50× HP EliteBook 840', 'Zebra label printers', 'Barracuda backup appliance'] },
  { id: 'school', label: 'School / Education', icon: '🎓', desc: 'Cost-effective learning environment', components: ['2× Lenovo ThinkSystem', '100× HP Chromebook 14', 'TP-Link campus Wi-Fi', 'Interactive smart boards', 'Brother multifunction printers'] },
];

function TCOCalculator() {
  const { t } = useApp();
  const [hardware, setHardware] = useState('500000');
  const [maintenance, setMaintenance] = useState('50000');
  const [license, setLicense] = useState('30000');
  const [power, setPower] = useState('20000');
  const [years, setYears] = useState('3');

  const result = calcTCO(
    Number(hardware), Number(maintenance),
    Number(license), Number(power), Number(years)
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      
      {/* TCO Inputs */}
      <div className="glass-strong" style={{ padding: 28, borderRadius: 'var(--radius-lg)' }}>
        <h3 className="font-heading" style={{ fontWeight: 850, fontSize: '1.05em', marginBottom: 20, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚙️</span> <span>{t('enterprise.tcoInputs')}</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: t('enterprise.hardwareCost'), val: hardware, set: setHardware },
            { label: t('enterprise.maintenanceCost'), val: maintenance, set: setMaintenance },
            { label: t('enterprise.licenseCost'), val: license, set: setLicense },
            { label: t('enterprise.powerCost'), val: power, set: setPower },
            { label: t('enterprise.period'), val: years, set: setYears },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type="number" className="input-field" value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* TCO Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* TCO Summary */}
        <div className="card-premium" style={{ padding: 24, background: `linear-gradient(135deg, ${COLOR}06, transparent 80%)`, borderLeft: `4px solid ${COLOR}` }}>
          <h3 className="font-heading" style={{ fontWeight: 850, fontSize: '1.05em', marginBottom: 16, color: 'var(--text-primary)' }}>
            {t('enterprise.tcoSummary')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.display.map(d => (
              <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border-strong)' }}>
                <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)', fontWeight: 550 }}>{t(d.label)}</span>
                <span style={{ fontSize: '0.94em', fontWeight: 850, color: COLOR }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Year-by-Year Cumulative Progress */}
        <div className="glass-strong" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
          <h4 className="font-heading" style={{ fontWeight: 800, fontSize: '0.82em', marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('enterprise.yearCumulative')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.yearlyData.map(y => {
              const pct = (y.cumulative / result.totalTCO) * 100;
              return (
                <div key={y.year}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78em', fontWeight: 650, color: 'var(--text-secondary)' }}>{t('enterprise.year')} {y.year}</span>
                    <span style={{ fontSize: '0.78em', fontWeight: 800, color: 'var(--text-primary)' }}>{formatINR(y.cumulative)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(to right, ${COLOR}, #38bdf8)`, borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

function InfraPlanner() {
  const { language, t } = useApp();
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const planInfra = async (template) => {
    setSelected(template);
    setLoading(true);
    setResponse('');
    setError('');
    const resolvedLabel = t('enterprise.' + (template.id === 'smb' ? 'smbOffice' : template.id === 'enterprise' ? 'entOffice' : template.id === 'hospital' ? 'hospital' : template.id === 'school' ? 'school' : '')) || template.label;
    const prompt = `Design a complete IT infrastructure plan for: ${resolvedLabel}. Include: component specifications, vendor recommendations, network topology, redundancy plan, backup strategy, total cost estimate in INR, and 3-year roadmap.`;
    let acc = '';
    await streamChat(
      { messages: [{ role: 'user', content: prompt }], agent: 'enterprise_agent', language },
      c => { acc += c; setResponse(acc); },
      () => setLoading(false),
      e => { setError(e); setLoading(false); }
    );
  };

  const planCustom = async () => {
    if (!custom.trim()) return;
    await planInfra({ label: custom, icon: '🏢', id: 'custom' });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {INFRA_TEMPLATES.map(item => {
          const resolvedLabel = t('enterprise.' + (item.id === 'smb' ? 'smbOffice' : item.id === 'enterprise' ? 'entOffice' : item.id === 'hospital' ? 'hospital' : 'school'));
          const resolvedDesc = t('enterprise.' + (item.id === 'smb' ? 'smbOfficeDesc' : item.id === 'enterprise' ? 'entOfficeDesc' : item.id === 'hospital' ? 'hospitalDesc' : 'schoolDesc'));
          const isSelected = selected?.id === item.id;
          return (
            <div
              key={item.id}
              className="card-premium hover-scale"
              style={{
                padding: 22,
                cursor: 'pointer',
                border: isSelected ? `2.5px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                background: isSelected ? `${COLOR}08` : 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onClick={() => planInfra(item)}
            >
              <div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div className="font-heading" style={{ fontWeight: 850, fontSize: '0.92em', color: 'var(--text-primary)', marginBottom: 4 }}>{resolvedLabel}</div>
                <div style={{ fontSize: '0.74em', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>{resolvedDesc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--glass-border-strong)', paddingTop: 10 }}>
                {item.components.slice(0, 3).map(c => (
                  <div key={c} style={{ fontSize: '0.7em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                    <span className="truncate">{c}</span>
                  </div>
                ))}
                {item.components.length > 3 && <div style={{ fontSize: '0.68em', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 9 }}>+{item.components.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-strong" style={{ padding: 24, marginBottom: 20, borderRadius: 'var(--radius-lg)' }}>
        <h4 className="font-heading" style={{ fontWeight: 800, fontSize: '0.9em', marginBottom: 12 }}>{t('enterprise.customInfraTitle')}</h4>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input-field" value={custom} onChange={e => setCustom(e.target.value)} placeholder={t('enterprise.customInfraPlaceholder')} style={{ flex: 1 }} />
          <button onClick={planCustom} disabled={!custom.trim() || loading} className="premium-btn hover-scale" style={{ padding: '10px 20px', fontSize: '0.82em', background: `linear-gradient(135deg, ${COLOR}, #0284c7)`, boxShadow: `0 4px 12px rgba(14, 165, 233, 0.2)`, flexShrink: 0 }}>
            {t('enterprise.planBtn')}
          </button>
        </div>
      </div>

      {(loading || response || error) && (
        <div className="glass-strong" style={{ padding: 28, borderRadius: 'var(--radius-lg)', borderLeft: `4px solid ${COLOR}`, boxShadow: 'var(--shadow-md)' }}>
          {loading && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85em', minHeight: 40 }}>
              {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i*0.16}s`, background: COLOR }} />)}
              <span style={{ marginLeft: 6 }}>{t('enterprise.planningProgress')}</span>
            </div>
          )}
          {error && <div style={{ color: '#dc2626', fontSize: '0.85em' }}>⚠️ {error}</div>}
          {response && <div style={{ fontSize: '0.9em', lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{response}</div>}
        </div>
      )}
    </div>
  );
}

export default function EnterprisePortal() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState('infra');

  const TABS = [
    { id: 'infra', label: t('enterprise.infra'), icon: '🏗️' },
    { id: 'tco', label: t('enterprise.tco'), icon: '💰' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="aurora-mesh" />
      
      {/* Header */}
      <div style={{ padding: '32px 40px', background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)`, borderBottom: '1px solid var(--glass-border-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: `${COLOR}18`, border: `2px solid ${COLOR}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: 'var(--shadow-sm)' }}>🏢</div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.5em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{t('module.enterprise.title')}</h1>
            <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 6 }}>{t('module.enterprise.desc')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 32px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-surface)', overflowX: 'auto', scrollbarWidth: 'none', zIndex: 10 }} className="custom-scrollbar">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); }} className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`} style={activeTab === tab.id ? { color: COLOR, background: `${COLOR}14`, boxShadow: 'var(--shadow-sm)' } : {}}>
            <span style={{ fontSize: '1.1em' }}>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px', zIndex: 10 }}>
        {activeTab === 'infra' && <InfraPlanner />}
        {activeTab === 'tco' && <TCOCalculator />}
      </div>
    </div>
  );
}
