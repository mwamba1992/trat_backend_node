import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface OutstandingBillRow {
  sn: number;
  controlNumber: string;
  billReference: string;
  appType: string;
  payerName: string;
  billedAmount: number;
  currency: string;
  generatedDate: string;
  expiryDate: string;
  agingDays: number;
  agingBucket: string;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getAgingColor(bucket: string): string {
  if (bucket === '0-30 days') return '#27ae60';
  if (bucket === '31-60 days') return '#e67e22';
  if (bucket === '61-90 days') return '#e74c3c';
  return '#8e44ad';
}

export function generateOutstandingBillsHtmlTemplate(
  rows: OutstandingBillRow[],
  summary: { totalCount: number; totalAmount: number; byBucket: Record<string, { count: number; amount: number }> },
  filters: AnalyticsReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const tableRows = rows.map((row) => `
    <tr>
      <td>${row.sn}</td>
      <td>${row.controlNumber}</td>
      <td>${row.billReference}</td>
      <td>${row.appType}</td>
      <td>${row.payerName}</td>
      <td>${row.currency}</td>
      <td class="amount">${formatAmount(row.billedAmount)}</td>
      <td>${row.generatedDate}</td>
      <td>${row.expiryDate}</td>
      <td class="num">${row.agingDays}</td>
      <td><span style="color:${getAgingColor(row.agingBucket)}; font-weight:bold;">${row.agingBucket}</span></td>
    </tr>`).join('');

  const bucketRows = Object.entries(summary.byBucket).map(([bucket, data]) =>
    `<tr><td>${bucket}</td><td class="num">${data.count}</td><td class="amount">${formatAmount(data.amount)}</td></tr>`
  ).join('');

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
  td { padding:6px 5px; border-bottom:1px solid #e0e0e0; font-size:10px; }
  td.num, th.num { text-align:center; }
  td.amount { text-align:right; white-space:nowrap; }
  .summary-section { margin-top:16px; }
  .summary-section h3 { font-size:12px; margin-bottom:8px; }
  .summary-table { width:auto; margin-bottom:10px; }
  .summary-table th { background:#f0f0f0; padding:6px 12px; }
  .summary-table td { padding:6px 12px; }
  .footer { position:fixed; bottom:20px; left:40px; right:40px; display:flex; justify-content:space-between; font-size:9px; color:#666; }
</style></head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Outstanding Bills Report</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead><tr>
      <th>Sn.</th><th>Control No.</th><th>Bill Ref</th><th>Type</th><th>Payer</th><th>Curr</th><th style="text-align:right">Amount</th><th>Generated</th><th>Expiry</th><th class="num">Days</th><th>Aging</th>
    </tr></thead>
    <tbody>${tableRows || '<tr><td colspan="11" style="text-align:center;padding:20px;">No outstanding bills found.</td></tr>'}</tbody>
  </table>
  <div class="summary-section">
    <h3>Aging Summary</h3>
    <table class="summary-table">
      <thead><tr><th>Bucket</th><th class="num">Count</th><th style="text-align:right">Total Amount</th></tr></thead>
      <tbody>${bucketRows}
        <tr style="font-weight:bold; border-top:2px solid #c8a415;"><td>TOTAL</td><td class="num">${summary.totalCount}</td><td class="amount">${formatAmount(summary.totalAmount)}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="footer"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: ${generatedAt}</span></div>
</body></html>`;
}
