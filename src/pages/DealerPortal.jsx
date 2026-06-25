import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { calcQuotation, calcMargin, formatINR } from '../services/calculator.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';

const COLOR = '#059669';

const SAMPLE_SCHEMES = [
  { id: 1, brand: 'HP', title: 'HP Spring Surge Q2 2025', type: 'Volume', discount: '8%', minQty: 10, validTill: '2025-06-30', product: 'ProLiant Servers', badge: 'HOT' },
  { id: 2, brand: 'Lenovo', title: 'ThinkPad Business Booster', type: 'Target', discount: '₹5,000 cashback/unit', minQty: 5, validTill: '2025-07-15', product: 'ThinkPad Series', badge: 'NEW' },
  { id: 3, brand: 'Dell', title: 'PowerEdge Partner Promo', type: 'Bundle', discount: '12%', minQty: 3, validTill: '2025-06-15', product: 'PowerEdge + iDRAC', badge: '' },
  { id: 4, brand: 'Cisco', title: 'Smart Net Total Care Bundle', type: 'Service', discount: '15% off AMC', minQty: 1, validTill: '2025-07-31', product: 'Cisco Switches', badge: 'LIMITED' },
  { id: 5, brand: 'Epson', title: 'Print More Save More', type: 'Ink+Hardware', discount: '₹2,000 bundle saving', minQty: 2, validTill: '2025-06-28', product: 'EcoTank Series', badge: '' },
];

