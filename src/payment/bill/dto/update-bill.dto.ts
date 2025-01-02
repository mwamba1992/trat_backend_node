import { PartialType } from '@nestjs/mapped-types';
import { BillCreateDTO } from './create-bill.dto';


export class UpdateBillDto extends PartialType(BillCreateDTO) {}
