import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { calcQuotation, calcMargin, formatINR, formatPct } from '../services/calculator.js';

const COLOR = '#059669';

const SAMPLE_SCHEMES = [
  { id: 1, brand: 'HP', title: 'HP Spring Surge Q2 2025', type: 'Volume', discount: '8%', minQty: 10, validTill: '2025-06-30', product: 'ProLiant Servers', badge: 'HOT' },
  { id: 2, brand: 'Lenovo', title: 'ThinkPad Business Booster', type: 'Target', discount: '₹5,000 cashback/unit', minQty: 5, validTill: '2025-07-15', product: 'ThinkPad Series', badge: 'NEW' },
  { id: 3, brand: 'Dell', title: 'PowerEdge Partner Promo', type: 'Bundle', discount: '12%', minQty: 3, validTill: '2025-06-15', product: 'PowerEdge + iDRAC', badge: '' },
  { id: 4, brand: 'Cisco', title: 'Smart Net Total Care Bundle', type: 'Service', discount: '15% off AMC', minQty: 1, validTill: '2025-07-31', product: 'Cisco Switches', badge: 'LIMITED' },
  { id: 5, brand: 'Epson', title: 'Print More Save More', type: 'Ink+Hardware', discount: '₹2,000 bundle saving', minQty: 2, validTill: '2025-06-28', product: 'EcoTank Series', badge: '' },
];

function PageHeader() {
  return (
    <div style={{ padding: '28px 32px 24px', background: `linear-gradient(135deg, ${COLOR}14 0%, transparent 60%)`, borderBottom: '1px solid var(--glass-border-strong)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${COLOR}20`, border: `2px solid ${COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>
        <div>
          <h1 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>Dealer Portal</h1>
          <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 4 }}>Quotations, Stock, Schemes & Margin Calculator</p>
        </div>
      </div>
    </div>
  );
}

function QuotationTool() {
  const [items, setItems] = useState([
    { name: 'HP ProLiant DL380 Gen11', qty: 2, unitPrice: 425000, sku: 'HPE-DL380G11' },
    { name: 'HP 16GB DDR5 RAM', qty: 8, unitPrice: 9500, sku: 'HPE-P43313' },
  ]);
  const [gstRate, setGstRate] = useState(18);
  const [customerName, setCustomerName] = useState('');
  const [copied, setCopied] = useState(false);

  const result = calcQuotation(items, gstRate);

  const addItem = () => setItems(prev => [...prev, { name: '', qty: 1, unitPrice: 0, sku: '' }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const copyText = () => {
    const text = [
      `QUOTATION — IT Solutions`,
      customerName ? `Customer: ${customerName}` : '',
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      ...result.lineItems.map(li => `${li.sr}. ${li.name} (${li.sku || ''}) × ${li.qty} = ${formatINR(li.lineTotal)}`),
      '',
      `Subtotal: ${formatINR(result.subtotal)}`,
      `GST @${gstRate}%: ${formatINR(result.gstAmount)}`,
      `Grand Total: ${formatINR(result.grandTotal)}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="input-field" style={{ maxWidth: 220 }} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer / Company name" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)' }}>GST %</label>
          <select className="input-field" style={{ width: 80 }} value={gstRate} onChange={e => setGstRate(Number(e.target.value))}>
            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>SKU</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                <td>
                  <input
                    className="input-field"
                    style={{ minWidth: 200 }}
                    value={item.name}
                    onChange={e => updateItem(i, 'name', e.target.value)}
                    placeholder="Product name"
                  />
                </td>
                <td>
                  <input
                    className="input-field"
                    style={{ width: 110 }}
                    value={item.sku}
                    onChange={e => updateItem(i, 'sku', e.target.value)}
                    placeholder="SKU"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: 70, textAlign: 'right' }}
                    value={item.qty}
                    min={1}
                    onChange={e => updateItem(i, 'qty', Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: 120, textAlign: 'right' }}
                    value={item.unitPrice}
                    onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                  />
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatINR(item.qty * item.unitPrice)}
                </td>
                <td>
                  <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1em' }} title="Remove">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={addItem} className="btn-ghost">+ Add Item</button>
        <button onClick={copyText} className="btn-ghost">{copied ? '✅ Copied!' : '📋 Copy Quotation'}</button>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: 20, maxWidth: 360, marginLeft: 'auto', background: `${COLOR}08` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(result.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
            <span>GST @{gstRate}%</span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(result.gstAmount)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--glass-border-strong)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1em' }}>
            <span className="font-heading" style={{ fontWeight: 900 }}>Grand Total</span>
            <span className="font-heading" style={{ fontWeight: 900, color: COLOR, fontSize: '1.1em' }}>{formatINR(result.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarginTool() {
  const [mrp, setMrp] = useState('');
  const [cost, setCost] = useState('');
  const result = calcMargin(Number(mrp), Number(cost));

  return (
    <div className="card" style={{ padding: 24, maxWidth: 480 }}>
      <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.95em', marginBottom: 16 }}>📊 Margin Calculator</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Selling Price (MRP)</label>
          <input type="number" className="input-field" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="₹ Selling price" />
        </div>
        <div>
          <label style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Cost Price</label>
          <input type="number" className="input-field" value={cost} onChange={e => setCost(e.target.value)} placeholder="₹ Your cost" />
        </div>
      </div>
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.display.map(d => (
            <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.82em', color: 'var(--text-secondary)' }}>{d.label}</span>
              <span style={{ fontSize: '0.9em', fontWeight: 800, color: COLOR }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SchemesBoard() {
  const badgeStyle = (badge) => {
    if (badge === 'HOT') return { background: '#fef2f2', color: '#dc2626' };
    if (badge === 'NEW') return { background: '#f0fdf4', color: '#059669' };
    if (badge === 'LIMITED') return { background: '#fffbeb', color: '#d97706' };
    return {};
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
      {SAMPLE_SCHEMES.map(s => (
        <div key={s.id} className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          {s.badge && (
            <span className="badge" style={{ ...badgeStyle(s.badge), position: 'absolute', top: 12, right: 12, fontSize: '0.62em' }}>
              {s.badge}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="badge badge-info" style={{ fontSize: '0.68em' }}>{s.brand}</span>
            <span className="badge badge-warning" style={{ fontSize: '0.68em' }}>{s.type}</span>
          </div>
          <div className="font-heading" style={{ fontWeight: 800, fontSize: '0.92em', color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</div>
          <div style={{ fontSize: '0.78em', color: 'var(--text-secondary)', marginBottom: 8 }}>{s.product}</div>
          <div style={{ fontSize: '1em', fontWeight: 900, color: COLOR, marginBottom: 8 }}>{s.discount}</div>
          <div style={{ display: 'flex', gap: 10, fontSize: '0.72em', color: 'var(--text-muted)' }}>
            <span>Min qty: {s.minQty}</span>
            <span>•</span>
            <span>Valid till: {s.validTill}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PageHeader />
      <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-surface)', overflowX: 'auto' }} className="custom-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            style={activeTab === tab.id ? { color: COLOR, background: `${COLOR}18` } : {}}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {activeTab === 'quotation' && <QuotationTool />}
        {activeTab === 'margin' && <MarginTool />}
        {activeTab === 'schemes' && <SchemesBoard />}
      </div>
    </div>
  );
}
