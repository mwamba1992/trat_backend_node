import { Module } from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { AppealsController } from './appeals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonSetup } from '../../settings/common-setup/entities/common-setup.entity';
import { Appeal } from './entities/appeal.entity';
import { Notice } from '../notice/entities/notice.entity';
import { Party } from '../../settings/parties/entities/party.entity';
import { Bill } from '../../payment/bill/entities/bill.entity';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';
import { User } from '../../auth/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appeal,  CommonSetup, Notice, Party, Bill, BillItem, User])],
  controllers: [AppealsController],
  providers: [AppealsService],
})
export class AppealsModule {}
