import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';
import { Appeal } from './entities/appeal.entity';
import { CommonSetup } from '../../settings/common-setup/entities/common-setup.entity';
import { Notice } from '../notice/entities/notice.entity';
import { AppealAmount } from './entities/appeal.amount';
import { Party } from '../../settings/parties/entities/party.entity';
import { processParties } from '../../utils/helper.utils';;
import { Bill } from '../../payment/bill/entities/bill.entity';
import { Constants } from '../../utils/constants';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../auth/user/entities/user.entity';
import { CreateApplicationRegisterDto } from '../application-register/dto/create-application-register.dto';
import { createBillItem, sendBill } from '../../utils/middle.gepg';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';

@Injectable()
export class AppealsService {
  constructor(
    @InjectRepository(Appeal)
    private readonly appealRepository: Repository<Appeal>,
    @InjectRepository(CommonSetup)
    private readonly commonSetupRepository: Repository<CommonSetup>,
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Party)
    private readonly partyRepository: Repository<Party>,
    @InjectRepository(CommonSetup)
    private readonly CommonSetupRepository: Repository<CommonSetup>,
    @InjectRepository(User)
    private readonly  userRepository: Repository<User>,
    @InjectRepository(Bill)
    private readonly  billRepository: Repository<Bill>,
    @InjectRepository(BillItem)
    private readonly  billItemRepository: Repository<BillItem>,
  ) {}

  async create(createAppealDto: CreateAppealDto): Promise<Appeal> {


    console.log(createAppealDto);
    const appeal = new Appeal();

    // Fetching dependent entities with error handling
    const [statusTrend, tax, notice] = await Promise.all([
      this.commonSetupRepository.findOne({ where: { id: createAppealDto.statusTrend } }),
      this.commonSetupRepository.findOne({ where: { id: createAppealDto.taxes } }),
      this.noticeRepository.findOne({ where: { id: createAppealDto.notice } })
    ]);

    // Handle not found errors
    if (!statusTrend) {
      throw new NotFoundException(`Status trend with ID ${createAppealDto.statusTrend} not found`);
    }
    if (!tax) {
      throw new NotFoundException(`Tax with ID ${createAppealDto.taxes} not found`);
    }
    if (!notice) {
      throw new NotFoundException(`Notice with ID ${createAppealDto.notice} not found`);
    }

    // Set initial appeal data
    appeal.statusTrend = statusTrend;
    appeal.taxes = tax;
    appeal.createdBy = "Joel M Gaitan";
    appeal.updatedBy = "Joel M Gaitan";
    appeal.dateOfFilling = createAppealDto.dateOfFilling;
    appeal.assNo = createAppealDto.assNo;
    appeal.natureOfRequest = createAppealDto.natureOfRequest;
    appeal.bankNo = createAppealDto.bankNo;
    appeal.notice = notice;
    appeal.remarks = createAppealDto.remarks;

    // Process appellants and respondents using an external function
    const { applicants, respondents } = await processParties(createAppealDto, this.partyRepository);
    appeal.appellantList = applicants;
    appeal.respondentList = respondents;

    // Create appeal amounts
    // Assign the created appeal amounts to the appeal
    appeal.appealAmount = await Promise.all(createAppealDto.amountCurrencyList.map(async (amountList) => {
      const amount = JSON.parse(JSON.stringify(amountList)); // Create a deep copy if needed
      const appealAmount = new AppealAmount();
      appealAmount.amount = amount.amount;
      appealAmount.amountAllowed = 0;

      // Fetch the currency asynchronously
      const currency = await this.commonSetupRepository.findOne({ where: { name: amount.currency } });
      if (currency) {
        appealAmount.currency = currency;
      }

      return appealAmount;
    }));


    const region = await this.fetchRegion(createAppealDto.region);

    // Generate application number based on the latest application and region
    const latestAppeals = await this.findTopAppealById();
    const currentYear = new Date().getFullYear();
    appeal.appealNo = this.generateAppealNumber(latestAppeals, currentYear, region);



    if(notice.noticeType === "2"){
     await this.handleBillCreation(createAppealDto, applicants, respondents, appeal.appealNo);
      const newAppeal = this.appealRepository.create(appeal);
      return this.appealRepository.save(newAppeal);
    }else {
      const newAppeal = this.appealRepository.create(appeal);
      return this.appealRepository.save(newAppeal);
    }
  }

  async findAll(): Promise<Appeal[]> {
    return this.appealRepository.find({
      relations: ['notice', 'taxes', 'statusTrend', 'billId', 'appellantList', 'respondentList', 'appealAmount'],
    });
  }

  async findOne(id: number): Promise<Appeal> {
    const appeal = await this.appealRepository.findOne({
      where: { id },
      relations: ['notice', 'taxes', 'statusTrend', 'billId', 'appellantList', 'respondentList', 'appealAmount'],
    });

    if (!appeal) {
      throw new NotFoundException(`Appeal with ID ${id} not found`);
    }

    return appeal;
  }

  async update(id: number, updateAppealDto: UpdateAppealDto): Promise<Appeal> {
    const existingAppeal = await this.findOne(id);
    return this.appealRepository.save(existingAppeal);
  }

  async remove(id: number): Promise<void> {
    const appeal = await this.findOne(id);

    await this.appealRepository.remove(appeal);
  }


  private generateAppealNumber(latestAppeal: Appeal | null, currentYear: number, region: CommonSetup): string {
    if (!latestAppeal) {
      return `${region.name}.1/${currentYear}`;
    }

    const [currentAppealNo, year] = latestAppeal.appealNo.split('/');
    if (parseInt(year, 10) === currentYear) {
      return `${region.name}.${parseInt(currentAppealNo.split('.')[1], 10) + 1}/${currentYear}`;
    } else {
      return `${region.name}.1/${currentYear}`;
    }
  }

  // Method to find the top (latest) notice by the highest ID
  async findTopAppealById(): Promise<Appeal | null> {
    return this.appealRepository
      .createQueryBuilder('appeal')
      .orderBy('appeal.id', 'DESC')  // Sort by 'noticeId' in descending order
      .limit(1) // Only return the first (top) result
      .getOne();
  }


  // Helper function to fetch region data
  private async fetchRegion(regionId: number) {
    return await this.CommonSetupRepository.findOne({
      where: { setupType: 'region', id: regionId },
    });
  }




  private async handleBillCreation(createAppealDto: CreateAppealDto, applicants: Party[], respondents: Party[], applicationNo: string) {
    // Step 1: Create the bill
    const bill = await this.createBill(createAppealDto, applicants, respondents, applicationNo);

    // Step 2: Create the bill item
    await createBillItem(bill, applicationNo, this.billItemRepository);

    // Step 3: Send bill to GEPG and create notice if successful
    const isBillSent = await sendBill(bill, this.billItemRepository);
    if (!isBillSent) {
      throw new Error('Failed to send bill to GEPG');
    }
  }



  async createBill(createAppealDto: CreateAppealDto,
                   respondents: Party[], applicants: Party[],  appealNo: string) {
    const bill = new Bill();
    bill.billedAmount = 10000;
    bill.status = 'PENDING';
    bill.generatedDate = new Date();
    bill.appType = 'APPEAL';
    bill.billDescription = `Appeal Bill For Appeal No ${appealNo}`;
    bill.billReference = appealNo;
    bill.billControlNumber = '0';
    bill.billPayed = false;
    bill.billEquivalentAmount = 10000;
    bill.miscellaneousAmount = 0;
    bill.payerPhone = applicants[0].phone_number;
    bill.payerName = applicants.map(applicant => applicant.name).join(' ');
    bill.payerEmail =  Constants.REGISTER_EMAIL;
    bill.billPayType =  Constants.FULL_BILL_PAY_TYPE;
    bill.currency = "TZS"

    const uuid = uuidv4(); // Full UUID
    bill.billId = uuid.split('-')[0];


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
