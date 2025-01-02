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
import { ApplicationRegister } from '../application-register/entities/application-register.entity';
import { YearlyCases } from './entities/yearly.case';
import { Summons } from './entities/summons.entity';
import { SummonsController } from './summons.controller';
import { SummonsService } from './summons.service';
import { Judge } from '../../settings/judges/entities/judge.entity';
import { CommonSetupService } from '../../settings/common-setup/common-setup.service';
import { NoticeService } from '../notice/notice.service';
import { BillService } from '../../payment/bill/bill.service';
import { Fee } from '../../settings/fees/entities/fee.entity';
import { PartiesService } from '../../settings/parties/parties.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appeal,
    CommonSetup, Notice, Party, Bill, BillItem, User, ApplicationRegister, YearlyCases, Summons, Judge, CommonSetup, Fee])],
  controllers: [AppealsController, SummonsController],
  providers: [AppealsService, SummonsService, CommonSetupService, NoticeService, BillService, PartiesService],
})
export class AppealsModule {}
