import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { calcQuotation, calcMargin, formatINR } from '../services/calculator.js';

const COLOR = '#059669';

const SAMPLE_SCHEMES = [
  { id: 1, brand: 'HP', title: 'HP Spring Surge Q2 2025', type: 'Volume', discount: '8%', minQty: 10, validTill: '2025-06-30', product: 'ProLiant Servers', badge: 'HOT' },
  { id: 2, brand: 'Lenovo', title: 'ThinkPad Business Booster', type: 'Target', discount: '₹5,000 cashback/unit', minQty: 5, validTill: '2025-07-15', product: 'ThinkPad Series', badge: 'NEW' },
  { id: 3, brand: 'Dell', title: 'PowerEdge Partner Promo', type: 'Bundle', discount: '12%', minQty: 3, validTill: '2025-06-15', product: 'PowerEdge + iDRAC', badge: '' },
  { id: 4, brand: 'Cisco', title: 'Smart Net Total Care Bundle', type: 'Service', discount: '15% off AMC', minQty: 1, validTill: '2025-07-31', product: 'Cisco Switches', badge: 'LIMITED' },
  { id: 5, brand: 'Epson', title: 'Print More Save More', type: 'Ink+Hardware', discount: '₹2,000 bundle saving', minQty: 2, validTill: '2025-06-28', product: 'EcoTank Series', badge: '' },
];

function PageHeader() {
  const { t } = useApp();
  return (
    <div style={{ padding: '32px 40px', background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)`, borderBottom: '1px solid var(--glass-border-strong)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: `${COLOR}18`, border: `2px solid ${COLOR}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: 'var(--shadow-sm)' }}>🏪</div>
        <div>
          <h1 className="font-heading" style={{ fontSize: '1.5em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{t('module.dealer.title')}</h1>
          <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 6 }}>{t('module.dealer.desc')}</p>
        </div>
      </div>
    </div>
  );
}

