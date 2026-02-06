import { IsOptional, IsEnum, IsString, IsDateString, IsNotEmpty, IsNumber } from 'class-validator';
import { ProgressStatus } from '../../appeal/appeals/dto/appeal.status.enum';
import { Type } from 'class-transformer';

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export class AppealReportFilterDto {
  @IsNotEmpty()
  @IsDateString()
  dateOfFillingFrom: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfFillingTo: string;

  @IsOptional()
  @IsDateString()
  dateOfDecisionFrom?: string;

  @IsOptional()
  @IsDateString()
  dateOfDecisionTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxType?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  statusTrend?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  judgeId?: number;

  @IsOptional()
  @IsString()
  financialYear?: string;

  @IsOptional()
  @IsEnum(ProgressStatus)
  progressStatus?: ProgressStatus;

  @IsNotEmpty()
  @IsEnum(ReportFormat)
  format: ReportFormat;
}
