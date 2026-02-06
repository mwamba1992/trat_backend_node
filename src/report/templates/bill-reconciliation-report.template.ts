import { AnalyticsReportFilterDto } from '../dto/analytics-report-filter.dto';

export interface BillReconciliationRow {
  sn: number;
  controlNumber: string;
  billReference: string;
  appType: string;
  payerName: string;
  billedAmount: number;
  paidAmount: number;
  variance: number;
  currency: string;
  generatedDate: string;
  status: string;
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStatusStyle(status: string): string {
  if (status === 'Paid') return 'color:#27ae60; font-weight:bold;';
  if (status === 'Expired') return 'color:#e74c3c; font-weight:bold;';
  return 'color:#e67e22; font-weight:bold;';
}

export function generateBillReconciliationHtmlTemplate(
  rows: BillReconciliationRow[],
  summary: { total: number; paid: number; unpaid: number; expired: number; totalBilled: number; totalPaid: number },
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
      <td class="amount">${formatAmount(row.paidAmount)}</td>
      <td class="amount">${formatAmount(row.variance)}</td>
      <td>${row.generatedDate}</td>
      <td><span style="${getStatusStyle(row.status)}">${row.status}</span></td>
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
  td { padding:6px 5px; border-bottom:1px solid #e0e0e0; font-size:10px; }
  td.num, th.num { text-align:center; }
  td.amount { text-align:right; white-space:nowrap; }
  .summary { margin-top:12px; padding:10px 14px; background:#f9f9f9; border:1px solid #ddd; border-radius:4px; }
  .summary p { font-size:11px; margin-bottom:4px; }
  .footer { position:fixed; bottom:20px; left:40px; right:40px; display:flex; justify-content:space-between; font-size:9px; color:#666; }
</style></head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Bill Reconciliation Report</h2>
    <h3>${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h3>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead><tr>
      <th>Sn.</th><th>Control No.</th><th>Bill Ref</th><th>Type</th><th>Payer</th><th>Curr</th><th style="text-align:right">Billed</th><th style="text-align:right">Paid</th><th style="text-align:right">Variance</th><th>Date</th><th>Status</th>
    </tr></thead>
    <tbody>${tableRows || '<tr><td colspan="11" style="text-align:center;padding:20px;">No bills found.</td></tr>'}</tbody>
  </table>
  <div class="summary">
    <p><strong>Total Bills:</strong> ${summary.total} &nbsp;|&nbsp; <strong>Paid:</strong> <span style="color:#27ae60">${summary.paid}</span> &nbsp;|&nbsp; <strong>Unpaid:</strong> <span style="color:#e67e22">${summary.unpaid}</span> &nbsp;|&nbsp; <strong>Expired:</strong> <span style="color:#e74c3c">${summary.expired}</span></p>
    <p><strong>Total Billed:</strong> ${formatAmount(summary.totalBilled)} &nbsp;|&nbsp; <strong>Total Collected:</strong> ${formatAmount(summary.totalPaid)}</p>
  </div>
  <div class="footer"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: ${generatedAt}</span></div>
</body></html>`;
}
