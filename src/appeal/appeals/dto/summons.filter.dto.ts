import { IsDateString, IsOptional } from 'class-validator';

export class SummonsFilterDto {
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;
}
