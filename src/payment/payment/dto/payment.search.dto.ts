import { IsDateString, IsOptional } from 'class-validator';


export class PaymentSearchDto {


  @IsOptional()
  @IsDateString()
  dateOfFillingFrom?: string;

  @IsOptional()
  @IsDateString()
  dateOfFillingTo?: string;

  @IsOptional()
  type?: string
}