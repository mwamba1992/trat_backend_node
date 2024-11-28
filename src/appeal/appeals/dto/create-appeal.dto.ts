import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateAppealDto {

  @IsString()
  appealNo: string;

  @IsDateString()
  dateOfFilling: Date;

  @IsDateString()
  dateOfDecision: Date;

  @IsDateString()
  concludingDate: Date;

  @IsDateString()
  dateOfLastOrder: Date;

  @IsString()
  natureOfRequest: string;


  @IsNotEmpty()
  notice: number;

  @IsNotEmpty()
  taxes: number;

  @IsNotEmpty()
  statusTrend: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  appellantList: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  respondentList:  string[];

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  taxedOff?: string;

  @IsString()
  @IsOptional()
  assNo?: string;

  @IsString()
  @IsOptional()
  billNo?: string;

  @IsString()
  @IsOptional()
  bankNo?: string;

  @IsString()
  @IsOptional()
  wonBy?: string;

  // New fields
  @IsString()
  @IsOptional()
  summaryOfDecisionFromBoard?: string;

  @IsString()
  @IsOptional()
  decisionStatusFromBoard?: string;

  @IsString()
  @IsOptional()
  financialYear?: string;

  @IsBoolean()
  @IsOptional()
  isLoaded?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  amountCurrencyList?: string[];

  region:number
}
