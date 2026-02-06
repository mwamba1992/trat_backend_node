import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appeal } from '../appeal/appeals/entities/appeal.entity';
import { ApplicationRegister } from '../appeal/application-register/entities/application-register.entity';
import { Notice } from '../appeal/notice/entities/notice.entity';
import { Payment } from '../payment/payment/entities/payment.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appeal, ApplicationRegister, Notice, Payment])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
