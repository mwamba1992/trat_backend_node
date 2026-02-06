import { Appeal } from '../../appeal/appeals/entities/appeal.entity';
import { AppealReportFilterDto } from '../dto/appeal-report-filter.dto';

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calculateDaysOnTrial(dateOfFilling: Date | string, dateOfDecision: Date | string | null): number {
  if (!dateOfFilling) return 0;
  const start = new Date(dateOfFilling);
  const end = dateOfDecision ? new Date(dateOfDecision) : new Date();
  if (isNaN(start.getTime())) return 0;
  if (isNaN(end.getTime())) return Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getAmountDisplay(appeal: Appeal): string {
  if (!appeal.appealAmount || appeal.appealAmount.length === 0) return '-';
  return appeal.appealAmount
    .map((a) => {
      const currency = a.currency?.name || '';
      const amount = a.amount != null ? Number(a.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00';
      return `${currency} ${amount}`;
    })
    .join(', ');
}

function getPartyNames(parties: { name?: string }[] | null): string {
  if (!parties || parties.length === 0) return '-';
  return parties.map((p) => p.name || '').filter(Boolean).join(', ');
}

function buildSummary(appeals: Appeal[]): { total: number; amountsByCurrency: Record<string, number> } {
  const amountsByCurrency: Record<string, number> = {};
  for (const appeal of appeals) {
    if (appeal.appealAmount) {
      for (const amt of appeal.appealAmount) {
        const cur = amt.currency?.name || 'Unknown';
        amountsByCurrency[cur] = (amountsByCurrency[cur] || 0) + (amt.amount || 0);
      }
    }
  }
  return { total: appeals.length, amountsByCurrency };
}

export function generateAppealHtmlTemplate(
  appeals: Appeal[],
  filters: AppealReportFilterDto,
  logoBase64: string,
): string {
  const summary = buildSummary(appeals);
  const generatedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const filterSummaryParts: string[] = [];
  if (filters.financialYear) filterSummaryParts.push(`Financial Year: ${filters.financialYear}`);
  if (filters.progressStatus) filterSummaryParts.push(`Progress: ${filters.progressStatus}`);

  const rows = appeals
    .map(
      (appeal, index) => `
      <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
        <td>${index + 1}</td>
        <td>${appeal.appealNo || '-'}</td>
        <td>${getPartyNames(appeal.appellantList)}</td>
        <td>${getPartyNames(appeal.respondentList)}</td>
        <td>${appeal.taxes?.name || '-'}</td>
        <td>${formatDate(appeal.dateOfFilling)}</td>
        <td>${formatDate(appeal.dateOfDecision)}</td>
        <td>${formatDate(appeal.receivedDate)}</td>
        <td>${calculateDaysOnTrial(appeal.dateOfFilling, appeal.dateOfDecision)}</td>
        <td class="amount">${getAmountDisplay(appeal)}</td>
        <td>${appeal.statusTrend?.name || '-'}</td>
        <td>${appeal.remarks || '-'}</td>
      </tr>`,
    )
    .join('');

  const summaryAmounts = Object.entries(summary.amountsByCurrency)
    .map(([currency, total]) => `<span class="summary-amount">${currency} ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`)
    .join(' &nbsp;|&nbsp; ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      padding: 20px 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .header img {
      height: 80px;
      margin-bottom: 6px;
    }
    .header h1 {
      font-size: 18px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .header h2 {
      font-size: 13px;
      font-weight: bold;
      color: #333;
      margin-bottom: 6px;
    }
    .header .filter-info {
      font-size: 10px;
      color: #666;
      margin-bottom: 4px;
    }
    .gold-rule {
      border: none;
      height: 3px;
      background: linear-gradient(90deg, #c8a415, #e6c619, #c8a415);
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background-color: #e8e8e8;
      color: #1a1a1a;
      font-weight: bold;
      font-size: 10px;
      text-align: left;
      padding: 6px 5px;
      border: 1px solid #ccc;
      white-space: nowrap;
    }
    td {
      padding: 5px 5px;
      border: 1px solid #ddd;
      font-size: 10px;
      vertical-align: top;
    }
    tr.even { background-color: #ffffff; }
    tr.odd { background-color: #f7f7f7; }
    td.amount { text-align: right; white-space: nowrap; }
    .summary {
      margin-top: 10px;
      padding: 10px 14px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .summary h3 {
      font-size: 12px;
      margin-bottom: 6px;
      color: #1a1a1a;
    }
    .summary p {
      font-size: 11px;
      margin-bottom: 3px;
    }
    .summary-amount {
      font-weight: bold;
    }
    .footer {
      margin-top: 16px;
      font-size: 9px;
      color: #888;
      text-align: center;
    }
    @media print {
      body { padding: 10px 15px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Appeals from ${formatDate(filters.dateOfFillingFrom)} to ${formatDate(filters.dateOfFillingTo)}</h2>
    ${filterSummaryParts.length > 0 ? `<div class="filter-info">${filterSummaryParts.join(' | ')}</div>` : ''}
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead>
      <tr>
        <th>Sn</th>
        <th>Appeal No</th>
        <th>Appellant</th>
        <th>Respondent</th>
        <th>Tax Type</th>
        <th>Filing Date</th>
        <th>Decision Date</th>
        <th>Decision Receive Date</th>
        <th>Days on Trial</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="12" style="text-align:center; padding: 20px;">No appeals found for the selected criteria.</td></tr>'}
    </tbody>
  </table>
  <div class="summary">
    <h3>Summary</h3>
    <p>Total Appeals: <strong>${summary.total}</strong></p>
    <p>Total Amounts: ${summaryAmounts || 'N/A'}</p>
  </div>
  <div class="footer">
    Generated on ${generatedAt} | Tax Revenue Appeals Tribunal (TRAT) - Official Report
  </div>
</body>
</html>`;
}
