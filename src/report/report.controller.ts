import { Body, Controller, Post, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { AppealReportFilterDto } from './dto/appeal-report-filter.dto';
import { ApplicationReportFilterDto } from './dto/application-report-filter.dto';
import { NoticeReportFilterDto } from './dto/notice-report-filter.dto';
import { PaymentReportFilterDto } from './dto/payment-report-filter.dto';

@Controller('reports')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(private readonly reportService: ReportService) {}

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
}
