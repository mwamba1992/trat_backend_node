import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface CaseStatusRow {
  status: string;
  count: number;
  percentage: number;
  avgDays: number;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Pending': return '#e67e22';
    case 'Hearing': return '#3498db';
    case 'Concluded': return '#2ecc71';
    case 'Decided': return '#27ae60';
    default: return '#95a5a6';
  }
}

export function generateCaseStatusHtmlTemplate(
  rows: CaseStatusRow[],
  totalCases: number,
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const tableRows = rows
    .map(
      (row, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td>${i + 1}</td>
        <td><span class="status-dot" style="background:${getStatusColor(row.status)}"></span> ${row.status}</td>
        <td class="num">${row.count}</td>
        <td class="num">${row.percentage.toFixed(1)}%</td>
        <td class="num">${row.avgDays > 0 ? row.avgDays : '-'}</td>
      </tr>`,
    )
    .join('');

  // Simple bar chart using HTML/CSS
  const barChart = rows
    .map(
      (row) => `
      <div class="bar-row">
        <div class="bar-label">${row.status}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${row.percentage}%; background: ${getStatusColor(row.status)};">${row.count}</div>
        </div>
        <div class="bar-pct">${row.percentage.toFixed(1)}%</div>
      </div>`,
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
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background-color: #f5f5f5; font-weight: bold; font-size: 11px; text-align: left; padding: 8px 6px; border-bottom: 2px solid #c8a415; }
    td { padding: 8px 6px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
    td.num, th.num { text-align: center; }
    tr.even { background-color: #fff; }
    tr.odd { background-color: #f9f9f9; }
    .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
    .chart-section { margin-bottom: 20px; }
    .chart-section h3 { font-size: 13px; font-weight: bold; margin-bottom: 10px; }
    .bar-row { display: flex; align-items: center; margin-bottom: 8px; }
    .bar-label { width: 90px; font-size: 11px; font-weight: bold; }
    .bar-track { flex: 1; height: 24px; background: #eee; border-radius: 3px; overflow: hidden; margin: 0 10px; }
    .bar-fill { height: 100%; color: white; font-size: 10px; font-weight: bold; display: flex; align-items: center; padding-left: 8px; min-width: 30px; border-radius: 3px; }
    .bar-pct { width: 50px; font-size: 11px; font-weight: bold; text-align: right; }
    .summary { margin-top: 10px; padding: 10px 14px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; }
    .summary p { font-size: 11px; margin-bottom: 3px; }
    .footer { position: fixed; bottom: 20px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 9px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Case Status Summary</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>

  <div class="chart-section">
    <h3>Status Distribution</h3>
    ${barChart}
  </div>

  <table>
    <thead>
      <tr>
        <th>Sn.</th>
        <th>Status</th>
        <th class="num">Count</th>
        <th class="num">Percentage</th>
        <th class="num">Avg Days in Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="5" style="text-align:center; padding: 20px;">No data found.</td></tr>'}
    </tbody>
  </table>

  <div class="summary">
    <p><strong>Total Cases:</strong> ${totalCases}</p>
  </div>
  <div class="footer">
    <span>Tax Revenue Appeals Tribunal [TRAT]</span>
    <span>Printed On: ${generatedAt}</span>
  </div>
</body>
</html>`;
}
