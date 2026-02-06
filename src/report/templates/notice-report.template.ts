import { Notice } from '../../appeal/notice/entities/notice.entity';
import { NoticeReportFilterDto } from '../dto/notice-report-filter.dto';

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

export function generateNoticeHtmlTemplate(
  notices: Notice[],
  filters: NoticeReportFilterDto,
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

  const rows = notices
    .map(
      (notice, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${notice.noticeNo || '-'}</td>
        <td>${notice.appellantFullName || '-'}</td>
        <td>${notice.respondentFullName || '-'}</td>
        <td>${notice.noticeType === '1' ? 'Without Fee' : notice.noticeType === '2' ? 'With Fee' : notice.noticeType || '-'}</td>
        <td>${notice.appealAgaints || '-'}</td>
        <td>${notice.financialYear || '-'}</td>
        <td>${formatDate(notice.createdAt)}</td>
        <td>${notice.bill?.billControlNumber && notice.bill.billControlNumber !== '0' ? notice.bill.billControlNumber : '-'}</td>
        <td>${notice.bill?.billPayed ? 'Paid' : 'Unpaid'}</td>
      </tr>`,
    )
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
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .header h2 {
      font-size: 12px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .gold-rule {
      border: none;
      height: 2px;
      background: #c8a415;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background-color: #f5f5f5;
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
      border-bottom: 1px solid #e0e0e0;
      font-size: 11px;
      vertical-align: top;
    }
    .summary {
      margin-top: 10px;
      padding: 10px 14px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .summary p {
      font-size: 11px;
      margin-bottom: 3px;
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
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Notices from ${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h2>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead>
      <tr>
        <th>Sn.</th>
        <th>Notice No</th>
        <th>Appellant</th>
        <th>Respondent</th>
        <th>Notice Type</th>
        <th>Appeal Against</th>
        <th>Financial Year</th>
        <th>Date Created</th>
        <th>Control No.</th>
        <th>Payment Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="10" style="text-align:center; padding: 20px;">No notices found for the selected criteria.</td></tr>'}
    </tbody>
  </table>
  <div class="summary">
    <p><strong>Total Notices:</strong> ${notices.length}</p>
  </div>
  <div class="footer">
    <span>Tax Revenue Appeals Tribunal [TRAT]</span>
    <span>Printed On: ${generatedAt}</span>
  </div>
</body>
</html>`;
}
