import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UserContextService } from '../../auth/user/dto/user.context';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, UserContextService],
})
export class PaymentModule {}
