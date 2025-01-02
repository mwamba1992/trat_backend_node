import { Controller, Post, Body, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';


@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("/receive-payment")
  create(@Body() receivePayment: string) {
    return this.paymentService.receivePayment(receivePayment);
  }

  @Get()
  getPayments(){
    return this.paymentService.getAll();
  }
}
