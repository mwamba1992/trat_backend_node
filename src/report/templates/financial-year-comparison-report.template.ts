import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface FinancialYearRow {
  financialYear: string;
  appealCount: number;
  applicationCount: number;
  totalCases: number;
  decidedCount: number;
  pendingCount: number;
  totalAmounts: string;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateFinancialYearComparisonHtmlTemplate(
  rows: FinancialYearRow[],
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const totalAppeals = rows.reduce((s, r) => s + r.appealCount, 0);
  const totalApps = rows.reduce((s, r) => s + r.applicationCount, 0);
  const totalAll = rows.reduce((s, r) => s + r.totalCases, 0);

  const tableRows = rows.map((row, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td>${i + 1}</td>
      <td><strong>${row.financialYear}</strong></td>
      <td class="num">${row.appealCount}</td>
      <td class="num">${row.applicationCount}</td>
      <td class="num"><strong>${row.totalCases}</strong></td>
      <td class="num">${row.decidedCount}</td>
      <td class="num">${row.pendingCount}</td>
      <td class="amount">${row.totalAmounts}</td>
    </tr>`).join('');

  // Build bar chart for visual comparison
  const maxCases = Math.max(...rows.map((r) => r.totalCases), 1);
  const barChart = rows.map((row) => `
    <div style="display:flex;align-items:center;margin-bottom:6px;">
      <div style="width:100px;font-size:11px;font-weight:bold;">${row.financialYear}</div>
      <div style="flex:1;height:22px;background:#eee;border-radius:3px;overflow:hidden;margin:0 10px;">
        <div style="width:${(row.totalCases / maxCases) * 100}%;height:100%;background:#3498db;border-radius:3px;display:flex;align-items:center;padding-left:8px;color:white;font-size:10px;font-weight:bold;min-width:30px;">${row.totalCases}</div>
      </div>
    </div>`).join('');

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
  .chart-section { margin-bottom:20px; }
  .chart-section h3 { font-size:13px; font-weight:bold; margin-bottom:10px; }
  .footer { position:fixed; bottom:20px; left:40px; right:40px; display:flex; justify-content:space-between; font-size:9px; color:#666; }
</style></head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Financial Year Comparison Report</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>
  <div class="chart-section">
    <h3>Cases by Financial Year</h3>
    ${barChart}
  </div>
  <table>
    <thead><tr>
      <th>Sn.</th><th>Financial Year</th><th class="num">Appeals</th><th class="num">Applications</th><th class="num">Total</th><th class="num">Decided</th><th class="num">Pending</th><th style="text-align:right">Total Amounts</th>
    </tr></thead>
    <tbody>
      ${tableRows}
      <tr class="total-row">
        <td></td><td>TOTAL</td><td class="num">${totalAppeals}</td><td class="num">${totalApps}</td><td class="num">${totalAll}</td>
        <td class="num">${rows.reduce((s, r) => s + r.decidedCount, 0)}</td><td class="num">${rows.reduce((s, r) => s + r.pendingCount, 0)}</td><td></td>
      </tr>
    </tbody>
  </table>
  <div class="footer"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: ${generatedAt}</span></div>
</body></html>`;
}
