import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../../auth/auth.guard';
import { PaymentSearchDto } from './dto/payment.search.dto';
import { Constants } from '../../utils/constants';
import { Payment } from './entities/payment.entity';

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

  @Post('/import')
  importBill() {
    console.log('Importing  payments from CSV file');

    const csv = require('csv-parser');
    const fs = require('fs');
    fs.createReadStream('/Users/mwendavano/payment_export.csv')
      .pipe(csv())
      .on('data', async (row: { [x: string]: string }) => {
        console.log(row);
        // Map CSV rows to Bill entity
        const payment = new Payment();
        payment.controlNumber = row['control_number'];
        payment.pspName = row['psp_name'];
        payment.accountNumber = '';
        payment.gepgReference = row['gepg_receipt'];
        payment.transactionId = row['bank_receipt'];
        payment.billAmount = parseFloat(row['paid_amount']);
        payment.paidAmount = parseFloat(row['paid_amount']);
        payment.paymentDate = new Date(row['payment_date']);
        payment.payerName = row['payer_name'];
        payment.bill = await this.paymentService.findBillByControlNUmber(
          row['control_number'],
        );

        if (
          (await this.paymentService.findPaymentByGepgReceipt(
            payment.gepgReference,
          )) === null
        ) {
          await this.paymentService.savePayment(payment);
          console.log('#### saved ####');
        } else {
          await this.paymentService.update(payment);
          console.log('##### not saved ####');
        }
      })
      .on('end', () => {});
  }
}
