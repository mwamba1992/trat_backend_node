import { IsNotEmpty, IsDateString, IsEnum } from 'class-validator';
import { ReportFormat } from './appeal-report-filter.dto';

export class NoticeReportFilterDto {
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