function QuotationTool() {
  const { t } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [items, setItems] = useState([
    { name: 'HP ProLiant DL380 Gen11', qty: 2, unitPrice: 425000, sku: 'HPE-DL380G11' },
    { name: 'HP 16GB DDR5 RAM', qty: 8, unitPrice: 9500, sku: 'HPE-P43313' },
  ]);
  const [copied, setCopied] = useState(false);

  const result = calcQuotation(items, gstRate);

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems(prev => [...prev, { name: '', qty: 1, unitPrice: 0, sku: '' }]);
  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  const copyText = () => {
    const text = [
      t('dealer.quotationPrefix'),
      customerName ? `${t('dealer.quotationClient')}: ${customerName}` : '',
      `${t('dealer.quotationDate')}: ${new Date().toLocaleDateString('en-IN')}`,
      '----------------------------------------',
      ...result.lineItems.map(li => `${li.sr}. ${li.name} (${li.sku || ''}) × ${li.qty} = ${formatINR(li.lineTotal)}`),
      '',
      `${t('dealer.subtotalLabel')}: ${formatINR(result.subtotal)}`,
      `${t('dealer.gstLabel')} @${gstRate}%: ${formatINR(result.gstAmount)}`,
      `${t('dealer.grandTotalLabel')}: ${formatINR(result.grandTotal)}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(280px, 360px)', gap: 24, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="input-field" style={{ maxWidth: 260 }} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t('dealer.customerNamePlaceholder')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border-strong)' }}>
            <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('dealer.gstPercent')}</label>
            <select className="input-field" style={{ width: 84, padding: '4px 8px' }} value={gstRate} onChange={e => setGstRate(Number(e.target.value))}>
              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
        </div>

        <div className="card-premium" style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>{t('dealer.productHeader')}</th>
                <th>{t('dealer.skuHeader')}</th>
                <th style={{ textAlign: 'right', width: 90 }}>{t('dealer.qtyHeader')}</th>
                <th style={{ textAlign: 'right', width: 140 }}>{t('dealer.priceHeader')}</th>
                <th style={{ textAlign: 'right', width: 150 }}>{t('dealer.totalHeader')}</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 650 }}>{i + 1}</td>
                  <td>
                    <input
                      className="input-field"
                      style={{ minWidth: 200 }}
                      value={item.name}
                      onChange={e => updateItem(i, 'name', e.target.value)}
                      placeholder={t('dealer.productNamePlaceholder')}
                    />
                  </td>
                  <td>
                    <input
                      className="input-field"
                      style={{ width: 110 }}
                      value={item.sku}
                      onChange={e => updateItem(i, 'sku', e.target.value)}
                      placeholder={t('dealer.skuHeader')}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: 74, textAlign: 'right' }}
                      value={item.qty}
                      min={1}
                      onChange={e => updateItem(i, 'qty', Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: 130, textAlign: 'right' }}
                      value={item.unitPrice}
                      onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatINR(item.qty * item.unitPrice)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => removeItem(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2em', transition: 'var(--transition-fast)' }}
                      className="hover-scale"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={addItem} className="btn-ghost hover-scale">{t('dealer.addLineItem')}</button>
          <button onClick={copyText} className="premium-btn hover-scale" style={{ background: `linear-gradient(135deg, ${COLOR}, #047857)`, boxShadow: `0 4px 12px rgba(5, 150, 105, 0.2)` }}>
            {copied ? t('dealer.copied') : t('dealer.copyQuotation')}
          </button>
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="glass-strong" style={{ padding: 24, borderRadius: 'var(--radius-lg)', position: 'sticky', top: 100 }}>
        <h3 className="font-heading" style={{ fontSize: '0.9em', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86em', color: 'var(--text-secondary)' }}>
            <span>{t('dealer.subtotalLabel')}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(result.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86em', color: 'var(--text-secondary)' }}>
            <span>{t('dealer.gstLabel')} @{gstRate}%</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(result.gstAmount)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--glass-border-strong)', margin: '6px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="font-heading" style={{ fontWeight: 900, fontSize: '0.96em' }}>{t('dealer.grandTotalLabel')}</span>
            <span className="font-heading" style={{ fontWeight: 900, color: COLOR, fontSize: '1.2em' }}>{formatINR(result.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarginTool() {
  const { t } = useApp();
  const [mrp, setMrp] = useState('');
  const [cost, setCost] = useState('');
  const result = calcMargin(Number(mrp), Number(cost));

  return (
    <div className="glass-strong" style={{ padding: 28, maxWidth: 520, margin: '0 auto', borderRadius: 'var(--radius-lg)' }}>
      <h3 className="font-heading" style={{ fontWeight: 850, fontSize: '1.05em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>📊</span> <span>{t('dealer.marginCalculatorTitle')}</span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t('dealer.sellingPriceLabel')}</label>
          <input type="number" className="input-field" value={mrp} onChange={e => setMrp(e.target.value)} placeholder={t('dealer.sellingPriceLabel')} />
        </div>
        <div>
          <label style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t('dealer.costPriceLabel')}</label>
          <input type="number" className="input-field" value={cost} onChange={e => setCost(e.target.value)} placeholder={t('dealer.costPriceLabel')} />
        </div>
      </div>
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.display.map(d => {
            const isPct = d.label.includes('%');
            return (
              <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border-strong)' }}>
                <span style={{ fontSize: '0.84em', color: 'var(--text-secondary)', fontWeight: 600 }}>{t(d.label)}</span>
                <span style={{ fontSize: '0.96em', fontWeight: 850, color: isPct ? COLOR : 'var(--text-primary)' }}>{d.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SchemesBoard() {
  const { t } = useApp();
  const badgeStyle = (badge) => {
    if (badge === 'HOT') return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' };
    if (badge === 'NEW') return { background: '#dcfce7', color: '#059669', border: '1px solid #86efac' };
    if (badge === 'LIMITED') return { background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' };
    return {};
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
      {SAMPLE_SCHEMES.map(s => (
        <div key={s.id} className="card-premium hover-scale" style={{ padding: 22, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
          {s.badge && (
            <span className="badge" style={{ ...badgeStyle(s.badge), position: 'absolute', top: 16, right: 16, fontSize: '0.62em' }}>
              {t(s.badge)}
            </span>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span className="badge badge-primary" style={{ fontSize: '0.66em', fontWeight: 800 }}>{s.brand}</span>
              <span className="badge badge-success" style={{ fontSize: '0.66em', fontWeight: 800, background: `${COLOR}15`, color: COLOR }}>{t(s.type)}</span>
            </div>
            <div className="font-heading" style={{ fontWeight: 850, fontSize: '0.96em', color: 'var(--text-primary)', marginBottom: 6 }}>{t(s.title)}</div>
            <div style={{ fontSize: '0.78em', color: 'var(--text-secondary)', marginBottom: 8 }}>{t(s.product)}</div>
          </div>
          <div>
            <div style={{ fontSize: '1.2em', fontWeight: 900, color: COLOR, marginBottom: 10 }}>{t(s.discount)}</div>
            <div style={{ display: 'flex', gap: 10, fontSize: '0.7em', color: 'var(--text-muted)', fontWeight: 550, borderTop: '1px solid var(--glass-border-strong)', paddingTop: 10 }}>
              <span>{t('dealer.minQty')}: {s.minQty}</span>
              <span>•</span>
              <span>{t('dealer.validTill')}: {s.validTill}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DealerPortal() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState('quotation');

  const TABS = [
    { id: 'quotation', label: t('dealer.quotation'), icon: '📋' },
    { id: 'margin', label: t('dealer.margin'), icon: '📊' },
    { id: 'schemes', label: t('dealer.schemes'), icon: '🎁' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="aurora-mesh" />
      <PageHeader />
      <div style={{ display: 'flex', gap: 4, padding: '12px 32px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-surface)', overflowX: 'auto', scrollbarWidth: 'none', zIndex: 10 }} className="custom-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            style={activeTab === tab.id ? { color: COLOR, background: `${COLOR}14`, boxShadow: 'var(--shadow-sm)' } : {}}
          >
            <span style={{ fontSize: '1.1em' }}>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px', zIndex: 10 }}>
        {activeTab === 'quotation' && <QuotationTool />}
        {activeTab === 'margin' && <MarginTool />}
        {activeTab === 'schemes' && <SchemesBoard />}
      </div>
    </div>
  );
}
