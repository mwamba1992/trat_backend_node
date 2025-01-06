import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../../auth/auth.guard';
import { PaymentSearchDto } from './dto/payment.search.dto';


@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("/receive-payment")
  create(@Body() receivePayment: string) {
    return this.paymentService.receivePayment(receivePayment);
  }

  @Post('/filter')
  @UseGuards(AuthGuard)
  async filterPayments(@Query() filters: PaymentSearchDto) {
    return this.paymentService.searchPayments(filters);
  }

  @Get()
  getPayments(){
    return this.paymentService.getAll();
  }
}
