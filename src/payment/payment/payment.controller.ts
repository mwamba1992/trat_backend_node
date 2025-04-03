import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../../auth/auth.guard';
import { PaymentSearchDto } from './dto/payment.search.dto';
import { Constants } from "../../utils/constants";


@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/receive-payment')
  create(@Body() receivePayment: string) {
    return this.paymentService.receivePayment(receivePayment);
  }

  @Post('/filter')
  @UseGuards(AuthGuard)
  async filterPayments(@Query() filters: PaymentSearchDto) {
    return this.paymentService.searchPayments(filters);
  }

  @Post('/verify-payment')
  async verifyPayment(
    @Body('controlNumber') controlNumber: string,
    @Headers() headers: Record<string, string>,
  ) {
    const apiKey = headers['x-api-key']; // extract it manually
    const expectedApiKey = Constants.API_KEY;

    if (apiKey !== expectedApiKey) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized: Invalid API Key',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.paymentService.verifyHighCourtPayment(controlNumber);
  }

  @Get()
  getPayments() {
    return this.paymentService.getAll();
  }
}
