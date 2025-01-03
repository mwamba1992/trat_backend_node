import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';
import { Appeal } from './entities/appeal.entity';
import { CommonSetup } from '../../settings/common-setup/entities/common-setup.entity';
import { Notice } from '../notice/entities/notice.entity';
import { AppealAmount } from './entities/appeal.amount';
import { Party } from '../../settings/parties/entities/party.entity';
import { generateDateRanges, getMonthName, processParties, TopAppellantDTO } from '../../utils/helper.utils';
import { Bill } from '../../payment/bill/entities/bill.entity';
import { Constants } from '../../utils/constants';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../auth/user/entities/user.entity';
import { createBillItem, sendBill } from '../../utils/middle.gepg';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';
import { ApplicationRegister } from '../application-register/entities/application-register.entity';
import { ProgressStatus } from './dto/appeal.status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { YearlyCases } from './entities/yearly.case';
import { AppealFilterDto } from './dto/appeal.filter.dto';
import { Fee } from '../../settings/fees/entities/fee.entity';
import { UserContextService } from '../../auth/user/dto/user.context';

;
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
    private readonly userRepository: Repository<User>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(BillItem)
    private readonly billItemRepository: Repository<BillItem>,
    @InjectRepository(ApplicationRegister)
    private readonly applicationRegisterRepository: Repository<ApplicationRegister>,
    @InjectRepository(YearlyCases)
    private readonly yearlyCasesRepository: Repository<YearlyCases>,
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    private readonly userContextService: UserContextService
  ) {
  }

  async create(createAppealDto: CreateAppealDto): Promise<Appeal> {


    console.log(createAppealDto);
    const appeal = new Appeal();

    // Fetching dependent entities with error handling
    const [statusTrend, tax, notice] = await Promise.all([
      this.commonSetupRepository.findOne({ where: { setupType: "appealStatus", name: "NEW"} }),
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


    appeal.createdBy = this.userContextService.getUser().username;
    appeal.updatedBy = this.userContextService.getUser().username;
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
    appeal.trabAppeals = createAppealDto.applicationss

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


    if (notice.noticeType === "2") {
      await this.handleBillCreation(createAppealDto, applicants, respondents, appeal.appealNo);
      const newAppeal = this.appealRepository.create(appeal);
      return this.appealRepository.save(newAppeal);
    } else {
      const newAppeal = this.appealRepository.create(appeal);
      return this.appealRepository.save(newAppeal);
    }
  }

  async findAll(): Promise<Appeal[]> {
    return this.appealRepository.find({
      relations: ['notice', 'taxes', 'statusTrend', 'billId', 'appellantList', 'respondentList', 'appealAmount'],
      order: {
        createdAt: "ASC"
      }
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


    const fee = await this.feeRepository.findOne({ where: {  revenueName: "APPEAL" } });

    // Step 2: Create the bill item
    await createBillItem(bill, "fee for appeal" + applicationNo, this.billItemRepository,fee, "APPEAL");

    // Step 3: Send bill to GEPG and create notice if successful
    const isBillSent = await sendBill(bill, this.billItemRepository);
    if (!isBillSent) {
      throw new Error('Failed to send bill to GEPG');
    }
  }


  async createBill(createAppealDto: CreateAppealDto,
                   respondents: Party[], applicants: Party[], appealNo: string) {
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
    bill.payerEmail = Constants.REGISTER_EMAIL;
    bill.billPayType = Constants.FULL_BILL_PAY_TYPE;
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


  // Method to get top 5 appellants with appeal counts
  async getTopAppellants(): Promise<TopAppellantDTO[]> {
    const result = await this.partyRepository
      .createQueryBuilder('party') // Alias for the Party entity (if you need party fields later)
      .innerJoin(
        'appeal_appellant_list_party', // The join table containing party and appeal IDs
        'join', // Alias for the join table
        'party.id = join.partyId' // Join condition between Party and the join table
      )
      .select('join.partyId', 'partyId')  // Select the partyId from the join table
      .addSelect('COUNT(join.appealId)', 'appealCount')  // Count the number of appeals for each party
      .groupBy('join.partyId') // Group by partyId
      .orderBy('COUNT(join.appealId)', 'DESC') // Order by the count in descending order
      .limit(5) // Limit to top 5 parties
      .getRawMany();  // Fetch raw data

    // loop to get id, name , count
    return await Promise.all(result.map(async (item) => {
      const party = await this.partyRepository.findOne({ where: { id: item.partyId } });
      const topAppellant = new TopAppellantDTO();
      topAppellant.id = item.partyId;
      topAppellant.name = party.name;
      topAppellant.appealCount = item.appealCount;
      return topAppellant;
    }));
  }

  async getCardsStatistics() {
    const filledAppeals = await this.appealRepository.find();
    const pendingAppeals = await this.appealRepository.find({ where: { progressStatus: Not(ProgressStatus.DECIDED) } });
    const resolvedAppeals = await this.appealRepository.find({ where: { progressStatus: ProgressStatus.DECIDED } });
    const filledApplication = await this.applicationRegisterRepository.find();
    const filledAppealsCount = filledAppeals.length;
    const pendingAppealsCount = pendingAppeals.length;
    const resolvedAppealsCount = resolvedAppeals.length;
    const filledApplicationCount = filledApplication.length;

    return [
      filledAppealsCount,
      pendingAppealsCount,
      resolvedAppealsCount,
      filledApplicationCount
    ]

  }


  @Cron('*/30 * * * *')  // This runs the cron job every 2 minutes/ Run every 30 minutes
  async updateYearlyCases() {

    try {
      console.log('######## inside updating new cases ##########');

      const status = ['new', 'decided', 'pending'];
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const formatter = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });


      const dateRanges = generateDateRanges(currentYear);


      // Loop through status to fetch and update data
      for (const st of status) {
        const yearlyCases = new YearlyCases();
        yearlyCases.id = st;

        for (let i = 0; i < 12; i++) {
          const { startDate, endDate } = dateRanges[i]; // Date range for the month

          let count = 0;
          if (st === 'new') {
            const appeals = await this.appealRepository.find({
              where: {
                createdAt: Between(startDate, endDate),  // $gte for startDate// $lt for endDate
                progressStatus: Not(ProgressStatus.DECIDED) || Not(ProgressStatus.CONCLUDED) || Not(ProgressStatus.HEARING)
              }
            });
            count = appeals.length;
          } else if (st === 'decided') {
            const appeals = await this.appealRepository.find({
              where: {
                dateOfDecision: Between(startDate, endDate),  // $gte for startDate// $lt for endDate
                progressStatus: ProgressStatus.DECIDED
              }
            });
            count = appeals.length;
          } else if (st === 'pending') {
            const appeals = await this.appealRepository.find({
              where: {
                createdAt: Between(startDate, endDate),  // $gte for startDate// $lt for endDate
                progressStatus: ProgressStatus.PENDING
              }
            });
          }


          // Set the monthly count

          if (i == 0) {
            yearlyCases.jan = count
          }
          if (i == 1) {
            yearlyCases.feb = count
          }
          if (i == 2) {
            yearlyCases.mar = count;
          }
          if (i == 3) {
            yearlyCases.apr = count;
          }
          if (i == 4) {
            yearlyCases.may = count;
          }
          if (i == 5) {
            yearlyCases.jun = count;
          }
          if (i == 6) {
            yearlyCases.jul = count;
          }
          if (i == 7) {
            yearlyCases.aug = count;
          }
          if (i == 8) {
            yearlyCases.sep = count;
          }
          if (i == 9) {
            yearlyCases.oct = count;
          }
          if (i == 10) {
            yearlyCases.nov = count;
          }
          if (i == 11) {
            yearlyCases.dec = count;
          }

        }

        // Save or update the yearly cases
        const existingRecord = await this.yearlyCasesRepository.findOne({
          where: { id: st }
        });
        if (existingRecord) {
          // Update existing record
          Object.assign(existingRecord, yearlyCases);
          await this.yearlyCasesRepository.save(existingRecord);
        } else {
          // Create new record
          await this.yearlyCasesRepository.save(yearlyCases);
        }
      }
    } catch (Exception) {
      console.log('Error updating yearly cases', Exception);
    }
  }


  getMonthName(index: number) {
    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    return monthNames[index];
  }

  async getCaseSummary(): Promise<any> {
    const yearlyCases = await this.yearlyCasesRepository.find();  // Get all YearlyCases from DB

    const finishList = [];

    for (const cases of yearlyCases) {
      const data = [
        cases.jan,
        cases.feb,
        cases.mar,
        cases.apr,
        cases.may,
        cases.jun,
        cases.jul,
        cases.aug,
        cases.sep,
        cases.oct,
        cases.nov,
        cases.dec,
      ];

      const map = { [cases.id.toUpperCase()]: data };
      finishList.push(map);
    }


    return finishList; // Returning the case summary
  }


  async filterAppeals(filters: AppealFilterDto): Promise<Appeal[]> {
    // Create a query builder for the
    console.log(filters);
    const queryBuilder = this.appealRepository.createQueryBuilder('appeal');

    queryBuilder
      .leftJoinAndSelect('appeal.appellantList', 'appellantList')
      .leftJoinAndSelect('appeal.respondentList', 'respondentList')
      .leftJoinAndSelect('appeal.notice', 'notice')
      .leftJoinAndSelect('appeal.taxes', 'taxes')
      .leftJoinAndSelect('appeal.statusTrend', 'statusTrend')
      .leftJoinAndSelect('appeal.billId', 'billId')
      .leftJoinAndSelect('appeal.appealAmount', 'appealAmount')
      .leftJoinAndSelect('appealAmount.currency', 'currency');


    // Filter by date range for filing
    if (filters.dateOfFillingFrom) {
      queryBuilder.andWhere('appeal.dateOfFilling >= :dateOfFillingFrom', { dateOfFillingFrom: filters.dateOfFillingFrom });
    }
    if (filters.dateOfFillingTo) {
      queryBuilder.andWhere('appeal.dateOfFilling <= :dateOfFillingTo', { dateOfFillingTo: filters.dateOfFillingTo });
    }

    // Filter by date range for decision
    if (filters.dateOfDecisionFrom) {
      queryBuilder.andWhere('appeal.dateOfDecision >= :dateOfDecisionFrom', { dateOfDecisionFrom: filters.dateOfDecisionFrom });
    }
    if (filters.dateOfDecisionTo) {
      queryBuilder.andWhere('appeal.dateOfDecision <= :dateOfDecisionTo', { dateOfDecisionTo: filters.dateOfDecisionTo });
    }

    // Filter by progress status
    if (filters.progressStatus) {
      queryBuilder.andWhere('appeal.progressStatus = :progressStatus', { progressStatus: filters.progressStatus });
    }
    // Filter by appellant list (match by appellant ID)
    if (filters.appellantList && filters.appellantList) {
      queryBuilder.andWhere('appellantList.id = :appellantId', {
        appellantId: filters.appellantList,
      });
    }

    if (filters.respondentList && filters.respondentList) {
      queryBuilder.andWhere('respondentList.id = :respondentId', {
        respondentId: filters.respondentList,
      });
    }


    console.log(queryBuilder.getQuery());
    // Execute the query and return filtered results
    return await queryBuilder.getMany();
  }

  save(appeal: Appeal){
    return this.appealRepository.save(appeal);
  }
}
