import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface SummonsRow {
  sn: number;
  startDate: string;
  endDate: string;
  judge: string;
  member1: string;
  member2: string;
  venue: string;
  time: string;
  linkedCases: string;
  status: string;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusStyle(status: string): string {
  if (status === 'SERVED') return 'color:#27ae60;';
  if (status === 'RESPONDED') return 'color:#3498db;';
  if (status === 'CONCLUDED') return 'color:#2ecc71;';
  if (status === 'DISMISSED') return 'color:#e74c3c;';
  return 'color:#e67e22;';
}

export function generateSummonsHtmlTemplate(
  rows: SummonsRow[],
  statusSummary: Record<string, number>,
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const tableRows = rows.map((row) => `
    <tr>
      <td>${row.sn}</td>
      <td>${row.startDate}</td>
      <td>${row.endDate}</td>
      <td>${row.judge}</td>
      <td>${row.member1}</td>
      <td>${row.member2}</td>
      <td>${row.venue}</td>
      <td>${row.time}</td>
      <td>${row.linkedCases}</td>
      <td><span style="${getStatusStyle(row.status)}font-weight:bold;">${row.status}</span></td>
    </tr>`).join('');

  const summaryRows = Object.entries(statusSummary).map(([status, count]) =>
    `<span style="${getStatusStyle(status)}font-weight:bold;">${status}: ${count}</span>`
  ).join(' &nbsp;|&nbsp; ');

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
  th { background:#f5f5f5; font-weight:bold; font-size:10px; text-align:left; padding:7px 5px; border-bottom:2px solid #c8a415; white-space:nowrap; }
  td { padding:6px 5px; border-bottom:1px solid #e0e0e0; font-size:10px; vertical-align:top; }
  .summary { margin-top:10px; padding:10px 14px; background:#f9f9f9; border:1px solid #ddd; border-radius:4px; }
  .summary p { font-size:11px; margin-bottom:3px; }
  .footer { position:fixed; bottom:20px; left:40px; right:40px; display:flex; justify-content:space-between; font-size:9px; color:#666; }
</style></head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Summons Report</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead><tr>
      <th>Sn.</th><th>Start Date</th><th>End Date</th><th>Judge</th><th>Member 1</th><th>Member 2</th><th>Venue</th><th>Time</th><th>Linked Cases</th><th>Status</th>
    </tr></thead>
    <tbody>${tableRows || '<tr><td colspan="10" style="text-align:center;padding:20px;">No summons found.</td></tr>'}</tbody>
  </table>
  <div class="summary">
    <p><strong>Total Summons:</strong> ${rows.length} &nbsp;|&nbsp; ${summaryRows}</p>
  </div>
  <div class="footer"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: ${generatedAt}</span></div>
</body></html>`;
}
