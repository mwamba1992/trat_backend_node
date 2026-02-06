import { Body, Controller, Post, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { AnalyticsReportService } from './analytics-report.service';
import { FinanceReportService } from './finance-report.service';
import { OperationalReportService } from './operational-report.service';
import { AppealReportFilterDto } from './dto/appeal-report-filter.dto';
import { ApplicationReportFilterDto } from './dto/application-report-filter.dto';
import { NoticeReportFilterDto } from './dto/notice-report-filter.dto';
import { PaymentReportFilterDto } from './dto/payment-report-filter.dto';
import { AnalyticsReportFilterDto } from './dto/analytics-report-filter.dto';

@Controller('reports')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(
    private readonly reportService: ReportService,
    private readonly analyticsReportService: AnalyticsReportService,
    private readonly financeReportService: FinanceReportService,
    private readonly operationalReportService: OperationalReportService,
  ) {}

  @Post('appeals')
  async generateAppealReport(
    @Body() filters: AppealReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} appeal report`);

    const { buffer, contentType, filename } = await this.reportService.generateAppealReport(filters);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post('applications')
  async generateApplicationReport(
    @Body() filters: ApplicationReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} application report`);

    const { buffer, contentType, filename } = await this.reportService.generateApplicationReport(filters);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post('notices')
  async generateNoticeReport(
    @Body() filters: NoticeReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} notice report`);

    const { buffer, contentType, filename } = await this.reportService.generateNoticeReport(filters);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post('payments')
  async generatePaymentReport(
    @Body() filters: PaymentReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} payment report`);

    const { buffer, contentType, filename } = await this.reportService.generatePaymentReport(filters);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  // ===================== CASE ANALYTICS =====================

  @Post('analytics/judge-workload')
  async generateJudgeWorkloadReport(
    @Body() filters: AnalyticsReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} judge workload report`);
    const { buffer, contentType, filename } = await this.analyticsReportService.generateJudgeWorkloadReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('analytics/case-status')
  async generateCaseStatusReport(
    @Body() filters: AnalyticsReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} case status report`);
    const { buffer, contentType, filename } = await this.analyticsReportService.generateCaseStatusReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('analytics/tax-type')
  async generateTaxTypeReport(
    @Body() filters: AnalyticsReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} tax type analysis report`);
    const { buffer, contentType, filename } = await this.analyticsReportService.generateTaxTypeReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('analytics/top-appellants')
  async generateTopAppellantsReport(
    @Body() filters: AnalyticsReportFilterDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating ${filters.format} top appellants report`);
    const { buffer, contentType, filename } = await this.analyticsReportService.generateTopAppellantsReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  // ===================== FINANCE REPORTS =====================

  @Post('finance/outstanding-bills')
  async generateOutstandingBillsReport(@Body() filters: AnalyticsReportFilterDto, @Res() res: Response) {
    this.logger.log(`Generating ${filters.format} outstanding bills report`);
    const { buffer, contentType, filename } = await this.financeReportService.generateOutstandingBillsReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('finance/revenue-summary')
  async generateRevenueSummaryReport(@Body() filters: AnalyticsReportFilterDto, @Res() res: Response) {
    this.logger.log(`Generating ${filters.format} revenue summary report`);
    const { buffer, contentType, filename } = await this.financeReportService.generateRevenueSummaryReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('finance/bill-reconciliation')
  async generateBillReconciliationReport(@Body() filters: AnalyticsReportFilterDto, @Res() res: Response) {
    this.logger.log(`Generating ${filters.format} bill reconciliation report`);
    const { buffer, contentType, filename } = await this.financeReportService.generateBillReconciliationReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  // ===================== OPERATIONAL REPORTS =====================

  @Post('operational/summons')
  async generateSummonsReport(@Body() filters: AnalyticsReportFilterDto, @Res() res: Response) {
    this.logger.log(`Generating ${filters.format} summons report`);
    const { buffer, contentType, filename } = await this.operationalReportService.generateSummonsReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('operational/high-court-notices')
  async generateHighCourtNoticesReport(@Body() filters: AnalyticsReportFilterDto, @Res() res: Response) {
    this.logger.log(`Generating ${filters.format} high court notices report`);
    const { buffer, contentType, filename } = await this.operationalReportService.generateHighCourtNoticesReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('operational/overdue-cases')
  async generateOverdueCasesReport(@Body() filters: AnalyticsReportFilterDto, @Res() res: Response) {
    this.logger.log(`Generating ${filters.format} overdue cases report`);
    const { buffer, contentType, filename } = await this.operationalReportService.generateOverdueCasesReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }

  @Post('operational/financial-year-comparison')
  async generateFinancialYearComparisonReport(@Body() filters: AnalyticsReportFilterDto, @Res() res: Response) {
    this.logger.log(`Generating ${filters.format} financial year comparison report`);
    const { buffer, contentType, filename } = await this.operationalReportService.generateFinancialYearComparisonReport(filters);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.end(buffer);
  }
}
