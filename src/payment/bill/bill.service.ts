import { Injectable } from '@nestjs/common';
import { UpdateBillDto } from './dto/update-bill.dto';
import { parseStringPromise } from 'xml2js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from './entities/bill.entity';
import { BillCreateDTO } from './dto/create-bill.dto';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../auth/user/entities/user.entity';
import { BillItem } from '../bill-item/entities/bill-item.entity';
import { Fee } from '../../settings/fees/entities/fee.entity';
import { sendBill } from '../../utils/middle.gepg';
import { UserContextService } from '../../auth/user/dto/user.context';


@Injectable()
export class BillService {


  constructor(
    @InjectRepository(Bill)
    private readonly  billRepository: Repository<Bill>,
    @InjectRepository(User)
    private readonly  userRepository: Repository<User>,
    @InjectRepository(BillItem)
    private readonly  billItemRepository: Repository<BillItem>,
    @InjectRepository(Fee)
    private readonly  feeRepository: Repository<Fee>,
    private readonly userContextService: UserContextService
  ) {}


  async create(createBillDto: BillCreateDTO) {
    const bill = new Bill();


    const totalBillAmount = createBillDto.carts.reduce((acc, cart) => {
      return acc + (parseFloat(String(cart.billedAmount)) || 0);  // Ensure billedAmount is treated as a number
    }, 0);

    bill.billEquivalentAmount = totalBillAmount;
    bill.billedAmount = totalBillAmount
    bill.status = 'PENDING';
    bill.generatedDate = new Date();
    bill.appType = 'OTHERS';
    bill.billDescription = createBillDto.billDescription;
    bill.billReference = createBillDto.billDescription;
    bill.billControlNumber = '0';
    bill.billPayed = false;
    bill.miscellaneousAmount = 0;
    bill.payerPhone = createBillDto.phoneNumber;
    bill.payerName = createBillDto.payerName;
    bill.payerEmail = createBillDto.email;
    bill.billPayType = createBillDto.type.toString();
    bill.currency = "TZS"

    const uuid = uuidv4(); // Full UUID
    bill.billId = uuid.split('-')[0];


    // Set expiry date (14 days from today)
    const expiryDate = new Date();
    expiryDate.setDate(Number(expiryDate.getDate() + createBillDto.numberOfDays));
    bill.expiryDate = expiryDate;

    // Set audit fields
    bill.createdAt = new Date();
    bill.updatedAt = new Date();


    bill.createdByUser = await this.userRepository.findOne({ where: { username: this.userContextService.getUser().username } });

    bill.approvedBy = 'SYSTEM';
    bill.financialYear = '2024/2025';

    const saveBill =   await this.billRepository.save(bill);



    for (const cart of createBillDto.carts) {

      const fee:Fee = await this.feeRepository.findOne({
        where: { revenueName: cart.sourceName }, relations: ['gfs']});


      console.log(fee);
      const billItem = new BillItem();
      billItem.bill = bill;
      billItem.billItemAmount = cart.billedAmount;
      billItem.billItemEqvAmount = cart.billedAmount;
      billItem.billItemMiscAmount = 0;
      billItem.billItemRef = cart.sourceName;
      billItem.gfsCode = fee.gfs.name;
      billItem.bill = saveBill
      billItem.sourceName = 'OTHERS';
      await this.billItemRepository.save(billItem);
    }

    await sendBill(bill, this.billItemRepository);
  }

  findAll() {
    return this.billRepository.find(
      {relations: ['billItems'],
        order: {
          generatedDate: "DESC"
        }}
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

  async receiveBill(response: any) {
    console.log(response);
    const parsedData = await parseStringPromise(response);

    // Access the parsed XML structure
    const billId =
      parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.BillId?.[0];
    const controlNumber =
      parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.PayCntrNum?.[0];
    const trxSts =
      parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.TrxSts?.[0];
    const trxStsCode =
      parsedData?.Gepg?.gepgBillSubResp?.[0]?.BillTrxInf?.[0]?.TrxStsCode?.[0];
    const signature = parsedData?.Gepg?.gepgSignature?.[0];

    console.log({ billId, controlNumber, trxSts, trxStsCode, signature });

    // saving  bill update
    const bill = await this.billRepository.findOne({
      where: { billId: billId },
    });
    bill.billControlNumber = controlNumber;
    bill.responseCode = trxStsCode;

    await this.billRepository.save(bill);

    return '';
  }

  saveBill(bill: Bill) {
    return this.billRepository.save(bill);
  }

  findBillByControlNUmber(controlNumber: string) {
    return this.billRepository.findOne({
      where: { billControlNumber: controlNumber },
    });
  }

  findByBillId(billId: string) {
    return this.billRepository.findOne({ where: { billId: billId } });
  }

  async resendBill(billId: string) {
    console.log(billId);
    await sendBill(
      await this.findByBillId('03146c11'),
      this.billItemRepository,
    );
  }
}
