import { IsNotEmpty, IsDateString, IsEnum } from 'class-validator';
import { ReportFormat } from './appeal-report-filter.dto';

export class PaymentReportFilterDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsEnum(ReportFormat)
  format: ReportFormat;
}
