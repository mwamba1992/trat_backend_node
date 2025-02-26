import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

export class CreateNoticeDto {

  @IsString()
  @Length(1, 255) // Ensuring the length of the string
  noticeNo: string;

  @IsString()
  @Length(1, 255)
  appellantFullName: string;

  @IsString()
  @Length(1, 255)
  respondentFullName: string;

  @IsOptional()
  @IsPhoneNumber('TZ') // You could specify the country code if required
  appellantPhone?: string;

  @IsOptional()
  @IsPhoneNumber('TZ') // You could specify the country code if required
  respondentPhone?: string;

  @IsBoolean()
  filledByGovernment: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  listAppeal?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  listApplication?: string[];


  @IsOptional()
  @IsString()
  @Length(1, 255)
  appealAgaints?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  noticeType?: string;
}
