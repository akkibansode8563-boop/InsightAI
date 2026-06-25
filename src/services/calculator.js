// Format currency in Indian Rupees
export function formatINR(amount) {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// Format percentage
export function formatPct(value) {
  return value.toFixed(2) + '%';
}

/**
 * Calculate ROI (Return on Investment)
 * @param {number} cost - Purchase/cost price
 * @param {number} sell - Selling price
 * @param {number} units - Number of units
 */
export function calcROI(cost, sell, units = 1) {
  if (!cost || !sell) return null;
  const roiPct = ((sell - cost) / cost) * 100;
  const marginPer = sell - cost;
  const totalProfit = marginPer * units;
  return {
    formula: 'ROI% = ((Sell – Cost) / Cost) × 100',
    steps: [
      `= ((${formatINR(sell)} – ${formatINR(cost)}) / ${formatINR(cost)}) × 100`,
      `= (${formatINR(marginPer)} / ${formatINR(cost)}) × 100`,
      `= ${formatPct(roiPct)}`
    ],
    result: roiPct,
    marginPerUnit: marginPer,
    totalProfit,
    units,
    display: [
      { label: 'ROI %', value: formatPct(roiPct) },
      { label: 'Profit per unit', value: formatINR(marginPer) },
      { label: `Total profit (${units} units)`, value: formatINR(totalProfit) },
    ]
  };
}

/**
 * Calculate Gross Margin
 * @param {number} mrp - Maximum Retail Price / Selling Price
 * @param {number} cost - Cost price
 */
export function calcMargin(mrp, cost) {
  if (!mrp || !cost) return null;
  const marginAmt = mrp - cost;
  const marginPct = (marginAmt / mrp) * 100;
  return {
    formula: 'Margin% = ((MRP – Cost) / MRP) × 100',
    steps: [
      `= ((${formatINR(mrp)} – ${formatINR(cost)}) / ${formatINR(mrp)}) × 100`,
      `= (${formatINR(marginAmt)} / ${formatINR(mrp)}) × 100`,
      `= ${formatPct(marginPct)}`
    ],
    result: marginPct,
    marginAmount: marginAmt,
    display: [
      { label: 'Margin %', value: formatPct(marginPct) },
      { label: 'Margin ₹', value: formatINR(marginAmt) },
      { label: 'MRP', value: formatINR(mrp) },
      { label: 'Cost', value: formatINR(cost) },
    ]
  };
}

/**
 * Calculate Break-Even Units
 * @param {number} fixedCost - Total fixed costs
 * @param {number} price - Selling price per unit
 * @param {number} varCost - Variable cost per unit
 */
export function calcBreakEven(fixedCost, price, varCost) {
  if (!fixedCost || !price || varCost === undefined) return null;
  const contribution = price - varCost;
  if (contribution <= 0) return { error: 'Price must be greater than variable cost' };
  const units = Math.ceil(fixedCost / contribution);
  return {
    formula: 'Break-Even Units = Fixed Cost / (Price – Variable Cost)',
    steps: [
      `= ${formatINR(fixedCost)} / (${formatINR(price)} – ${formatINR(varCost)})`,
      `= ${formatINR(fixedCost)} / ${formatINR(contribution)}`,
      `= ${units} units`
    ],
    result: units,
    display: [
      { label: 'Break-even units', value: units + ' units' },
      { label: 'Break-even revenue', value: formatINR(units * price) },
      { label: 'Contribution per unit', value: formatINR(contribution) },
    ]
  };
}

/**
 * Calculate Total Cost of Ownership (TCO)
 * @param {number} hardware - Upfront hardware cost
 * @param {number} maintenance - Annual maintenance cost
 * @param {number} license - Annual license cost
 * @param {number} powerAnnual - Annual power/electricity cost
 * @param {number} years - Analysis period in years
 */
export function calcTCO(hardware, maintenance, license, powerAnnual, years) {
  const yearlyData = [];
  let cumulative = hardware;
  for (let y = 1; y <= years; y++) {
    const yearCost = maintenance + license + powerAnnual;
    cumulative += yearCost;
    yearlyData.push({ year: y, annual: y === 1 ? hardware + yearCost : yearCost, cumulative });
  }
  return {
    hardware,
    maintenanceAnnual: maintenance,
    licenseAnnual: license,
    powerAnnual,
    years,
    totalTCO: cumulative,
    yearlyData,
    display: [
      { label: 'Hardware (Year 0)', value: formatINR(hardware) },
      { label: 'Annual operating cost', value: formatINR(maintenance + license + powerAnnual) },
      { label: `${years}-Year TCO`, value: formatINR(cumulative) },
    ]
  };
}

/**
 * Calculate Quotation with GST
 * @param {Array} items - Array of line items { name, qty, unitPrice }
 * @param {number} gstRate - GST rate percentage (default 18%)
 */
export function calcQuotation(items = [], gstRate = 18) {
  const lineItems = items.map((item, i) => {
    const unitPrice = Math.round(item.unitPrice || 0);
    const qty = item.qty || 1;
    return { sr: i + 1, ...item, unitPrice, qty, lineTotal: unitPrice * qty };
  });
  const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
  const gstAmount = Math.round(subtotal * gstRate / 100);
  return { lineItems, subtotal, gstRate, gstAmount, grandTotal: subtotal + gstAmount };
}

/**
 * Calculate Inventory Carrying Cost
 * @param {number} inventoryValue - Total inventory value
 * @param {number} ratePercent - Annual carrying rate percentage (default 22%)
 */
export function calcCarryingCost(inventoryValue, ratePercent = 22) {
  const annual = inventoryValue * ratePercent / 100;
  return {
    inventoryValue,
    ratePercent,
    annualCost: annual,
    monthlyCost: annual / 12,
    display: [
      { label: 'Inventory value', value: formatINR(inventoryValue) },
      { label: `Carrying cost @${ratePercent}%/year`, value: formatINR(annual) },
      { label: 'Monthly carrying cost', value: formatINR(annual / 12) },
    ]
  };
}

/**
 * Calculate Volume Discount Pricing
 * @param {number} basePrice - Base unit price
 * @param {number} qty - Quantity ordered
 * @param {Array} tiers - Discount tiers [{minQty, discountPct}]
 */
export function calcVolumeDiscount(basePrice, qty, tiers = []) {
  const applicableTier = [...tiers]
    .sort((a, b) => b.minQty - a.minQty)
    .find(tier => qty >= tier.minQty);
  const discountPct = applicableTier?.discountPct || 0;
  const discountAmt = basePrice * discountPct / 100;
  const discountedPrice = basePrice - discountAmt;
  const lineTotal = discountedPrice * qty;
  const savings = discountAmt * qty;
  return {
    basePrice,
    qty,
    discountPct,
    discountedPrice,
    lineTotal,
    savings,
    display: [
      { label: 'Base unit price', value: formatINR(basePrice) },
      { label: 'Discount applied', value: formatPct(discountPct) },
      { label: 'Discounted price', value: formatINR(discountedPrice) },
      { label: `Total (${qty} units)`, value: formatINR(lineTotal) },
      { label: 'Total savings', value: formatINR(savings) },
    ]
  };
}

/**
 * Parse a math expression from text (simple arithmetic)
 * @param {string} expr - Math expression string
 */
export function evalExpression(expr) {
  try {
    // Sanitize: allow only digits, operators, spaces, dots, parens
    const clean = expr.replace(/[^0-9+\-*/().%\s]/g, '');
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + clean + ')')();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
