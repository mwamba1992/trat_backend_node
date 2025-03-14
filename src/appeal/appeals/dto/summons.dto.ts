// dto/create-summons.dto.ts
import { IsString, IsDate, IsEnum, IsOptional } from 'class-validator';
import { SummonsStatus } from '../entities/summons.entity';
import { Appeal } from '../entities/appeal.entity';
import { ApplicationRegister } from '../../application-register/entities/application-register.entity';

export class CreateSummonsDto {
  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsEnum(SummonsStatus)
  status: SummonsStatus;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  appeals: Appeal[];

  @IsOptional()
  applications: ApplicationRegister[];

  judge: number;

  member1: number;

  member2: number;

}
