import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from '../payment/bill/entities/bill.entity';
import { Payment } from '../payment/payment/entities/payment.entity';
import { AnalyticsReportFilterDto } from './dto/analytics-report-filter.dto';
import { OutstandingBillRow, generateOutstandingBillsHtmlTemplate } from './templates/outstanding-bills-report.template';
import { RevenueSummaryRow, generateRevenueSummaryHtmlTemplate } from './templates/revenue-summary-report.template';
import { BillReconciliationRow, generateBillReconciliationHtmlTemplate } from './templates/bill-reconciliation-report.template';
import { TRAT_LOGO_BASE64 } from './assets/logo';
import * as puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';

@Injectable()
export class FinanceReportService {
  private readonly logger = new Logger(FinanceReportService.name);

  constructor(
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  // ===================== OUTSTANDING BILLS =====================

  async generateOutstandingBillsReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { rows, summary } = await this.buildOutstandingBillsData(filters);
    this.logger.log(`Outstanding bills: ${rows.length} found`);

    if (filters.format === 'PDF') {
      const html = generateOutstandingBillsHtmlTemplate(rows, summary, filters, TRAT_LOGO_BASE64);
      const buffer = await this.renderPdf(html, true);
      return { buffer, contentType: 'application/pdf', filename: `outstanding-bills-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildOutstandingBillsExcel(rows, summary, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `outstanding-bills-${Date.now()}.xlsx` };
    }
  }

  private async buildOutstandingBillsData(filters: AnalyticsReportFilterDto) {
    const bills = await this.billRepository.createQueryBuilder('bill')
      .where('bill.billPayed = :paid', { paid: false })
      .andWhere('bill.generatedDate >= :start', { start: filters.startDate })
      .andWhere('bill.generatedDate <= :end', { end: filters.endDate })
      .orderBy('bill.generatedDate', 'ASC')
      .getMany();

    const now = new Date();
    const byBucket: Record<string, { count: number; amount: number }> = {
      '0-30 days': { count: 0, amount: 0 },
      '31-60 days': { count: 0, amount: 0 },
      '61-90 days': { count: 0, amount: 0 },
      '90+ days': { count: 0, amount: 0 },
    };

    const rows: OutstandingBillRow[] = bills.map((bill, i) => {
      const genDate = new Date(bill.generatedDate);
      const agingDays = Math.floor((now.getTime() - genDate.getTime()) / (1000 * 60 * 60 * 24));
      const bucket = agingDays <= 30 ? '0-30 days' : agingDays <= 60 ? '31-60 days' : agingDays <= 90 ? '61-90 days' : '90+ days';

      byBucket[bucket].count++;
      byBucket[bucket].amount += Number(bill.billedAmount) || 0;

      return {
        sn: i + 1,
        controlNumber: bill.billControlNumber && bill.billControlNumber !== '0' ? bill.billControlNumber : '-',
        billReference: bill.billReference || '-',
        appType: bill.appType || '-',
        payerName: bill.payerName || '-',
        billedAmount: Number(bill.billedAmount) || 0,
        currency: bill.currency || 'TZS',
        generatedDate: genDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        expiryDate: bill.expiryDate ? new Date(bill.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
        agingDays,
        agingBucket: bucket,
      };
    });

    const totalAmount = rows.reduce((s, r) => s + r.billedAmount, 0);

    return { rows, summary: { totalCount: rows.length, totalAmount, byBucket } };
  }

  private async buildOutstandingBillsExcel(rows: OutstandingBillRow[], summary: any, filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Outstanding Bills', { pageSetup: { orientation: 'landscape', paperSize: 9 } });

    this.addExcelHeader(sheet, 'Outstanding Bills Report', filters, 'K');

    const headers = ['Sn', 'Control No.', 'Bill Ref', 'Type', 'Payer', 'Currency', 'Amount', 'Generated', 'Expiry', 'Days', 'Aging'];
    const widths = [5, 16, 16, 14, 22, 8, 16, 14, 14, 8, 14];
    this.addExcelTableHeader(sheet, headers, widths, 4);

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [row.sn, row.controlNumber, row.billReference, row.appType, row.payerName, row.currency, row.billedAmount, row.generatedDate, row.expiryDate, row.agingDays, row.agingBucket]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          if (j === 6) cell.numFmt = '#,##0.00';
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== REVENUE SUMMARY =====================

  async generateRevenueSummaryReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { rows, grandTotals } = await this.buildRevenueSummaryData(filters);
    this.logger.log(`Revenue summary: ${rows.length} categories`);

    if (filters.format === 'PDF') {
      const html = generateRevenueSummaryHtmlTemplate(rows, grandTotals, filters, TRAT_LOGO_BASE64);
      const buffer = await this.renderPdf(html, true);
      return { buffer, contentType: 'application/pdf', filename: `revenue-summary-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildRevenueSummaryExcel(rows, grandTotals, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `revenue-summary-${Date.now()}.xlsx` };
    }
  }

  private async buildRevenueSummaryData(filters: AnalyticsReportFilterDto) {
    const bills = await this.billRepository.createQueryBuilder('bill')
      .where('bill.generatedDate >= :start', { start: filters.startDate })
      .andWhere('bill.generatedDate <= :end', { end: filters.endDate })
      .getMany();

    const typeMap: Record<string, { billCount: number; paidCount: number; totalBilled: number; totalCollected: number }> = {};

    for (const bill of bills) {
      const type = bill.appType || 'OTHER';
      if (!typeMap[type]) typeMap[type] = { billCount: 0, paidCount: 0, totalBilled: 0, totalCollected: 0 };
      typeMap[type].billCount++;
      typeMap[type].totalBilled += Number(bill.billedAmount) || 0;
      if (bill.billPayed) {
        typeMap[type].paidCount++;
        typeMap[type].totalCollected += Number(bill.paidAmount) || Number(bill.billedAmount) || 0;
      }
    }

    const rows: RevenueSummaryRow[] = Object.entries(typeMap).map(([appType, data]) => ({
      appType,
      billCount: data.billCount,
      paidCount: data.paidCount,
      totalBilled: data.totalBilled,
      totalCollected: data.totalCollected,
      collectionRate: data.totalBilled > 0 ? (data.totalCollected / data.totalBilled) * 100 : 0,
    })).sort((a, b) => b.totalBilled - a.totalBilled);

    const grandTotals = {
      billed: rows.reduce((s, r) => s + r.totalBilled, 0),
      collected: rows.reduce((s, r) => s + r.totalCollected, 0),
      billCount: rows.reduce((s, r) => s + r.billCount, 0),
      paidCount: rows.reduce((s, r) => s + r.paidCount, 0),
    };

    return { rows, grandTotals };
  }

  private async buildRevenueSummaryExcel(rows: RevenueSummaryRow[], grandTotals: any, filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Revenue Summary', { pageSetup: { orientation: 'landscape', paperSize: 9 } });

    this.addExcelHeader(sheet, 'Revenue Summary Report', filters, 'G');

    const headers = ['Sn', 'Category', 'Bills Generated', 'Bills Paid', 'Total Billed', 'Total Collected', 'Collection Rate'];
    const widths = [5, 18, 14, 12, 18, 18, 14];
    this.addExcelTableHeader(sheet, headers, widths, 4);

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [i + 1, row.appType, row.billCount, row.paidCount, row.totalBilled, row.totalCollected, `${row.collectionRate.toFixed(1)}%`]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          if (j === 4 || j === 5) cell.numFmt = '#,##0.00';
          if (j >= 2) cell.alignment = { horizontal: j <= 3 ? 'center' : 'right' };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===================== BILL RECONCILIATION =====================

  async generateBillReconciliationReport(filters: AnalyticsReportFilterDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { rows, summary } = await this.buildBillReconciliationData(filters);
    this.logger.log(`Bill reconciliation: ${rows.length} bills`);

    if (filters.format === 'PDF') {
      const html = generateBillReconciliationHtmlTemplate(rows, summary, filters, TRAT_LOGO_BASE64);
      const buffer = await this.renderPdf(html, true);
      return { buffer, contentType: 'application/pdf', filename: `bill-reconciliation-${Date.now()}.pdf` };
    } else {
      const buffer = await this.buildBillReconciliationExcel(rows, summary, filters);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `bill-reconciliation-${Date.now()}.xlsx` };
    }
  }

  private async buildBillReconciliationData(filters: AnalyticsReportFilterDto) {
    const bills = await this.billRepository.createQueryBuilder('bill')
      .where('bill.generatedDate >= :start', { start: filters.startDate })
      .andWhere('bill.generatedDate <= :end', { end: filters.endDate })
      .orderBy('bill.generatedDate', 'DESC')
      .getMany();

    const now = new Date();
    let paid = 0, unpaid = 0, expired = 0, totalBilled = 0, totalPaid = 0;

    const rows: BillReconciliationRow[] = bills.map((bill, i) => {
      const billedAmt = Number(bill.billedAmount) || 0;
      const paidAmt = bill.billPayed ? (Number(bill.paidAmount) || billedAmt) : 0;
      const isExpired = !bill.billPayed && bill.expiryDate && new Date(bill.expiryDate) < now;
      const status = bill.billPayed ? 'Paid' : isExpired ? 'Expired' : 'Unpaid';

      totalBilled += billedAmt;
      totalPaid += paidAmt;
      if (status === 'Paid') paid++;
      else if (status === 'Expired') expired++;
      else unpaid++;

      return {
        sn: i + 1,
        controlNumber: bill.billControlNumber && bill.billControlNumber !== '0' ? bill.billControlNumber : '-',
        billReference: bill.billReference || '-',
        appType: bill.appType || '-',
        payerName: bill.payerName || '-',
        billedAmount: billedAmt,
        paidAmount: paidAmt,
        variance: billedAmt - paidAmt,
        currency: bill.currency || 'TZS',
        generatedDate: new Date(bill.generatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status,
      };
    });

    return { rows, summary: { total: bills.length, paid, unpaid, expired, totalBilled, totalPaid } };
  }

  private async buildBillReconciliationExcel(rows: BillReconciliationRow[], summary: any, filters: AnalyticsReportFilterDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bill Reconciliation', { pageSetup: { orientation: 'landscape', paperSize: 9 } });

    this.addExcelHeader(sheet, 'Bill Reconciliation Report', filters, 'K');

    const headers = ['Sn', 'Control No.', 'Bill Ref', 'Type', 'Payer', 'Currency', 'Billed', 'Paid', 'Variance', 'Date', 'Status'];
    const widths = [5, 16, 16, 12, 22, 8, 16, 16, 16, 14, 10];
    this.addExcelTableHeader(sheet, headers, widths, 4);

    rows.forEach((row, i) => {
      const r = sheet.getRow(i + 5);
      [row.sn, row.controlNumber, row.billReference, row.appType, row.payerName, row.currency, row.billedAmount, row.paidAmount, row.variance, row.generatedDate, row.status]
        .forEach((val, j) => {
          const cell = r.getCell(j + 1);
          cell.value = val;
          cell.font = { name: 'Arial', size: 10 };
          if (j >= 6 && j <= 8) cell.numFmt = '#,##0.00';
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
