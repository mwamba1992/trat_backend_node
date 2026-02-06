import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface HighCourtNoticeRow {
  sn: number;
  appellantName: string;
  appellantType: string;
  appellantPhone: string;
  respondentName: string;
  linkedAppeals: string;
  controlNumber: string;
  paymentStatus: string;
  dateCreated: string;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateHighCourtNoticesHtmlTemplate(
  rows: HighCourtNoticeRow[],
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const tableRows = rows.map((row) => `
    <tr>
      <td>${row.sn}</td>
      <td>${row.appellantName}</td>
      <td>${row.appellantType === '1' ? 'Without Fee' : row.appellantType === '2' ? 'With Fee' : row.appellantType}</td>
      <td>${row.appellantPhone}</td>
      <td>${row.respondentName}</td>
      <td>${row.linkedAppeals}</td>
      <td>${row.controlNumber}</td>
      <td><span style="font-weight:bold; color:${row.paymentStatus === 'Paid' ? '#27ae60' : '#e67e22'};">${row.paymentStatus}</span></td>
      <td>${row.dateCreated}</td>
    </tr>`).join('');

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
    <h2>High Court Notices Report</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead><tr>
      <th>Sn.</th><th>Appellant</th><th>Type</th><th>Phone</th><th>Respondent</th><th>Linked Appeals</th><th>Control No.</th><th>Payment</th><th>Date</th>
    </tr></thead>
    <tbody>${tableRows || '<tr><td colspan="9" style="text-align:center;padding:20px;">No high court notices found.</td></tr>'}</tbody>
  </table>
  <div class="summary"><p><strong>Total High Court Notices:</strong> ${rows.length}</p></div>
  <div class="footer"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: ${generatedAt}</span></div>
</body></html>`;
}
