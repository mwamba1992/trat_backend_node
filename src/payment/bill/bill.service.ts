import { Injectable } from '@nestjs/common';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { parseStringPromise } from 'xml2js';
import { InjectRepository } from '@nestjs/typeorm';
import { BillItem } from '../bill-item/entities/bill-item.entity';
import { Repository } from 'typeorm';
import { Bill } from './entities/bill.entity';


@Injectable()
export class BillService {


  constructor(
    @InjectRepository(Bill)
    private readonly  billRepository: Repository<Bill>,
  ) {}


  create(createBillDto: CreateBillDto) {
    return 'This action adds a new bill';
  }

  findAll() {
    return this.billRepository.find(
      {relations: ['billItems']}
    );
  }

  findOne(id: number) {
    return `This action returns a #${id} bill`;
  }

  update(id: number, updateBillDto: UpdateBillDto) {
    return `This action updates a #${id} bill`;
  }

  remove(id: number) {
    return `This action removes a #${id} bill`;
  }

   async receiveBill(response: any){

    console.log(response);
    const parsedData = await parseStringPromise(response);

     // Access the parsed XML structure
     const billId = parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.BillId?.[0];
     const controlNumber = parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.PayCntrNum?.[0];
     const trxSts = parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.TrxSts?.[0];
     const trxStsCode = parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.TrxStsCode?.[0];
     const signature = parsedData?.Gepg?.gepgSignature?.[0];


     // saving  bill update
     const  bill = await this.billRepository.findOne({where: {billId: billId}});
     bill.billControlNumber = controlNumber;
     bill.responseCode = trxStsCode;

     await this.billRepository.save(bill);

     console.log({ billId, controlNumber, trxSts, trxStsCode, signature });

  }
}
