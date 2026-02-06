import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appeal } from '../appeal/appeals/entities/appeal.entity';
import { ApplicationRegister } from '../appeal/application-register/entities/application-register.entity';
import { AnalyticsReportFilterDto } from './dto/analytics-report-filter.dto';
import { JudgeWorkloadRow, generateJudgeWorkloadHtmlTemplate } from './templates/judge-workload-report.template';
import { CaseStatusRow, generateCaseStatusHtmlTemplate } from './templates/case-status-report.template';
import { TaxTypeRow, generateTaxTypeHtmlTemplate } from './templates/tax-type-report.template';
import { TopAppellantRow, generateTopAppellantsHtmlTemplate } from './templates/top-appellants-report.template';
import { TRAT_LOGO_BASE64 } from './assets/logo';
import { ProgressStatus } from '../appeal/appeals/dto/appeal.status.enum';
import * as puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AnalyticsReportService {
  private readonly logger = new Logger(AnalyticsReportService.name);

  constructor(
    @InjectRepository(Appeal)
    private readonly appealRepository: Repository<Appeal>,
    @InjectRepository(ApplicationRegister)
    private readonly applicationRepository: Repository<ApplicationRegister>,
  ) {}

  // ===================== JUDGE WORKLOAD =====================

  async generateJudgeWorkloadReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const rows = await this.buildJudgeWorkloadData(filters);
    this.logger.log(`Judge workload: ${rows.length} judges found`);

    if (filters.format === 'PDF') {
      const buffer = await this.renderPdf(
        generateJudgeWorkloadHtmlTemplate(rows, filters, TRAT_LOGO_BASE64),
        true,
      );
      return { buffer, contentType: 'application/pdf', filename: `judge-workload-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildJudgeWorkloadExcel(rows, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `judge-workload-${Date.now()}.xlsx` };
    }
  }

  private async buildJudgeWorkloadData(filters: AnalyticsReportFilterDto): Promise<JudgeWorkloadRow[]> {
    const appeals = await this.appealRepository.createQueryBuilder('appeal')
      .leftJoinAndSelect('appeal.judge', 'judge')
      .where('appeal.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('appeal.dateOfFilling <= :end', { end: filters.endDate })
      .andWhere('judge.id IS NOT NULL')
      .getMany();

    const judgeMap: Record<number, { name: string; appeals: Appeal[] }> = {};

    for (const appeal of appeals) {
      const judgeId = appeal.judge?.id;
      if (!judgeId) continue;
      if (!judgeMap[judgeId]) {
        judgeMap[judgeId] = { name: appeal.judge.name, appeals: [] };
      }
      judgeMap[judgeId].appeals.push(appeal);
    }

    const now = new Date();

    return Object.values(judgeMap)
      .map((j) => {
        const decided = j.appeals.filter((a) => a.progressStatus === ProgressStatus.DECIDED);
        const daysToDecision = decided
          .filter((a) => a.dateOfDecision && a.dateOfFilling)
          .map((a) => Math.floor((new Date(a.dateOfDecision).getTime() - new Date(a.dateOfFilling).getTime()) / (1000 * 60 * 60 * 24)));

        const allDays = j.appeals
          .map((a) => Math.floor((now.getTime() - new Date(a.dateOfFilling).getTime()) / (1000 * 60 * 60 * 24)));

        return {
          judgeName: j.name,
          totalCases: j.appeals.length,
          pending: j.appeals.filter((a) => a.progressStatus === ProgressStatus.PENDING).length,
          hearing: j.appeals.filter((a) => a.progressStatus === ProgressStatus.HEARING).length,
          concluded: j.appeals.filter((a) => a.progressStatus === ProgressStatus.CONCLUDED).length,
          decided: decided.length,
          avgDaysToDecision: daysToDecision.length > 0 ? Math.round(daysToDecision.reduce((a, b) => a + b, 0) / daysToDecision.length) : 0,
          oldestCaseDays: allDays.length > 0 ? Math.max(...allDays) : 0,
        };
      })
      .sort((a, b) => b.totalCases - a.totalCases);
  }

  private async buildJudgeWorkloadExcel(rows: JudgeWorkloadRow[], filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Judge Workload', { pageSetup: { orientation: 'landscape', paperSize: 9 } });

    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = 'Tax Revenue Appeals Tribunal (TRAT) — Judge Workload Report';
    sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:I2');
    const fromDate = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const toDate = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    sheet.getCell('A2').value = `${fromDate} to ${toDate}`;
    sheet.getCell('A2').font = { name: 'Arial', size: 11, color: { argb: 'FF555555' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.getRow(3).height = 8;

    const headers = ['Sn', 'Judge', 'Total Cases', 'Pending', 'Hearing', 'Concluded', 'Decided', 'Avg Days to Decision', 'Oldest Case (Days)'];
    const widths = [5, 25, 12, 10, 10, 12, 10, 18, 16];
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A415' } } };
      cell.alignment = { horizontal: i >= 2 ? 'center' : 'left', vertical: 'middle' };
      sheet.getColumn(i + 1).width = widths[i];
    });

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [i + 1, row.judgeName, row.totalCases, row.pending, row.hearing, row.concluded, row.decided, row.avgDaysToDecision || '-', row.oldestCaseDays || '-']
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { horizontal: j >= 2 ? 'center' : 'left' };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== CASE STATUS SUMMARY =====================

  async generateCaseStatusReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { rows, totalCases } = await this.buildCaseStatusData(filters);
    this.logger.log(`Case status summary: ${totalCases} total cases`);

    if (filters.format === 'PDF') {
      const buffer = await this.renderPdf(
        generateCaseStatusHtmlTemplate(rows, totalCases, filters, TRAT_LOGO_BASE64),
        false,
      );
      return { buffer, contentType: 'application/pdf', filename: `case-status-summary-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildCaseStatusExcel(rows, totalCases, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `case-status-summary-${Date.now()}.xlsx` };
    }
  }

  private async buildCaseStatusData(filters: AnalyticsReportFilterDto): Promise<{ rows: CaseStatusRow[]; totalCases: number }> {
    const appeals = await this.appealRepository.createQueryBuilder('appeal')
      .where('appeal.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('appeal.dateOfFilling <= :end', { end: filters.endDate })
      .getMany();

    const totalCases = appeals.length;
    if (totalCases === 0) return { rows: [], totalCases: 0 };

    const now = new Date();
    const statusMap: Record<string, Appeal[]> = {};

    for (const appeal of appeals) {
      const status = appeal.progressStatus || 'Unknown';
      if (!statusMap[status]) statusMap[status] = [];
      statusMap[status].push(appeal);
    }

    const rows: CaseStatusRow[] = Object.entries(statusMap).map(([status, items]) => {
      const days = items.map((a) => {
        const start = new Date(a.dateOfFilling);
        return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      });
      return {
        status,
        count: items.length,
        percentage: (items.length / totalCases) * 100,
        avgDays: days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0,
      };
    });

    // Sort: Pending, Hearing, Concluded, Decided
    const order = [ProgressStatus.PENDING, ProgressStatus.HEARING, ProgressStatus.CONCLUDED, ProgressStatus.DECIDED];
    rows.sort((a, b) => {
      const ai = order.indexOf(a.status as ProgressStatus);
      const bi = order.indexOf(b.status as ProgressStatus);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return { rows, totalCases };
  }

  private async buildCaseStatusExcel(rows: CaseStatusRow[], totalCases: number, filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Case Status Summary', { pageSetup: { orientation: 'portrait', paperSize: 9 } });

    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'Tax Revenue Appeals Tribunal (TRAT) — Case Status Summary';
    sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:E2');
    const fromDate = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const toDate = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    sheet.getCell('A2').value = `${fromDate} to ${toDate}`;
    sheet.getCell('A2').font = { name: 'Arial', size: 11, color: { argb: 'FF555555' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getRow(3).height = 8;

    const headers = ['Sn', 'Status', 'Count', 'Percentage', 'Avg Days'];
    const widths = [5, 18, 12, 12, 14];
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A415' } } };
      cell.alignment = { horizontal: i >= 2 ? 'center' : 'left' };
      sheet.getColumn(i + 1).width = widths[i];
    });

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [i + 1, row.status, row.count, `${row.percentage.toFixed(1)}%`, row.avgDays || '-']
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { horizontal: j >= 2 ? 'center' : 'left' };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
    });

    const totalRow = sheet.getRow(rows.length + 5);
    totalRow.getCell(1).value = '';
    totalRow.getCell(2).value = 'TOTAL';
    totalRow.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(3).value = totalCases;
    totalRow.getCell(3).font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(3).alignment = { horizontal: 'center' };
    totalRow.getCell(4).value = '100%';
    totalRow.getCell(4).font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(4).alignment = { horizontal: 'center' };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== TAX TYPE ANALYSIS =====================

  async generateTaxTypeReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const rows = await this.buildTaxTypeData(filters);
    this.logger.log(`Tax type analysis: ${rows.length} types found`);

    if (filters.format === 'PDF') {
      const buffer = await this.renderPdf(
        generateTaxTypeHtmlTemplate(rows, filters, TRAT_LOGO_BASE64),
        true,
      );
      return { buffer, contentType: 'application/pdf', filename: `tax-type-analysis-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildTaxTypeExcel(rows, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `tax-type-analysis-${Date.now()}.xlsx` };
    }
  }

  private async buildTaxTypeData(filters: AnalyticsReportFilterDto): Promise<TaxTypeRow[]> {
    const appeals = await this.appealRepository.createQueryBuilder('appeal')
      .leftJoinAndSelect('appeal.taxes', 'taxes')
      .leftJoinAndSelect('appeal.appealAmount', 'appealAmount')
      .leftJoinAndSelect('appealAmount.currency', 'currency')
      .where('appeal.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('appeal.dateOfFilling <= :end', { end: filters.endDate })
      .getMany();

    const applications = await this.applicationRepository.createQueryBuilder('app')
      .leftJoinAndSelect('app.taxes', 'taxes')
      .where('app.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('app.dateOfFilling <= :end', { end: filters.endDate })
      .getMany();

    const taxMap: Record<string, { appealCount: number; applicationCount: number; amounts: Record<string, number>; pending: number; decided: number }> = {};

    for (const appeal of appeals) {
      const taxName = appeal.taxes?.name || 'Unknown';
      if (!taxMap[taxName]) taxMap[taxName] = { appealCount: 0, applicationCount: 0, amounts: {}, pending: 0, decided: 0 };
      taxMap[taxName].appealCount++;
      if (appeal.progressStatus === ProgressStatus.PENDING || appeal.progressStatus === ProgressStatus.HEARING) taxMap[taxName].pending++;
      if (appeal.progressStatus === ProgressStatus.DECIDED) taxMap[taxName].decided++;

      if (appeal.appealAmount) {
        for (const amt of appeal.appealAmount) {
          const cur = amt.currency?.name || 'TZS';
          taxMap[taxName].amounts[cur] = (taxMap[taxName].amounts[cur] || 0) + (amt.amount || 0);
        }
      }
    }

    for (const app of applications) {
      const taxName = app.taxes?.name || 'Unknown';
      if (!taxMap[taxName]) taxMap[taxName] = { appealCount: 0, applicationCount: 0, amounts: {}, pending: 0, decided: 0 };
      taxMap[taxName].applicationCount++;
    }

    return Object.entries(taxMap)
      .map(([taxType, data]) => {
        const totalAmount = Object.entries(data.amounts)
          .map(([cur, total]) => `${cur} ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
          .join(', ') || '-';

        return {
          taxType,
          appealCount: data.appealCount,
          applicationCount: data.applicationCount,
          totalCases: data.appealCount + data.applicationCount,
          totalAmount,
          pendingCount: data.pending,
          decidedCount: data.decided,
        };
      })
      .sort((a, b) => b.totalCases - a.totalCases);
  }

  private async buildTaxTypeExcel(rows: TaxTypeRow[], filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tax Type Analysis', { pageSetup: { orientation: 'landscape', paperSize: 9 } });

    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = 'Tax Revenue Appeals Tribunal (TRAT) — Tax Type Analysis';
    sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:H2');
    const fromDate = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const toDate = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    sheet.getCell('A2').value = `${fromDate} to ${toDate}`;
    sheet.getCell('A2').font = { name: 'Arial', size: 11, color: { argb: 'FF555555' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getRow(3).height = 8;

    const headers = ['Sn', 'Tax Type', 'Appeals', 'Applications', 'Total Cases', 'Pending', 'Decided', 'Total Amount'];
    const widths = [5, 22, 10, 14, 12, 10, 10, 25];
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A415' } } };
      cell.alignment = { horizontal: i >= 2 && i < 7 ? 'center' : i === 7 ? 'right' : 'left' };
      sheet.getColumn(i + 1).width = widths[i];
    });

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [i + 1, row.taxType, row.appealCount, row.applicationCount, row.totalCases, row.pendingCount, row.decidedCount, row.totalAmount]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { horizontal: j >= 2 && j < 7 ? 'center' : j === 7 ? 'right' : 'left' };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== TOP APPELLANTS =====================

  async generateTopAppellantsReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const rows = await this.buildTopAppellantsData(filters);
    this.logger.log(`Top appellants: ${rows.length} appellants found`);

    if (filters.format === 'PDF') {
      const buffer = await this.renderPdf(
        generateTopAppellantsHtmlTemplate(rows, filters, TRAT_LOGO_BASE64),
        true,
      );
      return { buffer, contentType: 'application/pdf', filename: `top-appellants-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildTopAppellantsExcel(rows, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `top-appellants-${Date.now()}.xlsx` };
    }
  }

  private async buildTopAppellantsData(filters: AnalyticsReportFilterDto): Promise<TopAppellantRow[]> {
    const appeals = await this.appealRepository.createQueryBuilder('appeal')
      .leftJoinAndSelect('appeal.appellantList', 'appellantList')
      .leftJoinAndSelect('appeal.taxes', 'taxes')
      .leftJoinAndSelect('appeal.appealAmount', 'appealAmount')
      .leftJoinAndSelect('appealAmount.currency', 'currency')
      .where('appeal.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('appeal.dateOfFilling <= :end', { end: filters.endDate })
      .getMany();

    const appellantMap: Record<number, {
      name: string;
      appeals: Appeal[];
      taxTypes: Set<string>;
      amounts: Record<string, number>;
    }> = {};

    for (const appeal of appeals) {
      if (!appeal.appellantList) continue;
      for (const appellant of appeal.appellantList) {
        if (!appellantMap[appellant.id]) {
          appellantMap[appellant.id] = { name: appellant.name, appeals: [], taxTypes: new Set(), amounts: {} };
        }
        appellantMap[appellant.id].appeals.push(appeal);
        if (appeal.taxes?.name) appellantMap[appellant.id].taxTypes.add(appeal.taxes.name);
        if (appeal.appealAmount) {
          for (const amt of appeal.appealAmount) {
            const cur = amt.currency?.name || 'TZS';
            appellantMap[appellant.id].amounts[cur] = (appellantMap[appellant.id].amounts[cur] || 0) + (amt.amount || 0);
          }
        }
      }
    }

    return Object.values(appellantMap)
      .map((data, _i) => {
        const totalAmounts = Object.entries(data.amounts)
          .map(([cur, total]) => `${cur} ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
          .join(', ') || '-';

        return {
          rank: 0,
          appellantName: data.name,
          caseCount: data.appeals.length,
          pendingCount: data.appeals.filter((a) => a.progressStatus === ProgressStatus.PENDING || a.progressStatus === ProgressStatus.HEARING).length,
          decidedCount: data.appeals.filter((a) => a.progressStatus === ProgressStatus.DECIDED).length,
          totalAmounts,
          taxTypes: Array.from(data.taxTypes).join(', '),
        };
      })
      .sort((a, b) => b.caseCount - a.caseCount)
      .map((row, i) => ({ ...row, rank: i + 1 }));
  }

  private async buildTopAppellantsExcel(rows: TopAppellantRow[], filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Top Appellants', { pageSetup: { orientation: 'landscape', paperSize: 9 } });

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'Tax Revenue Appeals Tribunal (TRAT) — Top Appellants Report';
    sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:G2');
    const fromDate = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const toDate = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    sheet.getCell('A2').value = `${fromDate} to ${toDate}`;
    sheet.getCell('A2').font = { name: 'Arial', size: 11, color: { argb: 'FF555555' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getRow(3).height = 8;

    const headers = ['Rank', 'Appellant Name', 'Total Cases', 'Pending', 'Decided', 'Tax Types', 'Total Amounts'];
    const widths = [6, 30, 12, 10, 10, 22, 25];
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A415' } } };
      cell.alignment = { horizontal: i >= 2 && i <= 4 ? 'center' : i === 6 ? 'right' : 'left' };
      sheet.getColumn(i + 1).width = widths[i];
    });

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [row.rank, row.appellantName, row.caseCount, row.pendingCount, row.decidedCount, row.taxTypes, row.totalAmounts]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { horizontal: j >= 2 && j <= 4 ? 'center' : j === 6 ? 'right' : 'left', vertical: 'top', wrapText: true };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== SHARED PDF RENDERER =====================

  private async renderPdf(html: string, landscape: boolean): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape,
        printBackground: true,
        margin: { top: '15mm', right: '10mm', bottom: '20mm', left: '10mm' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size:8px; width:100%; display:flex; justify-content:space-between; padding: 0 40px; color:#666;">
            <span>Tax Revenue Appeals Tribunal [TRAT]</span>
            <span>Printed On: <span class="date"></span></span>
          </div>
        `,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