// ── PDF Export ─────────────────────────────────────────────────────────
async function exportPDF(items, result, gstRate, customerName) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const qNum = `QT-${Date.now().toString().slice(-6)}`;

  // Header background
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageW, 42, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('DCC® — IT Hardware Solutions', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('InsightAI 2.0 · Enterprise IT Intelligence Platform · Since 1992', 14, 23);

  // Quotation number + date (right aligned)
  doc.setFontSize(9);
  doc.text(`Quotation #: ${qNum}`, pageW - 14, 14, { align: 'right' });
  doc.text(`Date: ${today}`, pageW - 14, 20, { align: 'right' });
  doc.text('Valid for 7 days from date of issue', pageW - 14, 26, { align: 'right' });

  // Customer info
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(customerName || 'Valued Customer', 14, 58);

  // Items Table
  autoTable(doc, {
    startY: 68,
    head: [['#', 'Product Description', 'SKU', 'Qty', 'Unit Price (₹)', 'Total (₹)']],
    body: result.lineItems.map((li, i) => [
      i + 1,
      li.name || '-',
      li.sku || '-',
      li.qty,
      formatINR(li.unitPrice).replace('₹', ''),
      formatINR(li.lineTotal).replace('₹', ''),
    ]),
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 24 }, 3: { cellWidth: 12, halign: 'right' }, 4: { cellWidth: 30, halign: 'right' }, 5: { cellWidth: 30, halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Summary box (right aligned)
  const summaryX = pageW - 80;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(summaryX, finalY, 66, 40, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX + 4, finalY + 10);
  doc.text(`GST @${gstRate}%:`, summaryX + 4, finalY + 18);
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.3);
  doc.line(summaryX + 4, finalY + 22, summaryX + 62, finalY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text('Grand Total:', summaryX + 4, finalY + 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(formatINR(result.subtotal), summaryX + 62, finalY + 10, { align: 'right' });
  doc.text(formatINR(result.gstAmount), summaryX + 62, finalY + 18, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text(formatINR(result.grandTotal), summaryX + 62, finalY + 32, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 22;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageW - 14, footerY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Terms: Prices are subject to change without notice. GST extra as applicable. E&OE.', 14, footerY + 6);
  doc.text('DCC® IT Hardware Solutions · InsightAI 2.0 · www.dcc.co.in', 14, footerY + 12);
  doc.text(`Generated by InsightAI 2.0 on ${today}`, pageW - 14, footerY + 12, { align: 'right' });

  doc.save(`DCC_Quotation_${qNum}.pdf`);
}

// ── WhatsApp Share ─────────────────────────────────────────────────
function shareWhatsApp(items, result, gstRate, customerName) {
  const today = new Date().toLocaleDateString('en-IN');
  const qNum = `QT-${Date.now().toString().slice(-6)}`;
  const lines = [
    `🏪 *DCC IT Hardware Solutions*`,
    `📋 *Quotation #${qNum}*`,
    `📅 Date: ${today}`,
    customerName ? `👤 Client: ${customerName}` : '',
    `─────────────────────`,
    ...result.lineItems.map((li, i) => `${i + 1}. ${li.name} × ${li.qty} = ${formatINR(li.lineTotal)}`),
    `─────────────────────`,
    `Subtotal: ${formatINR(result.subtotal)}`,
    `GST @${gstRate}%: ${formatINR(result.gstAmount)}`,
    `*💰 Grand Total: ${formatINR(result.grandTotal)}*`,
    ``,
    `_Valid for 7 days. Powered by InsightAI 2.0_`,
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
}

// ── Quotation Tool ─────────────────────────────────────────────────
function QuotationTool() {
  const { t } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [items, setItems] = useState([
    { name: 'HP ProLiant DL380 Gen11', qty: 2, unitPrice: 425000, sku: 'HPE-DL380G11' },
    { name: 'HP 16GB DDR5 RAM', qty: 8, unitPrice: 9500, sku: 'HPE-P43313' },
  ]);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const result = calcQuotation(items, gstRate);

  const updateItem = (index, field, value) =>
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));

  const addItem = () => setItems(prev => [...prev, { name: '', qty: 1, unitPrice: 0, sku: '' }]);
  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  const copyText = () => {
    const text = result.lineItems.map((li, i) =>
      `${i + 1}. ${li.name} (${li.sku}) × ${li.qty} = ${formatINR(li.lineTotal)}`
    ).join('\n') + `\n\nSubtotal: ${formatINR(result.subtotal)}\nGST @${gstRate}%: ${formatINR(result.gstAmount)}\nGrand Total: ${formatINR(result.grandTotal)}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportPDF(items, result, gstRate, customerName); }
    catch (e) { console.error('PDF error:', e); }
    finally { setPdfLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Controls Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="input-field max-w-xs"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder={t('dealer.customerNamePlaceholder') || 'Customer / Company Name'}
        />
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] px-3 py-2 rounded-xl border border-[var(--glass-border-strong)]">
          <label className="text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap">GST %</label>
          <select
            className="input-field"
            style={{ width: 80, padding: '4px 8px' }}
            value={gstRate}
            onChange={e => setGstRate(Number(e.target.value))}
          >
            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
      </div>

      {/* ── Desktop Table Layout (md+) ── */}
      <div className="hidden md:block card-premium overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>{t('dealer.productHeader') || 'Product'}</th>
              <th>SKU</th>
              <th style={{ textAlign: 'right', width: 90 }}>Qty</th>
              <th style={{ textAlign: 'right', width: 150 }}>Unit Price (₹)</th>
              <th style={{ textAlign: 'right', width: 150 }}>Total (₹)</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="text-[var(--text-muted)] font-semibold">{i + 1}</td>
                <td>
                  <input className="input-field" style={{ minWidth: 200 }} value={item.name}
                    onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Product name" />
                </td>
                <td>
                  <input className="input-field" style={{ width: 110 }} value={item.sku}
                    onChange={e => updateItem(i, 'sku', e.target.value)} placeholder="SKU" />
                </td>
                <td>
                  <input type="number" className="input-field" style={{ width: 74, textAlign: 'right' }}
                    value={item.qty} min={1} onChange={e => updateItem(i, 'qty', Number(e.target.value))} />
                </td>
                <td>
                  <input type="number" className="input-field" style={{ width: 130, textAlign: 'right' }}
                    value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} />
                </td>
                <td className="text-right font-bold text-[var(--text-primary)]">
                  {formatINR(item.qty * item.unitPrice)}
                </td>
                <td className="text-center">
                  <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600 text-lg transition-colors" title="Remove">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card Layout (< md) ── */}
      <div className="md:hidden flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="card-premium p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Item {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-red-500 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Remove</button>
            </div>
            <div className="flex flex-col gap-3">
              <input className="input-field" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Product name" />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" value={item.sku} onChange={e => updateItem(i, 'sku', e.target.value)} placeholder="SKU" />
                <input type="number" className="input-field text-right" value={item.qty} min={1} onChange={e => updateItem(i, 'qty', Number(e.target.value))} placeholder="Qty" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <input type="number" className="input-field flex-1" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} placeholder="Unit Price (₹)" />
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-[var(--text-muted)] font-semibold">Total</div>
                  <div className="font-bold text-[var(--text-primary)]">{formatINR(item.qty * item.unitPrice)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={addItem} size="sm">
          ＋ Add Item
        </Button>
        <Button variant="ghost" onClick={copyText} size="sm">
          {copied ? '✅ Copied!' : '📋 Copy Text'}
        </Button>
        <Button
          variant="success"
          onClick={handlePDF}
          loading={pdfLoading}
          size="sm"
        >
          📥 Download PDF
        </Button>
        <Button
          variant="secondary"
          onClick={() => shareWhatsApp(items, result, gstRate, customerName)}
          size="sm"
        >
          💬 WhatsApp
        </Button>
      </div>

      {/* Summary Card */}
      <div className="glass-strong rounded-2xl p-5 max-w-sm ml-auto w-full">
        <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-4">Quotation Summary</h3>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Subtotal</span>
            <span className="font-bold">{formatINR(result.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">GST @{gstRate}%</span>
            <span className="font-bold">{formatINR(result.gstAmount)}</span>
          </div>
          <div className="h-px bg-[var(--glass-border-strong)]" />
          <div className="flex justify-between items-center">
            <span className="font-heading font-black text-[var(--text-primary)]">Grand Total</span>
            <span className="font-heading font-black text-xl" style={{ color: COLOR }}>
              {formatINR(result.grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Margin Tool ────────────────────────────────────────────────────
function MarginTool() {
  const { t } = useApp();
  const [mrp, setMrp] = useState('');
  const [cost, setCost] = useState('');
  const result = calcMargin(Number(mrp), Number(cost));

  return (
    <div className="glass-strong p-6 max-w-lg mx-auto rounded-2xl">
      <h3 className="font-heading font-bold text-lg mb-5 flex items-center gap-2">
        <span>📊</span>
        <span>{t('dealer.marginCalculatorTitle') || 'Margin Calculator'}</span>
      </h3>
      <div className="flex flex-col gap-4 mb-5">
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
            {t('dealer.sellingPriceLabel') || 'Selling Price (MRP)'}
          </label>
          <input type="number" className="input-field" value={mrp}
            onChange={e => setMrp(e.target.value)} placeholder="Enter selling price" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
            {t('dealer.costPriceLabel') || 'Cost / Purchase Price'}
          </label>
          <input type="number" className="input-field" value={cost}
            onChange={e => setCost(e.target.value)} placeholder="Enter cost price" />
        </div>
      </div>
      {result && (
        <div className="flex flex-col gap-3">
          {result.display.map(d => {
            const isPct = d.label.includes('%');
            return (
              <div key={d.label} className="flex justify-between items-center px-4 py-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--glass-border-strong)]">
                <span className="text-sm text-[var(--text-secondary)] font-semibold">{t(d.label)}</span>
                <span className="text-base font-black" style={{ color: isPct ? COLOR : 'var(--text-primary)' }}>
                  {d.value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Schemes Board ──────────────────────────────────────────────────
function SchemesBoard() {
  const { t } = useApp();
  const badgeVariant = (badge) => {
    if (badge === 'HOT') return 'danger';
    if (badge === 'NEW') return 'success';
    if (badge === 'LIMITED') return 'warning';
    return 'neutral';
  };

  return (
    /* Horizontal scroll on mobile, grid on desktop */
    <div>
      {/* Mobile: horizontal carousel */}
      <div className="md:hidden flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
        {SAMPLE_SCHEMES.map(s => (
          <div key={s.id} className="snap-start flex-shrink-0 w-72 card-premium p-5 flex flex-col justify-between min-h-[180px]">
            <SchemeCardContent s={s} t={t} badgeVariant={badgeVariant} />
          </div>
        ))}
      </div>
      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_SCHEMES.map(s => (
          <div key={s.id} className="card-premium p-5 flex flex-col justify-between min-h-[180px]">
            <SchemeCardContent s={s} t={t} badgeVariant={badgeVariant} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SchemeCardContent({ s, t, badgeVariant }) {
  return (
    <>
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="primary">{s.brand}</Badge>
            <Badge variant="success">{s.type}</Badge>
          </div>
          {s.badge && <Badge variant={badgeVariant(s.badge)}>{s.badge}</Badge>}
        </div>
        <div className="font-heading font-black text-[var(--text-primary)] mb-1.5 leading-tight">{s.title}</div>
        <div className="text-xs text-[var(--text-secondary)]">{s.product}</div>
      </div>
      <div>
        <div className="text-xl font-black mt-3 mb-3" style={{ color: COLOR }}>{s.discount}</div>
        <div className="flex gap-3 text-xs text-[var(--text-muted)] font-semibold border-t border-[var(--glass-border-strong)] pt-3">
          <span>Min Qty: {s.minQty}</span>
          <span>•</span>
          <span>Valid: {s.validTill}</span>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DealerPortal() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState('quotation');

  const TABS = [
    { id: 'quotation', label: t('dealer.quotation') || 'Quotation', icon: '📋' },
    { id: 'margin', label: t('dealer.margin') || 'Margin', icon: '📊' },
    { id: 'schemes', label: t('dealer.schemes') || 'Schemes', icon: '🎁' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="aurora-mesh" />
      <PageHeader
        icon="🏪"
        title={t('module.dealer.title') || 'Dealer Portal'}
        subtitle={t('module.dealer.desc') || 'Quotation, margins, schemes & channel programs'}
        accent={COLOR}
      />
      {/* Tab Bar */}
      <div className="flex gap-2 px-4 md:px-6 py-3 border-b border-[var(--glass-border-strong)] bg-[var(--bg-surface)] overflow-x-auto scrollbar-hide z-10">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
            style={activeTab === tab.id ? { color: COLOR, background: `${COLOR}14` } : {}}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 z-10">
        {activeTab === 'quotation' && <QuotationTool />}
        {activeTab === 'margin' && <MarginTool />}
        {activeTab === 'schemes' && <SchemesBoard />}
      </div>
    </div>
  );
}
