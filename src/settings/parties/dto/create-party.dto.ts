import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreatePartyDto {

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nature_of_business: string;

  @IsEmail()
  email_address: string;

  @IsString()
  tin_number: string;

  @IsString()
  income_tax_file_number: string;

  @IsString()
  vat_number: string;

}
