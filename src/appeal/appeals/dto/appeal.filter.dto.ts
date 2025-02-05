// appeal-filter.dto.ts
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ProgressStatus } from './appeal.status.enum';

export class AppealFilterDto {
  @IsOptional()
  @IsDateString()
  dateOfFillingFrom?: string;

  @IsOptional()
  @IsDateString()
  dateOfFillingTo?: string;

  @IsOptional()
  @IsDateString()
  dateOfDecisionFrom?: string;

  @IsOptional()
  @IsDateString()
  dateOfDecisionTo?: string;

  @IsOptional()
  @IsEnum(ProgressStatus)
  progressStatus?: ProgressStatus;

  @IsOptional()
  @IsString()
  appellantList?: string;

  @IsOptional()
  @IsString()
  respondentList?: string;

}
