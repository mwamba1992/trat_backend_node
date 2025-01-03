import { Injectable } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Bill } from '../bill/entities/bill.entity';
import { Repository } from 'typeorm'
import { generatePaymentAck } from '../../utils/middle.gepg';


@Injectable()
export class PaymentService {


  constructor(
    @InjectRepository(Bill)
    private readonly  billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly  paymentRepository: Repository<Payment>,
  ) {}



  async receivePayment(paymentXml:  String) {
    console.log(paymentXml);
    const parsedXml = await parseStringPromise(paymentXml);

    const payment = new Payment();

     // Extract specific data
     const gepg =  parsedXml.Gepg;
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

     // check if bill is available
    const  bill =  await this.billRepository.findOne({
      where: {billId: pymtTrxInf.BillId[0]}
    });

    if(bill === null){
      console.log("bill id not found..............")
      return  null;
    }
     // @ts-ignore
    payment.bill = bill;

    if(await this.paymentRepository.findOne({
      where: { transactionId: pymtTrxInf.PspReceiptNumber[0], gepgReference: pymtTrxInf.PayRefId[0] }
    }) !=null){
      console.log("Duplicate Payment..............");
      return null;
    }


    await this.paymentRepository.save(payment);
    return  generatePaymentAck();
  }


  async getAll(){
    return this.paymentRepository.find(
      {
        relations: ['bill', 'bill.billItems'],
        order: {
          paymentDate: "ASC"
        }
      }
    )
  }
}
