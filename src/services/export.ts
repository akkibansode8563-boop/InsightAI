import { formatINR } from './calculator.js';

/**
 * Trigger client-side file download in the browser
 */
function downloadFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export tabular data to an Excel-compatible CSV format.
 * Includes UTF-8 Byte Order Mark (BOM) so Excel renders currency symbols (₹) correctly.
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: any[][]
): void {
  // Add UTF-8 BOM
  let csvContent = '\uFEFF';
  
  // Format headers
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
  
  // Format rows
  rows.forEach(row => {
    const rowStr = row.map(val => {
      const stringified = val === null || val === undefined ? '' : String(val);
      return `"${stringified.replace(/"/g, '""')}"`;
    }).join(',');
    csvContent += rowStr + '\n';
  });

  downloadFile(csvContent, 'text/csv;charset=utf-8;', filename);
}

interface Slide {
  title: string;
  bullets: string[];
}

/**
 * Export presentation blueprints to a PowerPoint-compatible text outline (.txt).
 * MS PowerPoint allows creating presentations directly by importing tab-separated text outlines.
 */
export function exportToPowerPointOutline(
  filename: string,
  title: string,
  subtitle: string,
  slides: Slide[]
): void {
  let outlineContent = `${title}\n\t${subtitle}\n\n`;

  slides.forEach(slide => {
    outlineContent += `${slide.title}\n`;
    slide.bullets.forEach(bullet => {
      outlineContent += `\t- ${bullet}\n`;
    });
    outlineContent += '\n';
  });

  downloadFile(outlineContent, 'text/plain;charset=utf-8;', filename);
}

/**
 * Map Quote items into rows suitable for Excel exports
 */
export function exportQuoteToExcel(customerName: string, items: any[], totals: any) {
  const headers = ['Sr #', 'Item Model', 'SKU', 'Qty', 'Unit MRP (₹)', 'Unit Net Price (₹)', 'Margin %', 'Total Price (₹)'];
  const rows = items.map((item, idx) => [
    idx + 1,
    item.name || item.model || 'Hardware Item',
    item.sku || '-',
    item.qty,
    item.mrp || item.unitPrice,
    item.unitPrice,
    item.marginPercent || '10%',
    item.lineTotal || (item.unitPrice * item.qty)
  ]);

  // Add summaries as final rows
  rows.push([]);
  rows.push(['', '', '', '', '', '', 'Subtotal', totals.subtotal]);
  rows.push(['', '', '', '', '', '', `GST (${totals.gstRate || 18}%)`, totals.gstAmount]);
  rows.push(['', '', '', '', '', '', 'Grand Total', totals.grandTotal]);

  const cleanName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
  exportToExcel(`InsightAI_Quotation_${cleanName}.csv`, headers, rows);
}
