import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommonSetupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  setupType: string;
}
