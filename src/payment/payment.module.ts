import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from './bill/entities/bill.entity';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { Payment } from './payment/entities/payment.entity';
import { UserContextService } from '../auth/user/dto/user.context';


@Module({
  imports: [TypeOrmModule.forFeature([Bill, Payment])],
  controllers: [PaymentController],
  providers: [PaymentService, UserContextService],
})
export class PaymentModule {}
