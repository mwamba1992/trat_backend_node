# TRAT Reports API - Frontend Integration Guide

**Base URL:** `http://<server>:3000`
**Swagger:** `http://<server>:3000/api`
**Method:** All endpoints use `POST`
**Content-Type (Request):** `application/json`

---

## Table of Contents

1. [General Information](#1-general-information)
2. [Data Reports](#2-data-reports)
   - [Appeals Report](#21-appeals-report)
   - [Applications Report](#22-applications-report)
   - [Notices Report](#23-notices-report)
   - [Payments Report](#24-payments-report)
3. [Case Analytics](#3-case-analytics)
   - [Judge Workload Report](#31-judge-workload-report)
   - [Case Status Summary Report](#32-case-status-summary-report)
   - [Tax Type Analysis Report](#33-tax-type-analysis-report)
   - [Top Appellants Report](#34-top-appellants-report)
4. [Finance Reports](#4-finance-reports)
   - [Outstanding Bills Report](#41-outstanding-bills-report)
   - [Revenue Summary Report](#42-revenue-summary-report)
   - [Bill Reconciliation Report](#43-bill-reconciliation-report)
5. [Operational Reports](#5-operational-reports)
   - [Summons Report](#51-summons-report)
   - [High Court Notices Report](#52-high-court-notices-report)
   - [Overdue Cases Report](#53-overdue-cases-report)
   - [Financial Year Comparison Report](#54-financial-year-comparison-report)
6. [Frontend Implementation Guide](#6-frontend-implementation-guide)

---

## 1. General Information

### Report Format

All endpoints accept a `format` field with two possible values:

| Value   | Description                     | Response Content-Type                                                        |
|---------|---------------------------------|-----------------------------------------------------------------------------|
| `PDF`   | Generates a styled PDF document | `application/pdf`                                                           |
| `EXCEL` | Generates an Excel workbook     | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`         |

### Response Handling

All endpoints return a **binary file** as the response body. The response includes these headers:

| Header                | Example Value                                    |
|-----------------------|--------------------------------------------------|
| `Content-Type`        | `application/pdf` or `application/vnd.openxml...`|
| `Content-Disposition` | `attachment; filename="appeals-report-2026.pdf"` |
| `Content-Length`      | `45231`                                          |

### Date Format

All date fields use **ISO 8601 date string** format: `YYYY-MM-DD`

### Progress Status Enum

Used in the Appeals Report filter:

| Value       | Description            |
|-------------|------------------------|
| `PENDING`   | Case is pending        |
| `HEARING`   | Case is in hearing     |
| `CONCLUDED` | Case is concluded      |
| `DECIDED`   | Case has been decided  |

---

## 2. Data Reports

### 2.1 Appeals Report

**Endpoint:** `POST /reports/appeals`

Generates a report of all appeals filtered by date range and optional criteria.

#### Request Body

```json
{
  "dateOfFillingFrom": "2025-01-01",
  "dateOfFillingTo": "2026-02-06",
  "dateOfDecisionFrom": "2025-01-01",
  "dateOfDecisionTo": "2026-02-06",
  "taxType": 5,
  "statusTrend": 12,
  "judgeId": 3,
  "financialYear": "2025/2026",
  "progressStatus": "PENDING",
  "format": "PDF"
}
```

#### Fields

| Field               | Type     | Required | Description                                          |
|---------------------|----------|----------|------------------------------------------------------|
| `dateOfFillingFrom` | `string` | Yes      | Start date for filing date range (ISO date)          |
| `dateOfFillingTo`   | `string` | Yes      | End date for filing date range (ISO date)            |
| `dateOfDecisionFrom`| `string` | No       | Start date for decision date range (ISO date)        |
| `dateOfDecisionTo`  | `string` | No       | End date for decision date range (ISO date)          |
| `taxType`           | `number` | No       | CommonSetup ID for tax type filter                   |
| `statusTrend`       | `number` | No       | CommonSetup ID for status trend filter               |
| `judgeId`           | `number` | No       | Judge ID to filter by assigned judge                 |
| `financialYear`     | `string` | No       | Financial year string (e.g., "2025/2026")            |
| `progressStatus`    | `string` | No       | Enum: `PENDING`, `HEARING`, `CONCLUDED`, `DECIDED`   |
| `format`            | `string` | Yes      | `PDF` or `EXCEL`                                     |

#### Minimal Request Example

```json
{
  "dateOfFillingFrom": "2025-01-01",
  "dateOfFillingTo": "2026-02-06",
  "format": "PDF"
}
```

#### PDF Output Columns

| # | Column                | Description                                    |
|---|-----------------------|------------------------------------------------|
| 1 | Sn                    | Serial number                                  |
| 2 | Appeal No             | Appeal number                                  |
| 3 | Appellant             | Appellant name(s)                              |
| 4 | Respondent            | Respondent name(s)                             |
| 5 | Tax Type              | Type of tax                                    |
| 6 | Filing Date           | Date appeal was filed                          |
| 7 | Decision Date         | Date decision was made                         |
| 8 | Decision Receive Date | Date decision was received                     |
| 9 | Days on Trial         | Number of days from filing to decision/today   |
| 10| Amount                | Appeal amount(s) with currency                 |
| 11| Status                | Status trend name                              |
| 12| Remarks               | Appeal remarks                                 |

---

### 2.2 Applications Report

**Endpoint:** `POST /reports/applications`

Generates a report of all applications within a date range.

#### Request Body

```json
{
  "startDate": "2025-01-01",
  "endDate": "2026-02-06",
  "format": "PDF"
}
```

#### Fields

| Field       | Type     | Required | Description                               |
|-------------|----------|----------|-------------------------------------------|
| `startDate` | `string` | Yes      | Start date for filing date range (ISO)    |
| `endDate`   | `string` | Yes      | End date for filing date range (ISO)      |
| `format`    | `string` | Yes      | `PDF` or `EXCEL`                          |

#### PDF Output Columns

| # | Column          | Description              |
|---|-----------------|--------------------------|
| 1 | Sn              | Serial number            |
| 2 | Application No  | Application number       |
| 3 | Appellant       | Appellant name(s)        |
| 4 | Respondent      | Respondent name(s)       |
| 5 | Tax Type        | Type of tax              |
| 6 | Filing Date     | Date filed               |
| 7 | Date Of Decision| Decision date            |
| 8 | Progress Status | Current status           |

---

### 2.3 Notices Report

**Endpoint:** `POST /reports/notices`

Generates a report of all notices within a date range.

#### Request Body

```json
{
  "startDate": "2025-01-01",
  "endDate": "2026-02-06",
  "format": "PDF"
}
```

#### Fields

| Field       | Type     | Required | Description                            |
|-------------|----------|----------|----------------------------------------|
| `startDate` | `string` | Yes      | Start date for date range (ISO)        |
| `endDate`   | `string` | Yes      | End date for date range (ISO)          |
| `format`    | `string` | Yes      | `PDF` or `EXCEL`                       |

#### PDF Output Columns

| # | Column          | Description                        |
|---|-----------------|------------------------------------|
| 1 | Sn              | Serial number                      |
| 2 | Notice No       | Notice number                      |
| 3 | Appellant       | Appellant full name                |
| 4 | Respondent      | Respondent full name               |
| 5 | Notice Type     | Type of notice                     |
| 6 | Appeal Against  | What the appeal is against         |
| 7 | Financial Year  | Financial year                     |
| 8 | Date Created    | Date notice was created            |
| 9 | Control No.     | Bill control number                |
| 10| Payment Status  | Bill payment status                |

---

### 2.4 Payments Report

**Endpoint:** `POST /reports/payments`

Generates a report of all payments within a date range, grouped by application type.

#### Request Body

```json
{
  "startDate": "2025-01-01",
  "endDate": "2026-02-06",
  "format": "PDF"
}
```

#### Fields

| Field       | Type     | Required | Description                            |
|-------------|----------|----------|----------------------------------------|
| `startDate` | `string` | Yes      | Start date for payment date range (ISO)|
| `endDate`   | `string` | Yes      | End date for payment date range (ISO)  |
| `format`    | `string` | Yes      | `PDF` or `EXCEL`                       |

#### PDF Output

Payments are **grouped by type** (APPLICATION, APPEAL, NOTICEHIGH, NOTICE) with subtotals per group.

| # | Column       | Description              |
|---|--------------|--------------------------|
| 1 | Sn           | Serial number (global)   |
| 2 | Control No.  | GePG control number      |
| 3 | Receipt No.  | Transaction/receipt ID   |
| 4 | Payer Name   | Name of the payer        |
| 5 | Payment Date | Date payment was made    |
| 6 | Psp Name     | Payment service provider |
| 7 | Amount Paid  | Amount paid              |

Each group has a **Currency Total** row at the bottom.

---

## 3. Case Analytics

All case analytics endpoints share the same request body structure.

### Shared Request Body

```json
{
  "startDate": "2025-01-01",
  "endDate": "2026-02-06",
  "format": "PDF"
}
```

### Shared Fields

| Field       | Type     | Required | Description                      |
|-------------|----------|----------|----------------------------------|
| `startDate` | `string` | Yes      | Start date (ISO)                 |
| `endDate`   | `string` | Yes      | End date (ISO)                   |
| `format`    | `string` | Yes      | `PDF` or `EXCEL`                 |

---

### 3.1 Judge Workload Report

**Endpoint:** `POST /reports/analytics/judge-workload`

Shows case distribution and workload per judge.

#### PDF Output Columns

| # | Column                | Description                             |
|---|-----------------------|-----------------------------------------|
| 1 | Sn                    | Serial number                           |
| 2 | Judge                 | Judge name                              |
| 3 | Total Cases           | Total cases assigned                    |
| 4 | Pending               | Number of pending cases                 |
| 5 | Hearing               | Number of cases in hearing              |
| 6 | Concluded             | Number of concluded cases               |
| 7 | Decided               | Number of decided cases                 |
| 8 | Avg Days to Decision  | Average days from filing to decision    |
| 9 | Oldest Case (Days)    | Days of the oldest active case          |

**Summary:** Total judges count and total cases count.

---

### 3.2 Case Status Summary Report

**Endpoint:** `POST /reports/analytics/case-status`

Shows distribution of cases across progress statuses with visual bar chart.

#### PDF Output Columns

| # | Column          | Description                       |
|---|-----------------|-----------------------------------|
| 1 | Sn              | Serial number                     |
| 2 | Status          | Progress status (with color dot)  |
| 3 | Count           | Number of cases in this status    |
| 4 | Percentage      | Percentage of total               |
| 5 | Avg Days in Status | Average days cases remain here |

**Visual:** Includes a horizontal bar chart showing status distribution.

---

### 3.3 Tax Type Analysis Report

**Endpoint:** `POST /reports/analytics/tax-type`

Shows case distribution across different tax types.

#### PDF Output Columns

| # | Column        | Description                      |
|---|---------------|----------------------------------|
| 1 | Sn            | Serial number                    |
| 2 | Tax Type      | Name of the tax type             |
| 3 | Appeals       | Number of appeals                |
| 4 | Applications  | Number of applications           |
| 5 | Total Cases   | Sum of appeals + applications    |
| 6 | Pending       | Pending cases for this tax type  |
| 7 | Decided       | Decided cases for this tax type  |
| 8 | Total Amount  | Sum of appeal amounts            |

**Summary:** Includes a TOTAL row at the bottom.

---

### 3.4 Top Appellants Report

**Endpoint:** `POST /reports/analytics/top-appellants`

Shows the most frequent appellants ranked by number of cases.

#### PDF Output Columns

| # | Column        | Description                        |
|---|---------------|------------------------------------|
| 1 | Rank          | Ranking by total cases             |
| 2 | Appellant Name| Name of the appellant              |
| 3 | Total Cases   | Total number of cases filed        |
| 4 | Pending       | Number of pending cases            |
| 5 | Decided       | Number of decided cases            |
| 6 | Tax Types     | Distinct tax types involved        |
| 7 | Total Amounts | Sum of amounts across all cases    |

---

## 4. Finance Reports

All finance report endpoints share the same request body structure as Case Analytics.

### Shared Request Body

```json
{
  "startDate": "2025-01-01",
  "endDate": "2026-02-06",
  "format": "PDF"
}
```

---

### 4.1 Outstanding Bills Report

**Endpoint:** `POST /reports/finance/outstanding-bills`

Shows all unpaid/outstanding bills with aging analysis.

#### PDF Output Columns

| # | Column      | Description                              |
|---|-------------|------------------------------------------|
| 1 | Sn          | Serial number                            |
| 2 | Control No. | Bill control number                      |
| 3 | Bill Ref    | Bill reference ID                        |
| 4 | Type        | Application type (APPEAL, APPLICATION, etc.) |
| 5 | Payer       | Payer name                               |
| 6 | Curr        | Currency                                 |
| 7 | Amount      | Billed amount                            |
| 8 | Generated   | Date bill was generated                  |
| 9 | Expiry      | Bill expiry date                         |
| 10| Days        | Number of days since generation          |
| 11| Aging       | Color-coded aging bucket                 |

**Aging Buckets (color-coded):**
- Green: 0-30 days
- Orange: 31-60 days
- Red: 61-90 days
- Purple: 90+ days

**Summary:** Aging summary table with count and total amount per bucket.

---

### 4.2 Revenue Summary Report

**Endpoint:** `POST /reports/finance/revenue-summary`

Shows revenue collection summary grouped by application type.

#### PDF Output Columns

| # | Column           | Description                        |
|---|------------------|------------------------------------|
| 1 | Sn               | Serial number                      |
| 2 | Category         | Application type category          |
| 3 | Bills Generated  | Number of bills generated          |
| 4 | Bills Paid       | Number of bills paid               |
| 5 | Total Billed     | Total billed amount                |
| 6 | Total Collected  | Total amount collected             |
| 7 | Collection Rate  | Percentage collected vs. billed    |

**Summary:** Includes a GRAND TOTAL row.

---

### 4.3 Bill Reconciliation Report

**Endpoint:** `POST /reports/finance/bill-reconciliation`

Shows bill-by-bill reconciliation with variance analysis.

#### PDF Output Columns

| # | Column      | Description                            |
|---|-------------|----------------------------------------|
| 1 | Sn          | Serial number                          |
| 2 | Control No. | Bill control number                    |
| 3 | Bill Ref    | Bill reference ID                      |
| 4 | Type        | Application type                       |
| 5 | Payer       | Payer name                             |
| 6 | Curr        | Currency                               |
| 7 | Billed      | Billed amount                          |
| 8 | Paid        | Amount paid                            |
| 9 | Variance    | Difference (billed - paid)             |
| 10| Date        | Bill generation date                   |
| 11| Status      | Color-coded: Paid/Unpaid/Expired       |

**Status Colors:**
- Green: Paid
- Red: Unpaid
- Gray: Expired

**Summary:** Total bills count, paid count, unpaid count, total billed, total collected, outstanding.

---

## 5. Operational Reports

All operational report endpoints share the same request body structure.

### Shared Request Body

```json
{
  "startDate": "2025-01-01",
  "endDate": "2026-02-06",
  "format": "PDF"
}
```

---

### 5.1 Summons Report

**Endpoint:** `POST /reports/operational/summons`

Shows all summons issued within the date range.

#### PDF Output Columns

| # | Column       | Description                          |
|---|--------------|--------------------------------------|
| 1 | Sn           | Serial number                        |
| 2 | Start Date   | Summons start date                   |
| 3 | End Date     | Summons end date                     |
| 4 | Judge        | Presiding judge                      |
| 5 | Member 1     | First tribunal member                |
| 6 | Member 2     | Second tribunal member               |
| 7 | Venue        | Hearing venue                        |
| 8 | Time         | Scheduled time                       |
| 9 | Linked Cases | Number of linked appeals/applications|
| 10| Status       | PENDING, SERVED, DISMISSED, etc.     |

**Summary:** Total summons count and count by status.

---

### 5.2 High Court Notices Report

**Endpoint:** `POST /reports/operational/high-court-notices`

Shows all high court notices within the date range.

#### PDF Output Columns

| # | Column          | Description                      |
|---|-----------------|----------------------------------|
| 1 | Sn              | Serial number                    |
| 2 | Appellant       | Appellant name                   |
| 3 | Type            | Appellant type                   |
| 4 | Phone           | Appellant phone number           |
| 5 | Respondent      | Respondent name                  |
| 6 | Linked Appeals  | Number of linked appeals         |
| 7 | Control No.     | Bill control number              |
| 8 | Payment         | Payment status                   |
| 9 | Date            | Notice creation date             |

---

### 5.3 Overdue Cases Report

**Endpoint:** `POST /reports/operational/overdue-cases`

Shows cases that have been open for 90+ days without a decision.

#### PDF Output Columns

| # | Column          | Description                         |
|---|-----------------|-------------------------------------|
| 1 | Sn              | Serial number                       |
| 2 | Appeal No       | Appeal number                       |
| 3 | Appellant       | Appellant name(s)                   |
| 4 | Respondent      | Respondent name(s)                  |
| 5 | Tax Type        | Type of tax                         |
| 6 | Filing Date     | Date case was filed                 |
| 7 | Days Open       | Number of days since filing         |
| 8 | Aging           | Color-coded aging bucket            |
| 9 | Status          | Current progress status             |
| 10| Judge           | Assigned judge                      |

**Aging Buckets (color-coded):**
- Orange: 90-180 days
- Red: 180-365 days
- Purple: 365+ days

**Summary:** Total overdue count with breakdown by aging bucket.

---

### 5.4 Financial Year Comparison Report

**Endpoint:** `POST /reports/operational/financial-year-comparison`

Compares case volumes and outcomes across financial years.

#### PDF Output Columns

| # | Column          | Description                         |
|---|-----------------|-------------------------------------|
| 1 | Sn              | Serial number                       |
| 2 | Financial Year  | Financial year (e.g., "2024/2025")  |
| 3 | Appeals         | Number of appeals filed             |
| 4 | Applications    | Number of applications filed        |
| 5 | Total           | Sum of appeals + applications       |
| 6 | Decided         | Number of decided cases             |
| 7 | Pending         | Number of pending cases             |
| 8 | Total Amounts   | Sum of appeal amounts               |

**Visual:** Includes a horizontal bar chart comparing years.
**Summary:** TOTAL row at the bottom.

---

## 6. Frontend Implementation Guide

### How to Call Report Endpoints

All report endpoints return binary file data. You must handle the response as a **blob** and trigger a file download.

### TypeScript/Angular Example

```typescript
// report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private baseUrl = 'http://<server>:3000/reports';

  constructor(private http: HttpClient) {}

  generateReport(endpoint: string, filters: any): void {
    this.http
      .post(`${this.baseUrl}/${endpoint}`, filters, {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe((response) => {
        const blob = response.body!;
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = this.extractFilename(contentDisposition) || 'report';

        // Trigger browser download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }

  private extractFilename(contentDisposition: string | null): string {
    if (!contentDisposition) return 'report';
    const match = contentDisposition.match(/filename="?(.+?)"?$/);
    return match ? match[1] : 'report';
  }
}
```

### Usage Examples

```typescript
// Appeals Report (PDF)
this.reportService.generateReport('appeals', {
  dateOfFillingFrom: '2025-01-01',
  dateOfFillingTo: '2026-02-06',
  format: 'PDF',
});

// Appeals Report (Excel) with all filters
this.reportService.generateReport('appeals', {
  dateOfFillingFrom: '2025-01-01',
  dateOfFillingTo: '2026-02-06',
  taxType: 5,
  judgeId: 3,
  progressStatus: 'PENDING',
  format: 'EXCEL',
});

// Applications Report
this.reportService.generateReport('applications', {
  startDate: '2025-01-01',
  endDate: '2026-02-06',
  format: 'PDF',
});

// Judge Workload Report
this.reportService.generateReport('analytics/judge-workload', {
  startDate: '2025-01-01',
  endDate: '2026-02-06',
  format: 'PDF',
});

// Outstanding Bills Report (Excel)
this.reportService.generateReport('finance/outstanding-bills', {
  startDate: '2025-01-01',
  endDate: '2026-02-06',
  format: 'EXCEL',
});

// Overdue Cases Report
this.reportService.generateReport('operational/overdue-cases', {
  startDate: '2025-01-01',
  endDate: '2026-02-06',
  format: 'PDF',
});
```

### React/Axios Example

```typescript
import axios from 'axios';

async function downloadReport(endpoint: string, filters: object) {
  const response = await axios.post(
    `http://<server>:3000/reports/${endpoint}`,
    filters,
    { responseType: 'blob' }
  );

  const contentDisposition = response.headers['content-disposition'];
  const filename = contentDisposition?.match(/filename="?(.+?)"?$/)?.[1] || 'report';

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Usage
downloadReport('appeals', {
  dateOfFillingFrom: '2025-01-01',
  dateOfFillingTo: '2026-02-06',
  format: 'PDF',
});
```

---

## Quick Reference - All Endpoints

| #  | Category      | Endpoint                                       | Request Body Type       |
|----|---------------|------------------------------------------------|-------------------------|
| 1  | Data          | `POST /reports/appeals`                        | AppealReportFilter      |
| 2  | Data          | `POST /reports/applications`                   | SimpleFilter            |
| 3  | Data          | `POST /reports/notices`                        | SimpleFilter            |
| 4  | Data          | `POST /reports/payments`                       | SimpleFilter            |
| 5  | Analytics     | `POST /reports/analytics/judge-workload`       | SimpleFilter            |
| 6  | Analytics     | `POST /reports/analytics/case-status`          | SimpleFilter            |
| 7  | Analytics     | `POST /reports/analytics/tax-type`             | SimpleFilter            |
| 8  | Analytics     | `POST /reports/analytics/top-appellants`       | SimpleFilter            |
| 9  | Finance       | `POST /reports/finance/outstanding-bills`      | SimpleFilter            |
| 10 | Finance       | `POST /reports/finance/revenue-summary`        | SimpleFilter            |
| 11 | Finance       | `POST /reports/finance/bill-reconciliation`    | SimpleFilter            |
| 12 | Operational   | `POST /reports/operational/summons`            | SimpleFilter            |
| 13 | Operational   | `POST /reports/operational/high-court-notices`  | SimpleFilter            |
| 14 | Operational   | `POST /reports/operational/overdue-cases`      | SimpleFilter            |
| 15 | Operational   | `POST /reports/operational/financial-year-comparison` | SimpleFilter      |

**AppealReportFilter:** `{ dateOfFillingFrom, dateOfFillingTo, format, ...optional filters }`
**SimpleFilter:** `{ startDate, endDate, format }`

---

*Generated on: February 6, 2026 | TRAT Backend Reports Module v1.0*
