import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appeal } from '../appeal/appeals/entities/appeal.entity';
import { ApplicationRegister } from '../appeal/application-register/entities/application-register.entity';
import { Notice } from '../appeal/notice/entities/notice.entity';
import { NoticeHighCourt } from '../appeal/notice/entities/notice.high.court';
import { Payment } from '../payment/payment/entities/payment.entity';
import { Bill } from '../payment/bill/entities/bill.entity';
import { Summons } from '../appeal/appeals/entities/summons.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { AnalyticsReportService } from './analytics-report.service';
import { FinanceReportService } from './finance-report.service';
import { OperationalReportService } from './operational-report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appeal,
      ApplicationRegister,
      Notice,
      NoticeHighCourt,
      Payment,
      Bill,
      Summons,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService, AnalyticsReportService, FinanceReportService, OperationalReportService],
})
export class ReportModule {}
