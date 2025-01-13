import { Injectable } from '@nestjs/common';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { Bill } from '../../payment/bill/entities/bill.entity';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';
import { createBillItem, sendBill } from '../../utils/middle.gepg';
import { User } from '../../auth/user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { raw } from 'express';
import { Fee } from '../../settings/fees/entities/fee.entity';
import { CreateNoticeHigh } from './dto/create-notice-high';
import { NoticeHighCourt } from './entities/notice.high.court';
import { Appeal } from '../appeals/entities/appeal.entity';

@Injectable()
export class NoticeService {

  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(BillItem)
    private readonly billItemRepository: Repository<BillItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(NoticeHighCourt)
    private readonly noticeHighCourtRepository: Repository<NoticeHighCourt>,
    @InjectRepository(Appeal)
    private readonly appealRepository: Repository<Appeal>,
  ) {}


  // Method to find the top (latest) notice by the highest ID
  async findTopNoticeById(): Promise<Notice> {
    return this.noticeRepository
      .createQueryBuilder('notice')
      .orderBy('notice.id', 'DESC')  // Sort by 'noticeId' in descending order
      .limit(1) // Only return the first (top) result
      .getOne();
  }



  // Method to create a new Notice
  async create(createNoticeDto: CreateNoticeDto): Promise<Notice> {


    console.log(createNoticeDto);
    // Find the top (latest) notice by ID
    const latestNotice = await this.findTopNoticeById();
    const currentYear = new Date().getFullYear();
    let noticeNo: string;

    // Generate notice number based on the latest notice
    noticeNo = this.generateNoticeNumber(latestNotice, currentYear);

    if (createNoticeDto.noticeType === '1') {
      return this.createNotice(createNoticeDto, noticeNo, null);
    }
    else if (createNoticeDto.noticeType === '2') {
      return this.createBillAndNotice(createNoticeDto, noticeNo);
    }
    else {
      throw new Error('Invalid notice type');
    }
  }

// Helper function to generate notice number
  private generateNoticeNumber(latestNotice: Notice | null, currentYear: number): string {
    if (!latestNotice) {
      return `1/${currentYear}`;
    }

    const [currentNoticeNo, year] = latestNotice.noticeNo.split('/');
    if (parseInt(year, 10) === currentYear) {
      return `${parseInt(currentNoticeNo, 10) + 1}/${currentYear}`;
    } else {
      return `1/${currentYear}`;
    }
  }

// Helper function to create a notice
  private async createNotice(createNoticeDto: CreateNoticeDto, noticeNo: string, bill: Bill): Promise<Notice> {
    const newNotice = this.noticeRepository.create({
      ...createNoticeDto, // Spread the DTO data
      noticeNo, // Add the generated notice number
    });

    newNotice.bill = bill;
    return await this.noticeRepository.save(newNotice);
  }

// Helper function to create bill and notice
  private async createBillAndNotice(createNoticeDto: CreateNoticeDto, noticeNo: string): Promise<Notice> {
    const fee = await this.feeRepository.findOne({
      where: {type: "NOTICE" },
      relations: ['gfs'],
    });
    // Step 1: Create the bill
    const bill = await this.createBill(noticeNo, createNoticeDto, fee);

    // Step 2: Create the bill item
    await createBillItem(bill, 'fee for notice '+ noticeNo, this.billItemRepository, fee, "NOTICE");

    // Step 3: Send bill to GEPG and create notice if successful
    const isBillSent = await sendBill(bill, this.billItemRepository);
    if (!isBillSent) {
      throw new Error('Failed to send bill to GEPG');
    }


    // Step 4: Create and save the notice
    return this.createNotice(createNoticeDto, noticeNo, bill);
  }

