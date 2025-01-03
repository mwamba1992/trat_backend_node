import { Module } from '@nestjs/common';
import { PartiesService } from './parties.service';
import { PartiesController } from './parties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity';
import { CommonSetup } from '../common-setup/entities/common-setup.entity';
import { CommonSetupService } from '../common-setup/common-setup.service';
import { NoticeService } from '../../appeal/notice/notice.service';
import { Notice } from '../../appeal/notice/entities/notice.entity';
import { Bill } from '../../payment/bill/entities/bill.entity';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';
import { User } from '../../auth/user/entities/user.entity';
import { Fee } from '../fees/entities/fee.entity';
import { UserContextService } from '../../auth/user/dto/user.context';

@Module({
  imports: [TypeOrmModule.forFeature([Party, CommonSetup, Notice, Bill, BillItem, User, Fee])],
  controllers: [PartiesController],
  providers: [PartiesService, CommonSetupService, NoticeService, UserContextService],
})
export class PartiesModule {}
