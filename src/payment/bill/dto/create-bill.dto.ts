import { IsString, IsEmail, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CartDTO } from './carts';

export class BillCreateDTO {
  @IsString()
  @IsNotEmpty()
  payerName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  sourceName: string | null;

  @IsNumber()
  @IsOptional()
  billedAmount: number | null;

  @IsString()
  @IsNotEmpty()
  billDescription: string;

  @IsNumber()
  @IsNotEmpty()
  type: number;

  @IsString()
  @IsNotEmpty()
  numberOfDays: string;  // Keep it as string as in the provided example

  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartDTO)
  carts: CartDTO[];
}
