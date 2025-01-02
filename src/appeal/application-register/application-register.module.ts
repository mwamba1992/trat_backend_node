import { Module } from '@nestjs/common';
import { ApplicationRegisterService } from './application-register.service';
import { ApplicationRegisterController } from './application-register.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationRegister } from './entities/application-register.entity';
import { Notice } from '../notice/entities/notice.entity';
import { CommonSetup } from '../../settings/common-setup/entities/common-setup.entity';
import { Party } from '../../settings/parties/entities/party.entity';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';
import { User } from '../../auth/user/entities/user.entity';
import { Bill } from '../../payment/bill/entities/bill.entity';
import { Fee } from '../../settings/fees/entities/fee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationRegister, Notice,  CommonSetup, Party, BillItem, User, Bill, Fee])],
  controllers: [ApplicationRegisterController],
  providers: [ApplicationRegisterService],
})
export class ApplicationRegisterModule {}
