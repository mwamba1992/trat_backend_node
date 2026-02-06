import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appeal } from '../appeal/appeals/entities/appeal.entity';
import { ApplicationRegister } from '../appeal/application-register/entities/application-register.entity';
import { Summons } from '../appeal/appeals/entities/summons.entity';
import { NoticeHighCourt } from '../appeal/notice/entities/notice.high.court';
import { AnalyticsReportFilterDto } from './dto/analytics-report-filter.dto';
import { SummonsRow, generateSummonsHtmlTemplate } from './templates/summons-report.template';
import { HighCourtNoticeRow, generateHighCourtNoticesHtmlTemplate } from './templates/high-court-notices-report.template';
import { OverdueCaseRow, generateOverdueCasesHtmlTemplate } from './templates/overdue-cases-report.template';
import { FinancialYearRow, generateFinancialYearComparisonHtmlTemplate } from './templates/financial-year-comparison-report.template';
import { TRAT_LOGO_BASE64 } from './assets/logo';
import { ProgressStatus } from '../appeal/appeals/dto/appeal.status.enum';
import * as puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';

@Injectable()
export class OperationalReportService {
  private readonly logger = new Logger(OperationalReportService.name);

  constructor(
    @InjectRepository(Appeal)
    private readonly appealRepository: Repository<Appeal>,
    @InjectRepository(ApplicationRegister)
    private readonly applicationRepository: Repository<ApplicationRegister>,
    @InjectRepository(Summons)
    private readonly summonsRepository: Repository<Summons>,
    @InjectRepository(NoticeHighCourt)
    private readonly noticeHighCourtRepository: Repository<NoticeHighCourt>,
  ) {}

  // ===================== SUMMONS REPORT =====================

  async generateSummonsReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { rows, statusSummary } = await this.buildSummonsData(filters);
    this.logger.log(`Summons report: ${rows.length} found`);

    if (filters.format === 'PDF') {
      const html = generateSummonsHtmlTemplate(rows, statusSummary, filters, TRAT_LOGO_BASE64);
      const buffer = await this.renderPdf(html, true);
      return { buffer, contentType: 'application/pdf', filename: `summons-report-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildSummonsExcel(rows, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `summons-report-${Date.now()}.xlsx` };
    }
  }

  private async buildSummonsData(filters: AnalyticsReportFilterDto) {
    const summonsList = await this.summonsRepository.createQueryBuilder('summons')
      .leftJoinAndSelect('summons.judge', 'judge')
      .leftJoinAndSelect('summons.member1', 'member1')
      .leftJoinAndSelect('summons.member2', 'member2')
      .leftJoinAndSelect('summons.appealList', 'appealList')
      .leftJoinAndSelect('summons.applicationList', 'applicationList')
      .where('summons.createdAt >= :start', { start: filters.startDate })
      .andWhere('summons.createdAt <= :end', { end: filters.endDate + ' 23:59:59' })
      .orderBy('summons.startDate', 'DESC')
      .getMany();

    const statusSummary: Record<string, number> = {};

    const rows: SummonsRow[] = summonsList.map((s, i) => {
      statusSummary[s.status] = (statusSummary[s.status] || 0) + 1;

      const linkedAppeals = s.appealList?.map((a) => a.appealNo).filter(Boolean) || [];
      const linkedApps = s.applicationList?.map((a) => a.applicationNo).filter(Boolean) || [];
      const linkedCases = [...linkedAppeals, ...linkedApps].join(', ') || '-';

      return {
        sn: i + 1,
        startDate: s.startDate ? new Date(s.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        endDate: s.endDate ? new Date(s.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        judge: s.judge?.name || '-',
        member1: s.member1?.name || '-',
        member2: s.member2?.name || '-',
        venue: s.venue || '-',
        time: s.time || '-',
        linkedCases,
        status: s.status,
      };
    });

    return { rows, statusSummary };
  }

  private async buildSummonsExcel(rows: SummonsRow[], filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Summons Report', { pageSetup: { orientation: 'landscape', paperSize: 9 } });
    this.addExcelHeader(sheet, 'Summons Report', filters, 'J');

    const headers = ['Sn', 'Start Date', 'End Date', 'Judge', 'Member 1', 'Member 2', 'Venue', 'Time', 'Linked Cases', 'Status'];
    const widths = [5, 14, 14, 18, 18, 18, 18, 8, 22, 12];
    this.addExcelTableHeader(sheet, headers, widths, 4);

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [row.sn, row.startDate, row.endDate, row.judge, row.member1, row.member2, row.venue, row.time, row.linkedCases, row.status]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
          cell.alignment = { vertical: 'top', wrapText: true };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== HIGH COURT NOTICES =====================

  async generateHighCourtNoticesReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const rows = await this.buildHighCourtNoticesData(filters);
    this.logger.log(`High court notices: ${rows.length} found`);

    if (filters.format === 'PDF') {
      const html = generateHighCourtNoticesHtmlTemplate(rows, filters, TRAT_LOGO_BASE64);
      const buffer = await this.renderPdf(html, true);
      return { buffer, contentType: 'application/pdf', filename: `high-court-notices-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildHighCourtNoticesExcel(rows, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `high-court-notices-${Date.now()}.xlsx` };
    }
  }