// Helper function to create a bill
  private async createBill(noticeNo: string, createNoticeDto: CreateNoticeDto, fee:Fee): Promise<Bill> {
    const bill = new Bill();
    bill.billedAmount = fee.amount;
    bill.status = 'PENDING';
    bill.generatedDate = new Date();
    bill.appType = 'NOTICE';
    bill.billDescription = `Notice Bill For ${noticeNo}`;
    bill.billReference = noticeNo;
    bill.billControlNumber = '0';
    bill.billPayed = false;
    bill.billEquivalentAmount = fee.amount;
    bill.miscellaneousAmount = 0;
    bill.payerPhone =  createNoticeDto.appellantPhone
    bill.payerName = createNoticeDto.appellantFullName
    bill.payerEmail = "trat@register.go.tz";
    bill.billPayType = "1";


    const uuid = uuidv4(); // Full UUID
    bill.billId =    uuid.split('-')[0];



    // Set expiry date (14 days from today)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14);
    bill.expiryDate = expiryDate;

    // Set audit fields
    bill.createdAt = new Date();
    bill.updatedAt = new Date();

    bill.createdByUser = await this.userRepository.findOne({
      where: { id: 1 },
    });

    bill.approvedBy = 'SYSTEM';
    bill.financialYear = '2024/2025';

    return await this.billRepository.save(bill);
  }

  async findAll() {
    return await this.noticeRepository.find({
      relations: ['bill'],
      order: {
        createdAt: "DESC"
      }// This tells TypeORM to also fetch the associated 'bill'
    });
  }

  findOne(id: number) {
   return this.noticeRepository.findOne({where: {id}});
  }

  findByNoticeNo(noticeNo:string){
    return this.noticeRepository.findOne({where: {noticeNo: noticeNo}});
  }


  save(notice: Notice) {
    return this.noticeRepository.save(notice);
  }

  async update(id: number, createNoticeDto: CreateNoticeDto) {
    const notice = await this.findOne(id);

    if (!notice) {
      throw new Error('Notice not found');
    }
    notice.appellantPhone = createNoticeDto.appellantPhone;
    notice.appellantFullName = createNoticeDto.appellantFullName;
    notice.respondentFullName = createNoticeDto.respondentFullName;
    notice.respondentPhone = createNoticeDto.respondentPhone;
    notice.listAppeal = createNoticeDto.listAppeal;
    notice.listApplication = createNoticeDto.listApplication;
    notice.appealAgaints = createNoticeDto.appealAgaints;
    notice.noticeType = createNoticeDto.noticeType;
   return this.noticeRepository.save(notice);
  }
  async remove(id: number) {
    const notice = await this.findOne(id);
    if (!notice) {
      throw new Error('Permission not found');
    }
    await this.noticeRepository.remove(notice);
  }

  async saveHighCourtNotice(notice: CreateNoticeHigh) {
    console.log(notice)
    const noticeHigh = new NoticeHighCourt();
    noticeHigh.appellantName = notice.appellantName;
    noticeHigh.appellantType = notice.appellantType;
    noticeHigh.respondentName = notice.respondentName;
    noticeHigh.appellantPhone = notice.appellantPhone;
    noticeHigh.listOfAppeals = [];
    for (const appealNo of notice.listOfAppeals) {
      const appeal = await this.appealRepository.findOne({
        where: {  id: Number(appealNo) }
      });

      noticeHigh.listOfAppeals.push(appeal);
    }


    const savedNotice =  await this.noticeHighCourtRepository.save(noticeHigh);


    if (notice.appellantType === "2") {

      const fee = await this.feeRepository.findOne({
        where: {type: "NOTICEHIGH" },
        relations: ['gfs'],
      });

      const bill = new Bill();
      bill.billedAmount = fee.amount;
      bill.status = 'PENDING';
      bill.generatedDate = new Date();
      bill.appType = 'NOTICEHIGH';
      bill.billDescription = `Bill For Notice of Appeals High Court For `;
      bill.billReference = noticeHigh.id+  noticeHigh.appellantName;
      bill.billControlNumber = '0';
      bill.billPayed = false;
      bill.billEquivalentAmount = fee.amount;
      bill.miscellaneousAmount = 0;
      bill.payerPhone =   noticeHigh.appellantPhone
      bill.payerName = noticeHigh.appellantName
      bill.payerEmail = "trat@register.go.tz";
      bill.billPayType = "1";


      const uuid = uuidv4(); // Full UUID
      bill.billId =    uuid.split('-')[0];



      // Set expiry date (14 days from today)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      bill.expiryDate = expiryDate;

      // Set audit fields
      bill.createdAt = new Date();
      bill.updatedAt = new Date();

      bill.createdByUser = await this.userRepository.findOne({
        where: { id: 1 },
      });

      bill.approvedBy = 'SYSTEM';
      bill.financialYear = '2024/2025';

      return await this.billRepository.save(bill);
    }

  }


  async findAllNoticeHigh(){
    return await this.noticeHighCourtRepository.find({
      relations: ['bill'],
      order: {
        createdAt: "DESC"
      }//
    });
  }
}

