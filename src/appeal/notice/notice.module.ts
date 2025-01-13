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
import { UserContextService } from '../../auth/user/dto/user.context';
import { NoticeHighCourt } from './entities/notice.high.court';
import { Appeal } from '../appeals/entities/appeal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notice, Bill, BillItem, User, Fee, NoticeHighCourt, Appeal])],
  controllers: [NoticeController],
  providers: [NoticeService, BillService, UserContextService],
})
export class NoticeModule {}
