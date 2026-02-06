import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface RevenueSummaryRow {
  appType: string;
  billCount: number;
  paidCount: number;
  totalBilled: number;
  totalCollected: number;
  collectionRate: number;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateRevenueSummaryHtmlTemplate(
  rows: RevenueSummaryRow[],
  grandTotals: { billed: number; collected: number; billCount: number; paidCount: number },
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const tableRows = rows.map((row, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td>${i + 1}</td>
      <td>${row.appType}</td>
      <td class="num">${row.billCount}</td>
      <td class="num">${row.paidCount}</td>
      <td class="amount">${formatAmount(row.totalBilled)}</td>
      <td class="amount">${formatAmount(row.totalCollected)}</td>
      <td class="num">${row.collectionRate.toFixed(1)}%</td>
    </tr>`).join('');

  const overallRate = grandTotals.billed > 0 ? ((grandTotals.collected / grandTotals.billed) * 100).toFixed(1) : '0.0';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:11px; color:#1a1a1a; padding:30px 40px; }
  .header { margin-bottom:16px; }
  .header img { height:90px; display:block; margin-bottom:10px; }
  .header h1 { font-size:16px; font-weight:bold; margin-bottom:4px; }
  .header h2 { font-size:13px; font-weight:bold; margin-bottom:4px; }
  .header h3 { font-size:11px; font-weight:normal; color:#555; margin-bottom:10px; }
  .gold-rule { border:none; height:2px; background:#c8a415; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; margin-bottom:14px; }
  th { background:#f5f5f5; font-weight:bold; font-size:11px; text-align:left; padding:8px 6px; border-bottom:2px solid #c8a415; }
  td { padding:7px 6px; border-bottom:1px solid #e0e0e0; font-size:11px; }
  td.num, th.num { text-align:center; }
  td.amount { text-align:right; white-space:nowrap; }
  tr.even { background:#fff; } tr.odd { background:#f9f9f9; }
  tr.total-row td { font-weight:bold; border-top:2px solid #c8a415; background:#f5f5f5; }
  .summary { margin-top:10px; padding:10px 14px; background:#f9f9f9; border:1px solid #ddd; border-radius:4px; }
  .summary p { font-size:11px; margin-bottom:3px; }
  .footer { position:fixed; bottom:20px; left:40px; right:40px; display:flex; justify-content:space-between; font-size:9px; color:#666; }
</style></head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Revenue Summary Report</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead><tr>
      <th>Sn.</th><th>Category</th><th class="num">Bills Generated</th><th class="num">Bills Paid</th><th style="text-align:right">Total Billed</th><th style="text-align:right">Total Collected</th><th class="num">Collection Rate</th>
    </tr></thead>
    <tbody>
      ${tableRows || '<tr><td colspan="7" style="text-align:center;padding:20px;">No data found.</td></tr>'}
      <tr class="total-row">
        <td></td><td>GRAND TOTAL</td><td class="num">${grandTotals.billCount}</td><td class="num">${grandTotals.paidCount}</td><td class="amount">${formatAmount(grandTotals.billed)}</td><td class="amount">${formatAmount(grandTotals.collected)}</td><td class="num">${overallRate}%</td>
      </tr>
    </tbody>
  </table>
  <div class="footer"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: ${generatedAt}</span></div>
</body></html>`;
}
