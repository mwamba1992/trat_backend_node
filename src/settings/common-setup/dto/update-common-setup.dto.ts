import { PartialType } from '@nestjs/mapped-types';
import { CreateCommonSetupDto } from './create-common-setup.dto';

export class UpdateCommonSetupDto extends PartialType(CreateCommonSetupDto) {}
