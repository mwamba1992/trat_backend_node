import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UserContextService } from '../../auth/user/dto/user.context';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from '../bill/entities/bill.entity';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Payment])],
  controllers: [PaymentController],
  providers: [PaymentService, UserContextService],
})
export class PaymentModule {}
