import { Module } from '@nestjs/common';
import { BillItemService } from './bill-item.service';
import { BillItemController } from './bill-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillItem } from './entities/bill-item.entity';
import { Bill } from '../bill/entities/bill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BillItem, Bill])],
  controllers: [BillItemController],
  providers: [BillItemService],
})
export class BillItemModule {}
