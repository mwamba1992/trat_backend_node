import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './auth/permission/entities/permission.entity';
import { User } from './auth/user/entities/user.entity';
import { AppealModule } from './appeal/appeal.module';
import { Role } from './auth/role/entities/role.entity';
import { PaymentModule } from './payment/payment.module';
import { Notice } from './appeal/notice/entities/notice.entity';
import { Bill } from './payment/bill/entities/bill.entity';
import { BillItemController } from './payment/bill-item/bill-item.controller';
import { BillItem } from './payment/bill-item/entities/bill-item.entity';
import { SettingsModule } from './settings/settings.module';
import { CommonSetup } from './settings/common-setup/entities/common-setup.entity';
import { Judge } from './settings/judges/entities/judge.entity';
import { Party } from './settings/parties/entities/party.entity';
import { ApplicationRegister } from './appeal/application-register/entities/application-register.entity';
import { Appeal } from './appeal/appeals/entities/appeal.entity';
import { AppealAmount } from './appeal/appeals/entities/appeal.amount';
import { Fee } from './settings/fees/entities/fee.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      password: 'amtz',
      username: 'amtz',
      entities: [Permission, User, Role, Notice, Bill, BillItem, CommonSetup, Judge, Party, ApplicationRegister, Appeal, AppealAmount,  Fee],
      database: 'ubs',
      synchronize: true,
      logging: false,
    }),AuthModule, AppealModule, PaymentModule, SettingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
