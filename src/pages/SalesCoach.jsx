import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
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

const PERSONAS = [
  {
    id: 'smb_owner',
    name: 'Karan Malhotra',
    role: 'SMB Owner',
    icon: '👨‍💼',
    desc: 'Extremely budget-conscious and wants to see clear ROI. Demands discounts.',
    prompt: 'You are Karan Malhotra, owner of a small logistics firm in Maharashtra. You have a budget of under ₹1.5 Lakhs and need laptops for your new staff. You are highly price-sensitive and skeptical about premium support or warranties. Challenge the seller on pricing and value.'
  },
  {
    id: 'school_director',
    name: 'Anjali Deshmukh',
    role: 'School Director',
    icon: '👩‍🏫',
    desc: 'Worries about child safety, easy setup, and long-term durability. Low tech knowledge.',
    prompt: 'You are Anjali Deshmukh, Director of a primary school. You want to set up an IT lab with 20 computers. You have low technical knowledge and worry about durability, warranty, security, and child-safe usage. Raise concerns about complexity and maintenance.'
  },
  {
    id: 'enterprise_cto',
    name: 'Vikram Joshi',
    role: 'Enterprise CTO',
    icon: '🏢',
    desc: 'Requires strict security compliance, SLA guarantees, scalability, and OEM backing.',
    prompt: 'You are Vikram Joshi, CTO of a growing fintech company. You want to procure servers for data hosting. You care about security compliance, strict SLAs, OEM support, and cloud migration trade-offs. You will challenge the seller on technical specs and reliability.'
  }
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
  const { language, t, addXp } = useApp();
  const { showToast } = useToast();
  
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

  // Roleplay States
  const [roleplayPersona, setRoleplayPersona] = useState(null);
  const [roleplayMessages, setRoleplayMessages] = useState([]);
  const [roleplayInput, setRoleplayInput] = useState('');
  const [roleplayActive, setRoleplayActive] = useState(false);
  const [roleplayLoading, setRoleplayLoading] = useState(false);
  const [roleplayCompleted, setRoleplayCompleted] = useState(false);
  const [roleplayScore, setRoleplayScore] = useState(null);
  const [roleplayFeedback, setRoleplayFeedback] = useState(null);

  const messagesEndRef = useRef(null);

  const COLOR = '#8b5cf6';

  const TABS = [
    { id: 'playbooks', label: t('sales.playbooks'), icon: '📖' },
    { id: 'pitch', label: t('sales.pitch'), icon: '🎤' },
    { id: 'objection', label: t('sales.objection'), icon: '🛡️' },
    { id: 'negotiation', label: t('sales.negotiation'), icon: '🤝' },
    { id: 'discovery', label: t('sales.discovery'), icon: '🔍' },
    { id: 'roleplay', label: language === 'mr' ? 'भूमिका-अभिनय' : language === 'hi' ? 'भूमिका-अभिनय' : 'Role-play', icon: '🎭' },
  ];

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roleplayMessages, roleplayLoading]);

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

  // Roleplay Core Logic
  const startRoleplay = async (persona) => {
    setRoleplayPersona(persona);
    setRoleplayMessages([]);
    setRoleplayActive(true);
    setRoleplayCompleted(false);
    setRoleplayScore(null);
    setRoleplayFeedback(null);
    setRoleplayLoading(true);

    const initialInstruction = `[SYSTEM: Start the role-play. You are ${persona.name}, the ${persona.role}. Persona context: ${persona.prompt}. Answer in character. Do NOT break character under any circumstances. Begin by introducing yourself and asking for my pitch or quote for your hardware needs.]`;
    
    let acc = '';
    const initialMsg = { role: 'assistant', content: '' };
    setRoleplayMessages([initialMsg]);

    await streamChat(
      {
        messages: [{ role: 'user', content: initialInstruction }],
        agent: 'sales_practice',
        language
      },
      chunk => {
        acc += chunk;
        setRoleplayMessages([{ role: 'assistant', content: acc }]);
      },
      () => {
        setRoleplayLoading(false);
      },
      err => {
        setError(err);
        setRoleplayLoading(false);
      }
    );
  };

  const sendRoleplayMessage = async () => {
    if (!roleplayInput.trim() || roleplayLoading) return;

    const userMsg = { role: 'user', content: roleplayInput };
    const updatedMessages = [...roleplayMessages, userMsg];
    setRoleplayMessages(updatedMessages);
    setRoleplayInput('');
    setRoleplayLoading(true);

    const apiMessages = [
      { role: 'user', content: `[SYSTEM: Continue the role-play. Remember you are ${roleplayPersona.name}, the ${roleplayPersona.role}. Objection context: ${roleplayPersona.prompt}. Maintain character. If the sales pitch is complete or if I ask for feedback, or if we have completed 3-4 turns, conclude the conversation and output the ROLE-PLAY COMPLETED score card.]` },
      ...updatedMessages
    ];

    let acc = '';
    const botMsg = { role: 'assistant', content: '' };
    setRoleplayMessages(prev => [...prev, botMsg]);

    await streamChat(
      {
        messages: apiMessages,
        agent: 'sales_practice',
        language
      },
      chunk => {
        acc += chunk;
        setRoleplayMessages(prev => {
          const list = [...prev];
          list[list.length - 1] = { role: 'assistant', content: acc };
          return list;
        });
      },
      () => {
        setRoleplayLoading(false);
        if (acc.includes('ROLE-PLAY COMPLETED')) {
          handleRoleplayCompletion(acc);
        }
      },
      err => {
        setError(err);
        setRoleplayLoading(false);
      }
    );
  };

  const handleRoleplayCompletion = (text) => {
    setRoleplayCompleted(true);
    setRoleplayActive(false);

    try {
      const lines = text.split('\n');
      let result = 'FAIL';
      let score = 75;
      let feedback = '';
      
      let feedbackLines = [];
      let captureFeedback = false;

      for (const line of lines) {
        if (line.includes('Result:')) {
          result = line.split('Result:')[1].trim().replace(/[\[\]]/g, '');
        } else if (line.includes('Score:')) {
          score = parseInt(line.split('Score:')[1].trim().replace(/[\[\]]/g, ''), 10);
        } else if (line.includes('Feedback:')) {
          feedback = line.split('Feedback:')[1].trim().replace(/[\[\]]/g, '');
          captureFeedback = true;
        } else if (captureFeedback) {
          if (line.trim() === '---' || line.includes('ROLE-PLAY COMPLETED')) {
            captureFeedback = false;
          } else {
            feedbackLines.push(line.trim());
          }
        }
      }

      if (feedbackLines.length > 0) {
        feedback = (feedback + ' ' + feedbackLines.join(' ')).trim();
      }

      setRoleplayScore(score);
      setRoleplayFeedback(feedback || 'Good qualification of buyer needs. Focus on highlighting SLA and support benefits.');

      const xpResult = addXp(score * 2);
      if (xpResult?.leveledUp) {
        showToast(`🎉 Level Up! You reached Level ${xpResult.newLevel}!`, 'success');
      } else {
        showToast(`🎯 Role-play finished! Earned ${score * 2} XP.`, 'success');
      }
    } catch (e) {
      console.error('Error parsing roleplay scorecard', e);
      setRoleplayScore(80);
      setRoleplayFeedback('Great session. Successfully qualified buyer expectations and structured pricing.');
      addXp(160);
      showToast('🎯 Role-play finished! Earned 160 XP.', 'success');
    }
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

        {/* Role-Play Practice Tab */}
        {activeTab === 'roleplay' && (
          <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
            
            {/* Persona Selector Screen */}
            {!roleplayActive && !roleplayCompleted && (
              <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
                <h3 className="font-heading" style={{ fontSize: '1.25em', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6, textAlign: 'center' }}>
                  {language === 'mr' ? 'आक्षेप हाताळणी सराव' : language === 'hi' ? 'आपत्ति समाधान अभ्यास' : 'Sales Objection Role-play Practice'}
                </h3>
                <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 28, maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.5 }}>
                  {language === 'mr' ? 'ग्राहकांचे आक्षेप हाताळण्याचा सराव करण्यासाठी एक ग्राहक व्यक्तिमत्त्व निवडा.' : language === 'hi' ? 'ग्राहकों की आपत्तियों से निपटने का अभ्यास करने के लिए एक ग्राहक व्यक्तित्व चुनें।' : 'Choose a buyer persona below to start a live objection-handling and negotiation practice session.'}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  {PERSONAS.map(p => (
                    <div
                      key={p.id}
                      className="card-premium hover-scale flex flex-col justify-between"
                      style={{ padding: 24, minHeight: 280, border: '1.5px solid var(--glass-border-strong)', background: 'var(--bg-surface)' }}
                    >
                      <div>
                        <div style={{ fontSize: '2.5em', marginBottom: 12 }}>{p.icon}</div>
                        <h4 className="font-heading" style={{ fontSize: '1.05em', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</h4>
                        <span style={{ fontSize: '0.74em', fontWeight: 700, color: COLOR, textTransform: 'uppercase', tracking: '0.04em' }}>{p.role}</span>
                        <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>{p.desc}</p>
                      </div>
                      <button
                        onClick={() => startRoleplay(p)}
                        className="premium-btn hover-scale"
                        style={{ width: '100%', padding: '10px 16px', fontSize: '0.8em', background: `linear-gradient(135deg, ${COLOR}, ${COLOR}cc)`, marginTop: 20 }}
                      >
                        {language === 'mr' ? 'संभाषण सुरू करा' : language === 'hi' ? 'बातचीत शुरू करें' : 'Start Negotiation'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Role-Play Chat Screen */}
            {roleplayActive && (
              <div className="glass-strong flex flex-col" style={{ borderRadius: 'var(--radius-lg)', height: 500, overflow: 'hidden', border: '1.5px solid var(--glass-border-strong)' }}>
                {/* Active Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.8em' }}>{roleplayPersona.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ fontSize: '0.9em', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {language === 'mr' ? 'ग्राहक:' : language === 'hi' ? 'buyer:' : 'Buyer:'} {roleplayPersona.name}
                      </h4>
                      <span style={{ fontSize: '0.72em', color: 'var(--text-muted)', fontWeight: 600 }}>{roleplayPersona.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRoleplayInput("Please wrap up our negotiation and provide your final score and feedback in the ROLE-PLAY COMPLETED format.");
                      setTimeout(sendRoleplayMessage, 50);
                    }}
                    className="btn-ghost"
                    style={{ fontSize: '0.76em', padding: '6px 12px', borderColor: '#dc2626', color: '#dc2626', background: 'rgba(220,38,38,0.05)' }}
                  >
                    🛑 {language === 'mr' ? 'मूल्यांकन विचारा' : language === 'hi' ? 'मूल्यांकन मांगें' : 'End & Evaluate'}
                  </button>
                </div>

                {/* Messages Container */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }} className="custom-scrollbar bg-[var(--bg-surface)]">
                  {roleplayMessages.map((m, idx) => {
                    const isUser = m.role === 'user';
                    if (m.content.startsWith('[SYSTEM:')) return null;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: isUser ? 'flex-end' : 'flex-start',
                          animation: 'fadeUp 0.2s ease-out'
                        }}
                      >
                        <div
                          className="glass-strong text-left"
                          style={{
                            maxWidth: '75%',
                            padding: '12px 18px',
                            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isUser ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'var(--bg-elevated)',
                            color: isUser ? '#ffffff' : 'var(--text-primary)',
                            border: isUser ? 'none' : '1px solid var(--glass-border-strong)',
                            fontSize: '0.88em',
                            lineHeight: 1.5,
                            boxShadow: 'var(--shadow-sm)',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  {roleplayLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 6, alignItems: 'center', padding: '12px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-strong)', borderRadius: '16px 16px 16px 4px', width: 70 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} className="loading-dot" style={{ animationDelay: `${i * 0.16}s`, background: COLOR }} />
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Panel */}
                <div style={{ padding: 16, borderTop: '1px solid var(--glass-border-strong)', background: 'var(--bg-elevated)', display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    className="input-field"
                    value={roleplayInput}
                    onChange={e => setRoleplayInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendRoleplayMessage(); }}
                    placeholder={language === 'mr' ? 'तुमचे उत्तर लिहा...' : language === 'hi' ? 'अपना उत्तर लिखें...' : 'Type your sales response to the buyer...'}
                    disabled={roleplayLoading}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={sendRoleplayMessage}
                    disabled={!roleplayInput.trim() || roleplayLoading}
                    className="premium-btn"
                    style={{ background: COLOR, width: 44, height: 44, padding: 0, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1em' }}
                  >
                    ➤
                  </button>
                </div>
              </div>
            )}

            {/* Scorecard / Completion Screen */}
            {roleplayCompleted && (
              <div className="glass-strong animate-fade-in" style={{ padding: 32, borderRadius: 'var(--radius-lg)', border: '2px solid var(--glass-border-strong)', animation: 'fadeUp 0.3s ease-out', textAlign: 'center' }}>
                <div style={{ fontSize: '3.5em', marginBottom: 12 }}>
                  {roleplayScore >= 80 ? '🏆' : '💼'}
                </div>
                
                <h3 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: roleplayScore >= 80 ? '#059669' : 'var(--text-primary)', marginBottom: 6 }}>
                  {roleplayScore >= 80 
                    ? (language === 'mr' ? 'व्यवहार यशस्वी!' : language === 'hi' ? 'सौदा पक्का!' : 'Deal Successfully Closed!')
                    : (language === 'mr' ? 'मूल्यवान अनुभव!' : language === 'hi' ? 'मूल्यवान अनुभव!' : 'Deal Under Negotiation')}
                </h3>
                
                <span className="text-sm font-bold text-[var(--text-muted)] block mb-4">
                  {language === 'mr' ? 'व्यक्तिमत्त्व:' : language === 'hi' ? 'व्यक्तित्व:' : 'Persona:'} {roleplayPersona.name} ({roleplayPersona.role})
                </span>

                {/* Score Dial */}
                <div className="glass-strong mx-auto" style={{ width: 140, height: 140, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `3.5px solid ${roleplayScore >= 80 ? '#059669' : COLOR}`, marginBottom: 24, background: 'var(--bg-elevated)' }}>
                  <span style={{ fontSize: '2em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{roleplayScore}</span>
                  <span style={{ fontSize: '0.75em', color: 'var(--text-muted)', fontWeight: 800, marginTop: 4 }}>SCORE / 100</span>
                </div>

                {/* Award XP indicator */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border" style={{ borderColor: 'rgba(5, 150, 105, 0.25)', background: 'rgba(5, 150, 105, 0.05)', color: '#059669', fontSize: '0.82em', fontWeight: 800 }}>
                  ⚡ Earned +{roleplayScore * 2} XP Gamification Reward
                </div>

                {/* Feedback Box */}
                <div className="glass-strong text-left" style={{ padding: 24, borderRadius: 'var(--radius-md)', marginBottom: 28, background: 'var(--bg-elevated)', borderLeft: `4px solid ${roleplayScore >= 80 ? '#059669' : COLOR}` }}>
                  <h4 style={{ fontSize: '0.84em', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    📋 {language === 'mr' ? 'ग्राहकाचे अभिप्राय:' : language === 'hi' ? 'ग्राहक की प्रतिक्रिया:' : 'Buyer Feedback'}
                  </h4>
                  <p style={{ fontSize: '0.88em', color: 'var(--text-primary)', lineHeight: 1.6 }}>{roleplayFeedback}</p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setRoleplayCompleted(false);
                      setRoleplayActive(false);
                      setRoleplayPersona(null);
                    }}
                    className="premium-btn"
                    style={{ background: COLOR, padding: '12px 24px', fontSize: '0.85em' }}
                  >
                    🔄 {language === 'mr' ? 'नवीन सराव सुरू करा' : language === 'hi' ? 'नया अभ्यास शुरू करें' : 'Try Another Persona'}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
