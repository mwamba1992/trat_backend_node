import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateApplicationRegisterDto {

  @IsString()
  @IsNotEmpty()
  applicationNo: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfFilling: string;

  @IsDateString()
  @IsOptional()
  dateOfDecision: string;

  @IsString()
  @IsNotEmpty()
  natureOfRequest: string;

  @IsString()
  @IsOptional()
  personnelResponsibleFor: string;

  @IsString()
  @IsOptional()
  decideBy: string;

  @IsString()
  @IsOptional()
  remarks: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  listAppeal: string[];

  @IsNotEmpty()
  taxes: number;

  @IsNotEmpty()
  statusTrend: string;


  @IsOptional()
  billId: string;

  @IsNotEmpty()
  applicationType: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  appellantList: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  respondentList: string[];


  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  applicationss: string[];

  @IsNotEmpty()
  region: number
}
