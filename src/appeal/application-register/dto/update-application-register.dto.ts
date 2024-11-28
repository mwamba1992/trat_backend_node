import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationRegisterDto } from './create-application-register.dto';

export class UpdateApplicationRegisterDto extends PartialType(CreateApplicationRegisterDto) {}
