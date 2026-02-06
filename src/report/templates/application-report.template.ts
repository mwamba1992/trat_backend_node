import { ApplicationRegister } from '../../appeal/application-register/entities/application-register.entity';
import { ApplicationReportFilterDto } from '../dto/application-report-filter.dto';

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

function getPartyNames(parties: { name?: string }[] | null): string {
  if (!parties || parties.length === 0) return '-';
  return parties.map((p) => p.name || '').filter(Boolean).join(', ');
}

export function generateApplicationHtmlTemplate(
  applications: ApplicationRegister[],
  filters: ApplicationReportFilterDto,
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

  const rows = applications
    .map(
      (app, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${app.applicationNo || '-'}</td>
        <td>${getPartyNames(app.appellantList)}</td>
        <td>${getPartyNames(app.respondentList)}</td>
        <td>${app.taxes?.name || '-'}</td>
        <td>${formatDate(app.dateOfFilling)}</td>
        <td>${formatDate(app.dateOfDecision)}</td>
        <td>${app.statusTrend?.name || '-'}</td>
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
    @media print {
      body { padding: 20px 30px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoBase64}" alt="TRAT Logo"/>
    <h1>Tax Revenue Appeals Tribunal (TRAT)</h1>
    <h2>Applications from ${formatDateSubtitle(filters.startDate)} to ${formatDateSubtitle(filters.endDate)}</h2>
  </div>
  <hr class="gold-rule"/>
  <table>
    <thead>
      <tr>
        <th>Sn.</th>
        <th>Application No</th>
        <th>Appellant</th>
        <th>Respondent</th>
        <th>Tax Type</th>
        <th>Filing Date</th>
        <th>Date Of Decision</th>
        <th>Progress Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="8" style="text-align:center; padding: 20px;">No applications found for the selected criteria.</td></tr>'}
    </tbody>
  </table>
  <div class="footer">
    <span>Tax Revenue Appeals Tribunal [TRAT]</span>
    <span>Printed On: ${generatedAt}</span>
  </div>
</body>
</html>`;
}
