import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface OverdueCaseRow {
  sn: number;
  appealNo: string;
  appellant: string;
  respondent: string;
  taxType: string;
  filingDate: string;
  daysOpen: number;
  agingBucket: string;
  progressStatus: string;
  judge: string;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getBucketColor(bucket: string): string {
  if (bucket === '90-180 days') return '#e67e22';
  if (bucket === '180-365 days') return '#e74c3c';
  if (bucket === '365+ days') return '#8e44ad';
  return '#95a5a6';
}

export function generateOverdueCasesHtmlTemplate(
  rows: OverdueCaseRow[],
  bucketSummary: Record<string, number>,
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const tableRows = rows.map((row) => `
    <tr>
      <td>${row.sn}</td>
      <td>${row.appealNo}</td>
      <td>${row.appellant}</td>
      <td>${row.respondent}</td>
      <td>${row.taxType}</td>
      <td>${row.filingDate}</td>
      <td class="num"><strong>${row.daysOpen}</strong></td>
      <td><span style="color:${getBucketColor(row.agingBucket)};font-weight:bold;">${row.agingBucket}</span></td>
      <td>${row.progressStatus}</td>
      <td>${row.judge}</td>
    </tr>`).join('');

  const summaryParts = Object.entries(bucketSummary)
    .map(([bucket, count]) => `<span style="color:${getBucketColor(bucket)};font-weight:bold;">${bucket}: ${count}</span>`)
    .join(' &nbsp;|&nbsp; ');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:11px; color:#1a1a1a; padding:30px 40px; }
  .header { margin-bottom:16px; }
  .header img { height:90px; display:block; margin-bottom:10px; }
  .header h1 { font-size:16px; font-weight:bold; margin-bottom:4px; }
  .header h2 { font-size:13px; font-weight:bold; margin-bottom:4px; color:#e74c3c; }
  .header h3 { font-size:11px; font-weight:normal; color:#555; margin-bottom:10px; }
  .gold-rule { border:none; height:2px; background:#c8a415; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; margin-bottom:14px; }
  th { background:#f5f5f5; font-weight:bold; font-size:10px; text-align:left; padding:7px 5px; border-bottom:2px solid #c8a415; white-space:nowrap; }
  td { padding:6px 5px; border-bottom:1px solid #e0e0e0; font-size:10px; vertical-align:top; }
  td.num { text-align:center; }
  .summary { margin-top:10px; padding:10px 14px; background:#fff5f5; border:1px solid #e74c3c; border-radius:4px; }
  .summary p { font-size:11px; margin-bottom:3px; }
  .footer { position:fixed; bottom:20px; left:40px; right:40px; display:flex; justify-content:space-between; font-size:9px; color:#666; }
</style></head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Overdue / Aging Cases Report</h2>
    <h3>Cases open for 90+ days (filed ${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)})</h3>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead><tr>
      <th>Sn.</th><th>Appeal No</th><th>Appellant</th><th>Respondent</th><th>Tax Type</th><th>Filing Date</th><th class="num">Days Open</th><th>Aging</th><th>Status</th><th>Judge</th>
    </tr></thead>
    <tbody>${tableRows || '<tr><td colspan="10" style="text-align:center;padding:20px;">No overdue cases found.</td></tr>'}</tbody>
  </table>
  <div class="summary">
    <p><strong>Total Overdue Cases:</strong> ${rows.length} &nbsp;|&nbsp; ${summaryParts}</p>
  </div>
  <div class="footer"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: ${generatedAt}</span></div>
</body></html>`;
}
