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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
      <div className="card" style={{ padding: 24 }}>
        <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.95em', marginBottom: 16, color: 'var(--text-primary)' }}>⚙️ TCO Inputs</h3>
        {[
          { label: 'Hardware Cost (₹)', val: hardware, set: setHardware },
          { label: 'Annual Maintenance (₹)', val: maintenance, set: setMaintenance },
          { label: 'Annual License (₹)', val: license, set: setLicense },
          { label: 'Annual Power Cost (₹)', val: power, set: setPower },
          { label: 'Analysis Period (years)', val: years, set: setYears },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: '0.76em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input type="number" className="input-field" value={f.val} onChange={e => f.set(e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ padding: 20, background: `${COLOR}08` }}>
          <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.9em', marginBottom: 12, color: 'var(--text-primary)' }}>📊 TCO Summary</h3>
          {result.display.map(d => (
            <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border-strong)' }}>
              <span style={{ fontSize: '0.82em', color: 'var(--text-secondary)' }}>{d.label}</span>
              <span style={{ fontSize: '0.9em', fontWeight: 800, color: COLOR }}>{d.value}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h4 className="font-heading" style={{ fontWeight: 700, fontSize: '0.82em', marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Year-by-Year Cumulative
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.yearlyData.map(y => {
              const pct = (y.cumulative / result.totalTCO) * 100;
              return (
                <div key={y.year}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.76em', fontWeight: 600, color: 'var(--text-secondary)' }}>Year {y.year}</span>
                    <span style={{ fontSize: '0.76em', fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(y.cumulative)}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: COLOR, borderRadius: 2, transition: 'width 0.5s ease' }} />
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
    await planInfra({ label: custom, icon: '🏢' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
        {INFRA_TEMPLATES.map(item => {
          const resolvedLabel = t('enterprise.' + (item.id === 'smb' ? 'smbOffice' : item.id === 'enterprise' ? 'entOffice' : item.id === 'hospital' ? 'hospital' : 'school'));
          const resolvedDesc = t('enterprise.' + (item.id === 'smb' ? 'smbOfficeDesc' : item.id === 'enterprise' ? 'entOfficeDesc' : item.id === 'hospital' ? 'hospitalDesc' : 'schoolDesc'));
          return (
            <div
              key={item.id}
              className="card"
              style={{ padding: 18, cursor: 'pointer', border: selected?.id === item.id ? `2px solid ${COLOR}` : '1px solid var(--glass-border-strong)', transition: 'var(--transition-smooth)' }}
              onClick={() => planInfra(item)}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div className="font-heading" style={{ fontWeight: 800, fontSize: '0.88em', color: 'var(--text-primary)', marginBottom: 4 }}>{resolvedLabel}</div>
              <div style={{ fontSize: '0.72em', color: 'var(--text-muted)', marginBottom: 8 }}>{resolvedDesc}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {item.components.slice(0, 3).map(c => (
                  <div key={c} style={{ fontSize: '0.68em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                    {c}
                  </div>
                ))}
                {item.components.length > 3 && <div style={{ fontSize: '0.68em', color: 'var(--text-muted)' }}>+{item.components.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h4 className="font-heading" style={{ fontWeight: 800, fontSize: '0.88em', marginBottom: 10 }}>{t('enterprise.customInfraTitle')}</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input-field" value={custom} onChange={e => setCustom(e.target.value)} placeholder={t('enterprise.customInfraPlaceholder')} style={{ flex: 1 }} />
          <button onClick={planCustom} disabled={!custom.trim() || loading} className="premium-btn" style={{ padding: '10px 18px', fontSize: '0.82em', background: `linear-gradient(135deg, ${COLOR}, #0284c7)`, flexShrink: 0 }}>
            {t('enterprise.planBtn')}
          </button>
        </div>
      </div>

      {(loading || response || error) && (
        <div className="card" style={{ padding: 20, borderLeft: `3px solid ${COLOR}` }}>
          {loading && <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85em' }}>
            {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i*0.16}s` }} />)}
            <span style={{ marginLeft: 4 }}>{t('enterprise.planningProgress')}</span>
          </div>}
          {error && <div style={{ color: '#dc2626', fontSize: '0.85em' }}>⚠️ {error}</div>}
          {response && <div style={{ fontSize: '0.875em', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{response}</div>}
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '28px 32px 24px', background: `linear-gradient(135deg, ${COLOR}14 0%, transparent 60%)`, borderBottom: '1px solid var(--glass-border-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${COLOR}20`, border: `2px solid ${COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏢</div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{t('module.enterprise.title')}</h1>
            <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 4 }}>{t('module.enterprise.desc')}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-surface)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-tab${activeTab === tab.id ? ' active' : ''}`} style={activeTab === tab.id ? { color: COLOR, background: `${COLOR}18` } : {}}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {activeTab === 'infra' && <InfraPlanner />}
        {activeTab === 'tco' && <TCOCalculator />}
      </div>
    </div>
  );
}
