import { Module } from '@nestjs/common';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from './entities/bill.entity';
import { User } from '../../auth/user/entities/user.entity';
import { BillItem } from '../bill-item/entities/bill-item.entity';
import { Fee } from '../../settings/fees/entities/fee.entity';
import { UserContextService } from '../../auth/user/dto/user.context';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, User, BillItem, Fee])],
  controllers: [BillController],
  providers: [BillService, UserContextService],
})
export class BillModule {}
