import { Module } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';
import { Bill } from '../../payment/bill/entities/bill.entity';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';
import { User } from '../../auth/user/entities/user.entity';
import { BillService } from '../../payment/bill/bill.service';
import { Fee } from '../../settings/fees/entities/fee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notice, Bill, BillItem, User, Fee])],
  controllers: [NoticeController],
  providers: [NoticeService, BillService],
})
export class NoticeModule {}
