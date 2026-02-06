import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appeal } from '../appeal/appeals/entities/appeal.entity';
import { ApplicationRegister } from '../appeal/application-register/entities/application-register.entity';
import { Notice } from '../appeal/notice/entities/notice.entity';
import { Payment } from '../payment/payment/entities/payment.entity';
import { AppealReportFilterDto } from './dto/appeal-report-filter.dto';
import { ApplicationReportFilterDto } from './dto/application-report-filter.dto';
import { NoticeReportFilterDto } from './dto/notice-report-filter.dto';
import { PaymentReportFilterDto } from './dto/payment-report-filter.dto';
import { generateAppealHtmlTemplate } from './templates/appeal-report.template';
import { generateApplicationHtmlTemplate } from './templates/application-report.template';
import { generateNoticeHtmlTemplate } from './templates/notice-report.template';
import { generatePaymentHtmlTemplate } from './templates/payment-report.template';
import { TRAT_LOGO_BASE64 } from './assets/logo';
import * as puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Appeal)
    private readonly appealRepository: Repository<Appeal>,
    @InjectRepository(ApplicationRegister)
    private readonly applicationRepository: Repository<ApplicationRegister>,
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async generateAppealReport(filters: AppealReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const appeals = await this.queryAppeals(filters);
    this.logger.log(`Found ${appeals.length} appeals for report generation`);

    if (filters.format === 'PDF') {
      const buffer = await this.generatePdf(appeals, filters);
      return {
        buffer,
        contentType: 'application/pdf',
        filename: `appeals-report-${Date.now()}.pdf`,
      };
    } else {
      const buffer = await this.generateExcel(appeals, filters);
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `appeals-report-${Date.now()}.xlsx`,
      };
    }
  }

  private async queryAppeals(filters: AppealReportFilterDto): Promise<Appeal[]> {
    const queryBuilder = this.appealRepository.createQueryBuilder('appeal');

    queryBuilder
      .leftJoinAndSelect('appeal.appellantList', 'appellantList')
      .leftJoinAndSelect('appeal.respondentList', 'respondentList')
      .leftJoinAndSelect('appeal.notice', 'notice')
      .leftJoinAndSelect('appeal.taxes', 'taxes')
      .leftJoinAndSelect('appeal.statusTrend', 'statusTrend')
      .leftJoinAndSelect('appeal.billId', 'billId')
      .leftJoinAndSelect('appeal.appealAmount', 'appealAmount')
      .leftJoinAndSelect('appealAmount.currency', 'currency')
      .leftJoinAndSelect('appeal.judge', 'judge');

    // Filing date range (required)
    queryBuilder.andWhere('appeal.dateOfFilling >= :dateOfFillingFrom', {
      dateOfFillingFrom: filters.dateOfFillingFrom,
    });
    queryBuilder.andWhere('appeal.dateOfFilling <= :dateOfFillingTo', {
      dateOfFillingTo: filters.dateOfFillingTo,
    });

    // Decision date range (optional)
    if (filters.dateOfDecisionFrom) {
      queryBuilder.andWhere('appeal.dateOfDecision >= :dateOfDecisionFrom', {
        dateOfDecisionFrom: filters.dateOfDecisionFrom,
      });
    }
    if (filters.dateOfDecisionTo) {
      queryBuilder.andWhere('appeal.dateOfDecision <= :dateOfDecisionTo', {
        dateOfDecisionTo: filters.dateOfDecisionTo,
      });
    }

    // Tax type filter
    if (filters.taxType) {
      queryBuilder.andWhere('taxes.id = :taxType', {
        taxType: filters.taxType,
      });
    }

    // Status trend filter
    if (filters.statusTrend) {
      queryBuilder.andWhere('statusTrend.id = :statusTrend', {
        statusTrend: filters.statusTrend,
      });
    }

    // Judge filter
    if (filters.judgeId) {
      queryBuilder.andWhere('judge.id = :judgeId', {
        judgeId: filters.judgeId,
      });
    }

    // Financial year filter
    if (filters.financialYear) {
      queryBuilder.andWhere('appeal.financialYear = :financialYear', {
        financialYear: filters.financialYear,
      });
    }

    // Progress status filter
    if (filters.progressStatus) {
      queryBuilder.andWhere('appeal.progressStatus = :progressStatus', {
        progressStatus: filters.progressStatus,
      });
    }

    queryBuilder.orderBy('appeal.dateOfFilling', 'ASC');

    return await queryBuilder.getMany();
  }

  private async generatePdf(appeals: Appeal[], filters: AppealReportFilterDto): Promise<Buffer> {
    const html = generateAppealHtmlTemplate(appeals, filters, TRAT_LOGO_BASE64);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size:8px; width:100%; text-align:center; color:#888; padding: 0 20px;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private async generateExcel(appeals: Appeal[], filters: AppealReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TRAT Report System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Appeals Report', {
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true },
    });

    // Title row
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Tax Revenue Appeals Tribunal (TRAT)';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Subtitle row
    sheet.mergeCells('A2:L2');
    const subtitleCell = sheet.getCell('A2');
    const fromDate = new Date(filters.dateOfFillingFrom).toLocaleDateString('en-GB');
    const toDate = new Date(filters.dateOfFillingTo).toLocaleDateString('en-GB');
    subtitleCell.value = `Appeals from ${fromDate} to ${toDate}`;
    subtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF333333' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 22;

    // Empty row
    sheet.getRow(3).height = 10;

    // Column definitions
    const columns = [
      { header: 'Sn', key: 'sn', width: 5 },
      { header: 'Appeal No', key: 'appealNo', width: 18 },
      { header: 'Appellant', key: 'appellant', width: 25 },
      { header: 'Respondent', key: 'respondent', width: 25 },
      { header: 'Tax Type', key: 'taxType', width: 15 },
      { header: 'Filing Date', key: 'filingDate', width: 14 },
      { header: 'Decision Date', key: 'decisionDate', width: 14 },
      { header: 'Decision Receive Date', key: 'receivedDate', width: 18 },
      { header: 'Days on Trial', key: 'daysOnTrial', width: 13 },
      { header: 'Amount', key: 'amount', width: 22 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 25 },
    ];

    // Header row (row 4)
    const headerRow = sheet.getRow(4);
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1A1A1A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getColumn(idx + 1).width = col.width;
    });
    headerRow.height = 22;

    // Data rows
    appeals.forEach((appeal, index) => {
      const row = sheet.getRow(index + 5);
      const appellantNames = appeal.appellantList?.map((p) => p.name).filter(Boolean).join(', ') || '-';
      const respondentNames = appeal.respondentList?.map((p) => p.name).filter(Boolean).join(', ') || '-';
      const amountDisplay = this.getAmountDisplayForExcel(appeal);
      const daysOnTrial = this.calculateDays(appeal.dateOfFilling, appeal.dateOfDecision);

      const values = [
        index + 1,
        appeal.appealNo || '-',
        appellantNames,
        respondentNames,
        appeal.taxes?.name || '-',
        appeal.dateOfFilling ? new Date(appeal.dateOfFilling).toLocaleDateString('en-GB') : '-',
        appeal.dateOfDecision ? new Date(appeal.dateOfDecision).toLocaleDateString('en-GB') : '-',
        appeal.receivedDate ? new Date(appeal.receivedDate).toLocaleDateString('en-GB') : '-',
        daysOnTrial,
        amountDisplay,
        appeal.statusTrend?.name || '-',
        appeal.remarks || '-',
      ];

      values.forEach((val, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };
        cell.alignment = { vertical: 'top', wrapText: true };
      });

      // Alternating row colors
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F7' } };
        });
      }
    });

    // Summary section
    const summaryStartRow = appeals.length + 6;
    sheet.mergeCells(`A${summaryStartRow}:L${summaryStartRow}`);
    const summaryTitleCell = sheet.getCell(`A${summaryStartRow}`);
    summaryTitleCell.value = `Summary — Total Appeals: ${appeals.length}`;
    summaryTitleCell.font = { name: 'Arial', size: 11, bold: true };

    // Amount totals by currency
    const totals: Record<string, number> = {};
    for (const appeal of appeals) {
      if (appeal.appealAmount) {
        for (const amt of appeal.appealAmount) {
          const cur = amt.currency?.name || 'Unknown';
          totals[cur] = (totals[cur] || 0) + (amt.amount || 0);
        }
      }
    }
    const totalStr = Object.entries(totals)
      .map(([cur, total]) => `${cur} ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
      .join('  |  ');

    if (totalStr) {
      sheet.mergeCells(`A${summaryStartRow + 1}:L${summaryStartRow + 1}`);
      const totalCell = sheet.getCell(`A${summaryStartRow + 1}`);
      totalCell.value = `Total Amounts: ${totalStr}`;
      totalCell.font = { name: 'Arial', size: 10 };
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private getAmountDisplayForExcel(appeal: Appeal): string {
    if (!appeal.appealAmount || appeal.appealAmount.length === 0) return '-';
    return appeal.appealAmount
      .map((a) => {
        const currency = a.currency?.name || '';
        const amount = a.amount != null ? Number(a.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00';
        return `${currency} ${amount}`;
      })
      .join(', ');
  }

  private calculateDays(dateOfFilling: Date | string, dateOfDecision: Date | string | null): number {
    if (!dateOfFilling) return 0;
    const start = new Date(dateOfFilling);
    const end = dateOfDecision ? new Date(dateOfDecision) : new Date();
    if (isNaN(start.getTime())) return 0;
    if (isNaN(end.getTime())) return Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ===================== APPLICATION REPORT =====================

  async generateApplicationReport(filters: ApplicationReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const applications = await this.queryApplications(filters);
    this.logger.log(`Found ${applications.length} applications for report generation`);

    if (filters.format === 'PDF') {
      const buffer = await this.generateApplicationPdf(applications, filters);
      return {
        buffer,
        contentType: 'application/pdf',
        filename: `applications-report-${Date.now()}.pdf`,
      };
    } else {
      const buffer = await this.generateApplicationExcel(applications, filters);
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `applications-report-${Date.now()}.xlsx`,
      };
    }
  }

  private async queryApplications(filters: ApplicationReportFilterDto): Promise<ApplicationRegister[]> {
    const queryBuilder = this.applicationRepository.createQueryBuilder('app');

    queryBuilder
      .leftJoinAndSelect('app.appellantList', 'appellantList')
      .leftJoinAndSelect('app.respondentList', 'respondentList')
      .leftJoinAndSelect('app.taxes', 'taxes')
      .leftJoinAndSelect('app.statusTrend', 'statusTrend')
      .leftJoinAndSelect('app.applicationType', 'applicationType');

    queryBuilder.andWhere('app.dateOfFilling >= :startDate', {
      startDate: filters.startDate,
    });
    queryBuilder.andWhere('app.dateOfFilling <= :endDate', {
      endDate: filters.endDate,
    });

    queryBuilder.orderBy('app.dateOfFilling', 'DESC');

    return await queryBuilder.getMany();
  }

  private async generateApplicationPdf(applications: ApplicationRegister[], filters: ApplicationReportFilterDto): Promise<Buffer> {
    const html = generateApplicationHtmlTemplate(applications, filters, TRAT_LOGO_BASE64);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
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

  private async generateApplicationExcel(applications: ApplicationRegister[], filters: ApplicationReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TRAT Report System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Applications Report', {
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true },
    });

    // Title row
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Tax Revenue Appeals Tribunal (TRAT)';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Subtitle row
    sheet.mergeCells('A2:H2');
    const subtitleCell = sheet.getCell('A2');
    const fromDate = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const toDate = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    subtitleCell.value = `Applications from ${fromDate} to ${toDate}`;
    subtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF333333' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 22;

    // Empty row
    sheet.getRow(3).height = 10;

    // Column definitions
    const columns = [
      { header: 'Sn', width: 5 },
      { header: 'Application No', width: 18 },
      { header: 'Appellant', width: 30 },
      { header: 'Respondent', width: 30 },
      { header: 'Tax Type', width: 18 },
      { header: 'Filing Date', width: 14 },
      { header: 'Date Of Decision', width: 14 },
      { header: 'Progress Status', width: 15 },
    ];

    // Header row (row 4)
    const headerRow = sheet.getRow(4);
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1A1A1A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFC8A415' } },
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getColumn(idx + 1).width = col.width;
    });
    headerRow.height = 22;

    // Data rows
    applications.forEach((app, index) => {
      const row = sheet.getRow(index + 5);
      const appellantNames = app.appellantList?.map((p) => p.name).filter(Boolean).join(', ') || '-';
      const respondentNames = app.respondentList?.map((p) => p.name).filter(Boolean).join(', ') || '-';

      const values = [
        index + 1,
        app.applicationNo || '-',
        appellantNames,
        respondentNames,
        app.taxes?.name || '-',
        app.dateOfFilling ? new Date(app.dateOfFilling).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        app.dateOfDecision ? new Date(app.dateOfDecision).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        app.statusTrend?.name || '-',
      ];

      values.forEach((val, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
        cell.alignment = { vertical: 'top', wrapText: true };
      });
    });

    // Summary row
    const summaryRow = applications.length + 6;
    sheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
    const summaryCell = sheet.getCell(`A${summaryRow}`);
    summaryCell.value = `Total Applications: ${applications.length}`;
    summaryCell.font = { name: 'Arial', size: 11, bold: true };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ===================== NOTICE REPORT =====================

  async generateNoticeReport(filters: NoticeReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const notices = await this.queryNotices(filters);
    this.logger.log(`Found ${notices.length} notices for report generation`);

    if (filters.format === 'PDF') {
      const buffer = await this.generateNoticePdf(notices, filters);
      return {
        buffer,
        contentType: 'application/pdf',
        filename: `notices-report-${Date.now()}.pdf`,
      };
    } else {
      const buffer = await this.generateNoticeExcel(notices, filters);
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `notices-report-${Date.now()}.xlsx`,
      };
    }
  }

  private async queryNotices(filters: NoticeReportFilterDto): Promise<Notice[]> {
    const queryBuilder = this.noticeRepository.createQueryBuilder('notice');

    queryBuilder.leftJoinAndSelect('notice.bill', 'bill');

    queryBuilder.andWhere('notice.created_at >= :startDate', {
      startDate: filters.startDate,
    });
    queryBuilder.andWhere('notice.created_at <= :endDate', {
      endDate: filters.endDate + ' 23:59:59',
    });

    queryBuilder.orderBy('notice.created_at', 'DESC');

    return await queryBuilder.getMany();
  }

  private async generateNoticePdf(notices: Notice[], filters: NoticeReportFilterDto): Promise<Buffer> {
    const html = generateNoticeHtmlTemplate(notices, filters, TRAT_LOGO_BASE64);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
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

  private async generateNoticeExcel(notices: Notice[], filters: NoticeReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TRAT Report System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Notices Report', {
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true },
    });

    // Title row
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Tax Revenue Appeals Tribunal (TRAT)';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Subtitle row
    sheet.mergeCells('A2:J2');
    const subtitleCell = sheet.getCell('A2');
    const fromDate = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const toDate = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    subtitleCell.value = `Notices from ${fromDate} to ${toDate}`;
    subtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF333333' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 22;

    sheet.getRow(3).height = 10;

    const columns = [
      { header: 'Sn', width: 5 },
      { header: 'Notice No', width: 15 },
      { header: 'Appellant', width: 28 },
      { header: 'Respondent', width: 28 },
      { header: 'Notice Type', width: 14 },
      { header: 'Appeal Against', width: 20 },
      { header: 'Financial Year', width: 14 },
      { header: 'Date Created', width: 14 },
      { header: 'Control No.', width: 16 },
      { header: 'Payment Status', width: 14 },
    ];

    const headerRow = sheet.getRow(4);
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1A1A1A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A415' } } };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getColumn(idx + 1).width = col.width;
    });
    headerRow.height = 22;

    notices.forEach((notice, index) => {
      const row = sheet.getRow(index + 5);
      const values = [
        index + 1,
        notice.noticeNo || '-',
        notice.appellantFullName || '-',
        notice.respondentFullName || '-',
        notice.noticeType === '1' ? 'Without Fee' : notice.noticeType === '2' ? 'With Fee' : notice.noticeType || '-',
        notice.appealAgaints || '-',
        notice.financialYear || '-',
        notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        notice.bill?.billControlNumber && notice.bill.billControlNumber !== '0' ? notice.bill.billControlNumber : '-',
        notice.bill?.billPayed ? 'Paid' : 'Unpaid',
      ];

      values.forEach((val, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 10 };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        cell.alignment = { vertical: 'top', wrapText: true };
      });
    });

    const summaryRow = notices.length + 6;
    sheet.mergeCells(`A${summaryRow}:J${summaryRow}`);
    const summaryCell = sheet.getCell(`A${summaryRow}`);
    summaryCell.value = `Total Notices: ${notices.length}`;
    summaryCell.font = { name: 'Arial', size: 11, bold: true };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ===================== PAYMENT REPORT =====================

  async generatePaymentReport(filters: PaymentReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const payments = await this.queryPayments(filters);
    this.logger.log(`Found ${payments.length} payments for report generation`);

    if (filters.format === 'PDF') {
      const buffer = await this.generatePaymentPdf(payments, filters);
      return {
        buffer,
        contentType: 'application/pdf',
        filename: `payments-report-${Date.now()}.pdf`,
      };
    } else {
      const buffer = await this.generatePaymentExcel(payments, filters);
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `payments-report-${Date.now()}.xlsx`,
      };
    }
  }

  private async queryPayments(filters: PaymentReportFilterDto): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    queryBuilder.leftJoinAndSelect('payment.bill', 'bill');

    queryBuilder.andWhere('payment.paymentDate >= :startDate', {
      startDate: filters.startDate,
    });
    queryBuilder.andWhere('payment.paymentDate <= :endDate', {
      endDate: filters.endDate + ' 23:59:59',
    });

    queryBuilder.orderBy('bill.appType', 'ASC').addOrderBy('payment.paymentDate', 'DESC');

    return await queryBuilder.getMany();
  }

  private async generatePaymentPdf(payments: Payment[], filters: PaymentReportFilterDto): Promise<Buffer> {
    const html = generatePaymentHtmlTemplate(payments, filters, TRAT_LOGO_BASE64);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '25mm', left: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size:8px; width:100%; display:flex; justify-content:space-between; padding: 0 40px; color:#666;">
            <span>Tax Revenue Appeal System [TRAIS]</span>
            <span>Printed On: <span class="date"></span></span>
          </div>
          <div style="font-size:8px; width:100%; text-align:center; color:#888;">
            <span class="pageNumber"></span>
          </div>
        `,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private async generatePaymentExcel(payments: Payment[], filters: PaymentReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TRAT Report System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Payments Report', {
      pageSetup: { orientation: 'portrait', paperSize: 9, fitToPage: true },
    });

    // Title row
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Tax Revenue Appeal Tribunal (TRAT)';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Subtitle row
    sheet.mergeCells('A2:G2');
    const subtitleCell = sheet.getCell('A2');
    const fromDate = new Date(filters.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const toDate = new Date(filters.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    subtitleCell.value = `Payments Received from ${fromDate} to ${toDate}`;
    subtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF333333' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 22;

    sheet.getRow(3).height = 10;

    const colWidths = [5, 18, 20, 25, 14, 24, 16];
    const headers = ['Sn.', 'Control No.', 'Receipt No.', 'Payer Name', 'Payment Date', 'Psp Name', 'Amount Paid'];

    const headerRow = sheet.getRow(4);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A415' } } };
      cell.alignment = { horizontal: idx === 6 ? 'right' : 'left', vertical: 'middle' };
      sheet.getColumn(idx + 1).width = colWidths[idx];
    });
    headerRow.height = 22;

    // Group payments by appType
    const groups: Record<string, Payment[]> = {};
    for (const p of payments) {
      const type = p.bill?.appType || 'OTHER';
      if (!groups[type]) groups[type] = [];
      groups[type].push(p);
    }

    let currentRow = 5;
    let globalIndex = 0;

    for (const [appType, groupPayments] of Object.entries(groups)) {
      // Group header
      sheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const groupCell = sheet.getCell(`A${currentRow}`);
      groupCell.value = appType;
      groupCell.font = { name: 'Arial', size: 11, bold: true };
      groupCell.border = { bottom: { style: 'thin', color: { argb: 'FFC8A415' } } };
      currentRow++;

      let groupTotal = 0;

      for (const payment of groupPayments) {
        globalIndex++;
        const row = sheet.getRow(currentRow);
        const values = [
          globalIndex,
          payment.controlNumber || '-',
          payment.transactionId || '-',
          payment.payerName || '-',
          payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
          payment.pspName || '-',
          Number(payment.paidAmount) || 0,
        ];

        values.forEach((val, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { vertical: 'top', wrapText: true };
          if (idx === 6) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'top' };
          }
        });

        groupTotal += Number(payment.paidAmount) || 0;
        currentRow++;
      }

      // Group total row
      const totalRow = sheet.getRow(currentRow);
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const labelCell = totalRow.getCell(6);
      labelCell.value = 'Currency Total';
      labelCell.font = { name: 'Arial', size: 10, bold: true };
      labelCell.alignment = { horizontal: 'right' };
      const totalCell = totalRow.getCell(7);
      totalCell.value = groupTotal;
      totalCell.numFmt = '#,##0.00';
      totalCell.font = { name: 'Arial', size: 10, bold: true };
      totalCell.alignment = { horizontal: 'right' };
      totalCell.border = {
        top: { style: 'medium', color: { argb: 'FFC8A415' } },
        bottom: { style: 'thin', color: { argb: 'FFC8A415' } },
      };
      currentRow += 2;
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
