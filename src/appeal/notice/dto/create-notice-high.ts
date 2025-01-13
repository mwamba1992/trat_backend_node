import { IsOptional, IsString } from 'class-validator';


export class CreateNoticeHigh{
  @IsString()
  appellantType: string;

  @IsString()
  appellantName: string;

  @IsString()
  appellantPhone:string

  @IsString()
  respondentName: string;

  @IsOptional()
  listOfAppeals: string[];  // U

}