  private async buildHighCourtNoticesData(filters: AnalyticsReportFilterDto): Promise<HighCourtNoticeRow[]> {
    const notices = await this.noticeHighCourtRepository.createQueryBuilder('notice')
      .leftJoinAndSelect('notice.bill', 'bill')
      .leftJoinAndSelect('notice.listOfAppeals', 'appeals')
      .where('notice.created_at >= :start', { start: filters.startDate })
      .andWhere('notice.created_at <= :end', { end: filters.endDate + ' 23:59:59' })
      .orderBy('notice.created_at', 'DESC')
      .getMany();

    return notices.map((n, i) => ({
      sn: i + 1,
      appellantName: n.appellantName || '-',
      appellantType: n.appellantType || '-',
      appellantPhone: n.appellantPhone || '-',
      respondentName: n.respondentName || '-',
      linkedAppeals: n.listOfAppeals?.map((a) => a.appealNo).filter(Boolean).join(', ') || '-',
      controlNumber: n.bill?.billControlNumber && n.bill.billControlNumber !== '0' ? n.bill.billControlNumber : '-',
      paymentStatus: n.bill?.billPayed ? 'Paid' : 'Unpaid',
      dateCreated: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
    }));
  }

  private async buildHighCourtNoticesExcel(rows: HighCourtNoticeRow[], filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('High Court Notices', { pageSetup: { orientation: 'landscape', paperSize: 9 } });
    this.addExcelHeader(sheet, 'High Court Notices Report', filters, 'I');

    const headers = ['Sn', 'Appellant', 'Type', 'Phone', 'Respondent', 'Linked Appeals', 'Control No.', 'Payment', 'Date'];
    const widths = [5, 25, 12, 14, 25, 22, 16, 10, 14];
    this.addExcelTableHeader(sheet, headers, widths, 4);

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [row.sn, row.appellantName, row.appellantType === '1' ? 'Without Fee' : 'With Fee', row.appellantPhone, row.respondentName, row.linkedAppeals, row.controlNumber, row.paymentStatus, row.dateCreated]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
          cell.alignment = { vertical: 'top', wrapText: true };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== OVERDUE/AGING CASES =====================

  async generateOverdueCasesReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { rows, bucketSummary } = await this.buildOverdueCasesData(filters);
    this.logger.log(`Overdue cases: ${rows.length} found`);

    if (filters.format === 'PDF') {
      const html = generateOverdueCasesHtmlTemplate(rows, bucketSummary, filters, TRAT_LOGO_BASE64);
      const buffer = await this.renderPdf(html, true);
      return { buffer, contentType: 'application/pdf', filename: `overdue-cases-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildOverdueCasesExcel(rows, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `overdue-cases-${Date.now()}.xlsx` };
    }
  }

  private async buildOverdueCasesData(filters: AnalyticsReportFilterDto) {
    const appeals = await this.appealRepository.createQueryBuilder('appeal')
      .leftJoinAndSelect('appeal.appellantList', 'appellantList')
      .leftJoinAndSelect('appeal.respondentList', 'respondentList')
      .leftJoinAndSelect('appeal.taxes', 'taxes')
      .leftJoinAndSelect('appeal.judge', 'judge')
      .where('appeal.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('appeal.dateOfFilling <= :end', { end: filters.endDate })
      .andWhere('appeal.progressStatus IN (:...statuses)', { statuses: [ProgressStatus.PENDING, ProgressStatus.HEARING] })
      .orderBy('appeal.dateOfFilling', 'ASC')
      .getMany();

    const now = new Date();
    const bucketSummary: Record<string, number> = { '90-180 days': 0, '180-365 days': 0, '365+ days': 0 };

    const rows: OverdueCaseRow[] = [];
    let sn = 0;

    for (const appeal of appeals) {
      const daysOpen = Math.floor((now.getTime() - new Date(appeal.dateOfFilling).getTime()) / (1000 * 60 * 60 * 24));
      if (daysOpen < 90) continue;

      sn++;
      const bucket = daysOpen < 180 ? '90-180 days' : daysOpen < 365 ? '180-365 days' : '365+ days';
      bucketSummary[bucket]++;

      rows.push({
        sn,
        appealNo: appeal.appealNo || '-',
        appellant: appeal.appellantList?.map((p) => p.name).filter(Boolean).join(', ') || '-',
        respondent: appeal.respondentList?.map((p) => p.name).filter(Boolean).join(', ') || '-',
        taxType: appeal.taxes?.name || '-',
        filingDate: new Date(appeal.dateOfFilling).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysOpen,
        agingBucket: bucket,
        progressStatus: appeal.progressStatus || '-',
        judge: appeal.judge?.name || 'Unassigned',
      });
    }

    return { rows, bucketSummary };
  }

  private async buildOverdueCasesExcel(rows: OverdueCaseRow[], filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Overdue Cases', { pageSetup: { orientation: 'landscape', paperSize: 9 } });
    this.addExcelHeader(sheet, 'Overdue / Aging Cases Report', filters, 'J');

    const headers = ['Sn', 'Appeal No', 'Appellant', 'Respondent', 'Tax Type', 'Filing Date', 'Days Open', 'Aging', 'Status', 'Judge'];
    const widths = [5, 16, 25, 25, 15, 14, 10, 14, 12, 18];
    this.addExcelTableHeader(sheet, headers, widths, 4);

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [row.sn, row.appealNo, row.appellant, row.respondent, row.taxType, row.filingDate, row.daysOpen, row.agingBucket, row.progressStatus, row.judge]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
          cell.alignment = { vertical: 'top', wrapText: true };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== FINANCIAL YEAR COMPARISON =====================

  async generateFinancialYearComparisonReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const rows = await this.buildFinancialYearData(filters);
    this.logger.log(`Financial year comparison: ${rows.length} years`);

    if (filters.format === 'PDF') {
      const html = generateFinancialYearComparisonHtmlTemplate(rows, filters, TRAT_LOGO_BASE64);
      const buffer = await this.renderPdf(html, true);
      return { buffer, contentType: 'application/pdf', filename: `financial-year-comparison-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildFinancialYearExcel(rows, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `financial-year-comparison-${Date.now()}.xlsx` };
    }
  }

  private async buildFinancialYearData(filters: AnalyticsReportFilterDto): Promise<FinancialYearRow[]> {
    const appeals = await this.appealRepository.createQueryBuilder('appeal')
      .leftJoinAndSelect('appeal.appealAmount', 'appealAmount')
      .leftJoinAndSelect('appealAmount.currency', 'currency')
      .where('appeal.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('appeal.dateOfFilling <= :end', { end: filters.endDate })
      .getMany();

    const applications = await this.applicationRepository.createQueryBuilder('app')
      .where('app.dateOfFilling >= :start', { start: filters.startDate })
      .andWhere('app.dateOfFilling <= :end', { end: filters.endDate })
      .getMany();

    const fyMap: Record<string, { appealCount: number; applicationCount: number; decided: number; pending: number; amounts: Record<string, number> }> = {};

    for (const appeal of appeals) {
      const fy = appeal.financialYear || 'Unknown';
      if (!fyMap[fy]) fyMap[fy] = { appealCount: 0, applicationCount: 0, decided: 0, pending: 0, amounts: {} };
      fyMap[fy].appealCount++;
      if (appeal.progressStatus === ProgressStatus.DECIDED) fyMap[fy].decided++;
      if (appeal.progressStatus === ProgressStatus.PENDING || appeal.progressStatus === ProgressStatus.HEARING) fyMap[fy].pending++;

      if (appeal.appealAmount) {
        for (const amt of appeal.appealAmount) {
          const cur = amt.currency?.name || 'TZS';
          fyMap[fy].amounts[cur] = (fyMap[fy].amounts[cur] || 0) + (amt.amount || 0);
        }
      }
    }

    for (const app of applications) {
      // Derive FY from filing date for applications (they don't have financialYear field)
      const date = new Date(app.dateOfFilling);
      const year = date.getFullYear();
      const month = date.getMonth();
      const fy = month >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
      if (!fyMap[fy]) fyMap[fy] = { appealCount: 0, applicationCount: 0, decided: 0, pending: 0, amounts: {} };
      fyMap[fy].applicationCount++;
    }

    return Object.entries(fyMap)
      .map(([financialYear, data]) => ({
        financialYear,
        appealCount: data.appealCount,
        applicationCount: data.applicationCount,
        totalCases: data.appealCount + data.applicationCount,
        decidedCount: data.decided,
        pendingCount: data.pending,
        totalAmounts: Object.entries(data.amounts)
          .map(([cur, total]) => `${cur} ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
          .join(', ') || '-',
      }))
      .sort((a, b) => b.financialYear.localeCompare(a.financialYear));
  }

  private async buildFinancialYearExcel(rows: FinancialYearRow[], filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('FY Comparison', { pageSetup: { orientation: 'landscape', paperSize: 9 } });
    this.addExcelHeader(sheet, 'Financial Year Comparison Report', filters, 'H');

    const headers = ['Sn', 'Financial Year', 'Appeals', 'Applications', 'Total', 'Decided', 'Pending', 'Total Amounts'];
    const widths = [5, 16, 10, 14, 10, 10, 10, 25];
    this.addExcelTableHeader(sheet, headers, widths, 4);

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [i + 1, row.financialYear, row.appealCount, row.applicationCount, row.totalCases, row.decidedCount, row.pendingCount, row.totalAmounts]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10, bold: j === 1 };
          if (j >= 2 && j <= 6) cell.alignment = { horizontal: 'center' };
          if (j === 7) cell.alignment = { horizontal: 'right' };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== SHARED HELPERS =====================

  private addExcelHeader(sheet: ExcelJS.Worksheet, title: string, filters: AnalyticsReportFilterDto, lastCol: string) {
    sheet.mergeCells(`A1:${lastCol}1`);
    sheet.getCell('A1').value = `Tax Revenue Appeals Tribunal (TRAT) — ${title}`;
    sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells(`A2:${lastCol}2`);
    const from = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const to = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    sheet.getCell('A2').value = `${from} to ${to}`;
    sheet.getCell('A2').font = { name: 'Arial', size: 11, color: { argb: 'FF555555' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getRow(3).height = 8;
  }

  private addExcelTableHeader(sheet: ExcelJS.Worksheet, headers: string[], widths: number[], rowNum: number) {
    const headerRow = sheet.getRow(rowNum);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A415' } } };
      sheet.getColumn(i + 1).width = widths[i];
    });
  }

  private async renderPdf(html: string, landscape: boolean): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4', landscape, printBackground: true,
        margin: { top: '15mm', right: '10mm', bottom: '20mm', left: '10mm' },
        displayHeaderFooter: true, headerTemplate: '<span></span>',
        footerTemplate: `<div style="font-size:8px;width:100%;display:flex;justify-content:space-between;padding:0 40px;color:#666;"><span>Tax Revenue Appeals Tribunal [TRAT]</span><span>Printed On: <span class="date"></span></span></div>`,
      });
      return Buffer.from(pdfBuffer);
    } finally { await browser.close(); }
  }
}
