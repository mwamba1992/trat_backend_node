import { Payment } from '../../payment/payment/entities/payment.entity';
import { PaymentReportFilterDto } from '../dto/payment-report-filter.dto';

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateSubtitle(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number | null): string {
  if (amount == null) return '0.00';
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface GroupedPayments {
  appType: string;
  payments: Payment[];
  total: number;
}

function groupByAppType(payments: Payment[]): GroupedPayments[] {
  const groups: Record<string, Payment[]> = {};
  for (const payment of payments) {
    const type = payment.bill?.appType || 'OTHER';
    if (!groups[type]) groups[type] = [];
    groups[type].push(payment);
  }

  return Object.entries(groups).map(([appType, payments]) => ({
    appType,
    payments,
    total: payments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0),
  }));
}

export function generatePaymentHtmlTemplate(
  payments: Payment[],
  filters: PaymentReportFilterDto,
  logoBase64: string,
): string {
  const generatedAt = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const groups = groupByAppType(payments);
  let globalIndex = 0;

  const groupsHtml = groups
    .map((group) => {
      const rows = group.payments
        .map((payment) => {
          globalIndex++;
          return `
          <tr>
            <td>${globalIndex}</td>
            <td>${payment.controlNumber || '-'}</td>
            <td>${payment.transactionId || '-'}</td>
            <td>${payment.payerName || '-'}</td>
            <td>${formatDate(payment.paymentDate)}</td>
            <td>${payment.pspName || '-'}</td>
            <td class="amount">${formatAmount(payment.paidAmount)}</td>
          </tr>`;
        })
        .join('');

      return `
        <tr class="group-header">
          <td colspan="7"><strong>${group.appType}</strong></td>
        </tr>
        ${rows}
        <tr class="group-total">
          <td colspan="5"></td>
          <td class="total-label"><strong>Currency Total</strong></td>
          <td class="amount total-value"><strong>${formatAmount(group.total)}</strong></td>
        </tr>`;
    })
    .join('');

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
      padding: 30px 40px;
    }
    .header {
      margin-bottom: 16px;
    }
    .header img {
      height: 90px;
      display: block;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 16px;
      font-weight: normal;
      color: #1a1a1a;
      margin-bottom: 6px;
    }
    .header h2 {
      font-size: 13px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      color: #1a1a1a;
      font-weight: bold;
      font-size: 11px;
      text-align: left;
      padding: 8px 6px;
      border-bottom: 2px solid #c8a415;
      white-space: nowrap;
    }
    td {
      padding: 7px 6px;
      font-size: 11px;
      vertical-align: top;
    }
    td.amount, th.amount {
      text-align: right;
    }
    tr.group-header td {
      padding-top: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #c8a415;
      font-size: 12px;
    }
    tr.group-total td {
      padding-top: 6px;
      border-top: none;
    }
    td.total-label {
      text-align: right;
      padding-right: 10px;
    }
    td.total-value {
      border-top: 2px solid #c8a415;
      border-bottom: 1px solid #c8a415;
    }
    .footer {
      position: fixed;
      bottom: 20px;
      left: 40px;
      right: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #666;
    }
    .page-number {
      text-align: center;
      font-size: 9px;
      color: #666;
      position: fixed;
      bottom: 10px;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeal Tribunal (TRAT)</h1>
    <h2>Payments Received from ${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h2>
  </div>
  <table>
    <thead>
      <tr>
        <th>Sn.</th>
        <th>Control No.</th>
        <th>Receipt No.</th>
        <th>Payer Name</th>
        <th>Payment Date</th>
        <th>Psp Name</th>
        <th class="amount">Amount Paid</th>
      </tr>
    </thead>
    <tbody>
      ${groupsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px;">No payments found for the selected criteria.</td></tr>'}
    </tbody>
  </table>
  <div class="footer">
    <span>Tax Revenue Appeal System [TRAIS]</span>
    <span>Printed On: ${generatedAt}</span>
  </div>
</body>
</html>`;
}
