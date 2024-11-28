import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateJudgeDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^[0-9]{10,15}$/, {
    message: 'Phone number must be between 10 and 15 digits',
  })
  phone: string;
}
