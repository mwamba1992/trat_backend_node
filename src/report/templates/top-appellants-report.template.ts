import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface TopAppellantRow {
  rank: number;
  appellantName: string;
  caseCount: number;
  pendingCount: number;
  decidedCount: number;
  totalAmounts: string;
  taxTypes: string;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateTopAppellantsHtmlTemplate(
  rows: TopAppellantRow[],
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const totalCases = rows.reduce((s, r) => s + r.caseCount, 0);

  const tableRows = rows
    .map(
      (row, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td class="num">${row.rank}</td>
        <td>${row.appellantName}</td>
        <td class="num"><strong>${row.caseCount}</strong></td>
        <td class="num">${row.pendingCount}</td>
        <td class="num">${row.decidedCount}</td>
        <td>${row.taxTypes}</td>
        <td class="amount">${row.totalAmounts}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 30px 40px; }
    .header { margin-bottom: 16px; }
    .header img { height: 90px; display: block; margin-bottom: 10px; }
    .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
    .header h2 { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
    .header h3 { font-size: 11px; font-weight: normal; color: #555; margin-bottom: 10px; }
    .gold-rule { border: none; height: 2px; background: #c8a415; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background-color: #f5f5f5; font-weight: bold; font-size: 11px; text-align: left; padding: 8px 6px; border-bottom: 2px solid #c8a415; }
    td { padding: 7px 6px; border-bottom: 1px solid #e0e0e0; font-size: 11px; vertical-align: top; }
    td.num, th.num { text-align: center; }
    td.amount { text-align: right; white-space: nowrap; }
    tr.even { background-color: #fff; }
    tr.odd { background-color: #f9f9f9; }
    .summary { margin-top: 10px; padding: 10px 14px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; }
    .summary p { font-size: 11px; margin-bottom: 3px; }
    .footer { position: fixed; bottom: 20px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 9px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Top Appellants Report</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead>
      <tr>
        <th class="num">Rank</th>
        <th>Appellant Name</th>
        <th class="num">Total Cases</th>
        <th class="num">Pending</th>
        <th class="num">Decided</th>
        <th>Tax Types</th>
        <th style="text-align:right">Total Amounts</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="7" style="text-align:center; padding: 20px;">No data found.</td></tr>'}
    </tbody>
  </table>
  <div class="summary">
    <p><strong>Total Unique Appellants:</strong> ${rows.length}</p>
    <p><strong>Total Cases:</strong> ${totalCases}</p>
  </div>
  <div class="footer">
    <span>Tax Revenue Appeals Tribunal [TRAT]</span>
    <span>Printed On: ${generatedAt}</span>
  </div>
</body>
</html>`;
}
