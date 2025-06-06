import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Bill } from '../bill/entities/bill.entity';
import { Repository } from 'typeorm';
import { generatePaymentAck } from '../../utils/middle.gepg';
import { PaymentSearchDto } from './dto/payment.search.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async receivePayment(paymentXml: string) {
    console.log(paymentXml);
    const parsedXml = await parseStringPromise(paymentXml);

    const payment = new Payment();

    // Extract specific data
    const gepg = parsedXml.Gepg;
    const pymtTrxInf = gepg.gepgPmtSpInfo[0].PymtTrxInf[0];

    payment.payerName = pymtTrxInf.PyrName[0];
    payment.paymentDate = new Date(pymtTrxInf.TrxDtTm[0]);
    payment.accountNumber = pymtTrxInf.CtrAccNum[0];
    payment.transactionId = pymtTrxInf.PspReceiptNumber[0];
    payment.paidAmount = parseFloat(pymtTrxInf.PaidAmt[0]);
    payment.billAmount = parseFloat(pymtTrxInf.BillAmt[0]);
    payment.gepgReference = pymtTrxInf.PayRefId[0];
    payment.controlNumber = pymtTrxInf.PayCtrNum[0];
    payment.payerPhone = pymtTrxInf.PyrCellNum[0];
    payment.pspName = pymtTrxInf.PspName[0];

    // check if bill is available
    const bill = await this.billRepository.findOne({
      where: { billId: pymtTrxInf.BillId[0] },
    });

    if (bill === null) {
      console.log('bill id not found..............');
      return generatePaymentAck();
    }

    bill.billPayed = true;
    await this.billRepository.save(bill);

    payment.bill = bill;

    if (
      (await this.paymentRepository.findOne({
        where: {
          transactionId: pymtTrxInf.PspReceiptNumber[0],
          gepgReference: pymtTrxInf.PayRefId[0],
        },
      })) != null
    ) {
      console.log('Duplicate Payment..............');
      return generatePaymentAck();
    }

    await this.paymentRepository.save(payment);
    return generatePaymentAck();
  }

  async getAll() {
    return this.paymentRepository.find({
      relations: ['bill', 'bill.billItems'],
      order: {
        paymentDate: 'DESC',
      },
    });
  }

  async searchPayments(search: PaymentSearchDto) {
    console.log(search);
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    queryBuilder.leftJoinAndSelect('payment.bill', 'bill');

    // Filter by date range for filing
    if (search.dateOfFillingFrom) {
      queryBuilder.andWhere('appeal.payment >= :dateOfFillingFrom', {
        dateOfFillingFrom: search.dateOfFillingFrom,
      });
    }
    if (search.dateOfFillingTo) {
      queryBuilder.andWhere('appeal.payment <= :dateOfFillingTo', {
        dateOfFillingTo: search.dateOfFillingTo,
      });
    }

    if (search.type) {
      queryBuilder.andWhere('bill.appType <= :type', { type: search.type });
    }

    console.log(queryBuilder.getQuery());
    // Execute the query and return filtered results
    return await queryBuilder.getMany();
  }

  async verifyHighCourtPayment(controlNumber: string) {
    const payment = await this.paymentRepository.findOne({
      where: { controlNumber: controlNumber },
    });

    if (payment) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Payment found',
        data: payment,
      };
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment not found',
      },
      HttpStatus.NOT_FOUND,
    );
  }

  async findPaymentByGepgReceipt(gepg){
    return await this.paymentRepository.findOne({
      where: { gepgReference: gepg },
    });
  }

  async savePayment(payment: Payment) {
    return this.paymentRepository.save(payment);
  }

  async update(payment: Payment): Promise<any> {
    const { id, ...updateData } = payment;
    return this.paymentRepository.update(+id, updateData);
  }

  findBillByControlNUmber(controlNumber: string) {
    return this.billRepository.findOne({
      where: { billControlNumber: controlNumber },
    });
  }
}
