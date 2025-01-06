import { Injectable } from '@nestjs/common';
import { ApplicationRegister } from './entities/application-register.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateApplicationRegisterDto } from './dto/create-application-register.dto';
import { CommonSetup } from '../../settings/common-setup/entities/common-setup.entity';
import { Party } from '../../settings/parties/entities/party.entity';
import { Bill } from '../../payment/bill/entities/bill.entity';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../auth/user/entities/user.entity';
import { Constants } from '../../utils/constants';
import { createBillItem, sendBill } from '../../utils/middle.gepg';
import { BillItem } from '../../payment/bill-item/entities/bill-item.entity';
import { processParties } from '../../utils/helper.utils';
import { Fee } from '../../settings/fees/entities/fee.entity';
import { UserContextService } from '../../auth/user/dto/user.context';

@Injectable()
export class ApplicationRegisterService {
  constructor(
    @InjectRepository(ApplicationRegister)
    private readonly applicationRepository: Repository<ApplicationRegister>,
    @InjectRepository(CommonSetup)
    private readonly CommonSetupRepository: Repository<CommonSetup>,
    @InjectRepository(Party)
    private readonly partyRepository: Repository<Party>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(BillItem)
    private readonly billItemRepository: Repository<BillItem>,
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    private readonly userContextService: UserContextService,
  ) {}

  async findAll(): Promise<ApplicationRegister[]> {
    return await this.applicationRepository.find({
      relations: [
        'appellantList',
        'respondentList',
        'applications',
        'taxes'
    ],
      order: {
        createdAt: "ASC"
      }});
  }

  async findOne(id: number): Promise<ApplicationRegister> {
    return await this.applicationRepository.findOne({
      where: { id: id },
      relations: [
        'appellantList',
        'respondentList',
        'notice',
        'taxes',
        'statusTrend',
        'billId',
        'applicationType'
      ],
    });
  }

  async create(createApplicationRegisterDto: CreateApplicationRegisterDto): Promise<ApplicationRegister> {
    console.log(createApplicationRegisterDto);

    // Initialize the application object
    const application = new ApplicationRegister();

    // Fetch tax details from the repository
    const tax = await this.fetchTax(createApplicationRegisterDto.taxes);
    if (!tax) throw new Error('Tax not found');

    // Fetch application status trend (NEW status)
    const statusTrend = await this.fetchStatusTrend('NEW');
    if (!statusTrend) throw new Error('Status Trend not found');

    // Fetch region details from the repository
    const region = await this.fetchRegion(createApplicationRegisterDto.region);



    let  applications: ApplicationRegister[] = [];


    // Process respondents
    for (const applicationsMap of createApplicationRegisterDto.applicationss) {
      let  applicationMap = JSON.parse( JSON.stringify(applicationsMap));
      const dbApplication = await this.applicationRepository.findOne({
        where: { id: applicationMap.id },
      });
      if (dbApplication) applications.push(dbApplication);
    }

    application.applications = applications

    application.taxes = tax;
    application.natureOfRequest = createApplicationRegisterDto.natureOfRequest;
    application.dateOfFilling = new Date(createApplicationRegisterDto.dateOfFilling);
    application.createdBy = this.userContextService.getUser().username;
    application.statusTrend = statusTrend;

    // Generate application number based on the latest application and region
    const latestApplication = await this.findTopApplicationById();
    const currentYear = new Date().getFullYear();
    application.applicationNo = this.generateApplicationNumber(latestApplication, currentYear, region);

    // Process appellants and respondents
    const { applicants, respondents } = await processParties(createApplicationRegisterDto, this.partyRepository);

    // Assign the parties to the application
    application.appellantList = applicants;
    application.respondentList = respondents;

    // Handle application type-specific logic (Bill creation if type is '1')
    if (createApplicationRegisterDto.applicationType === "2") {
      await this.handleBillCreation(createApplicationRegisterDto, applicants, respondents, application.applicationNo);
      return await this.applicationRepository.save(application);
    } else {
      // Save the application if no bill is required
      return await this.applicationRepository.save(application);
    }
  }

// Helper function to fetch tax data
  private async fetchTax(taxId: number) {
    return await this.CommonSetupRepository.findOne({
      where: { id: taxId },
    });
  }

// Helper function to fetch status trend (status type 'applicationStatus' and 'NEW')
  private async fetchStatusTrend(statusName: string) {
    return await this.CommonSetupRepository.findOne({
      where: { setupType: 'applicationStatus', name: statusName },
    });
  }

// Helper function to fetch region data
  private async fetchRegion(regionId: number) {
    return await this.CommonSetupRepository.findOne({
      where: { setupType: 'region', id: regionId },
    });
  }


// Helper function to handle bill creation
  private async handleBillCreation(createApplicationRegisterDto: CreateApplicationRegisterDto, applicants: Party[], respondents: Party[], applicationNo: string) {
    // Step 1: Create the bill

    const fee = await this.feeRepository.findOne({
      where: { type: "APPLICATION" },
      relations: ['gfs'],
    });


    const bill = await this.createBill(createApplicationRegisterDto, respondents, applicants, applicationNo, fee);


    // Step 2: Create the bill item
    await createBillItem(bill, "fee for "+ applicationNo, this.billItemRepository, fee, "APPLICATION");

    // Step 3: Send bill to GEPG and create notice if successful
    const isBillSent = await sendBill(bill, this.billItemRepository);
    if (!isBillSent) {
      throw new Error('Failed to send bill to GEPG');
    }
  }


  async update(id: number,  createApplicationDto: Partial<CreateApplicationRegisterDto>): Promise<ApplicationRegister> {

    const  application = await this.applicationRepository.findOne({where: {id}});
    if (!application) {
      throw new Error('Application not found');
    }
    await this.applicationRepository.update(id, application);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.applicationRepository.delete(id);
  }


  // Method to find the top (latest) notice by the highest ID
  async findTopApplicationById(): Promise<ApplicationRegister> {
    return this.applicationRepository
      .createQueryBuilder('application_register')
      .orderBy('application_register.id', 'DESC')  // Sort by 'noticeId' in descending order
      .limit(1) // Only return the first (top) result
      .getOne();
  }


  private generateApplicationNumber(latestApplication: ApplicationRegister | null, currentYear: number, region:CommonSetup): string {
    if (!latestApplication) {
      return `${region.name}.1/${currentYear}`;
    }

    const [currentApplicationNo , year] = latestApplication.applicationNo.split('/');
    if (parseInt(year, 10) === currentYear) {
      return `${region.name}.${parseInt(currentApplicationNo.split(".")[1], 10) + 1}/${currentYear}`;
    } else {
      return `${region.name}.1/${currentYear}`;
    }
  }


  async createBill(createApplicationRegisterDto: CreateApplicationRegisterDto,
                   respondents: Party[], applicants: Party[], applicationNo: string,fee: Fee) {
    const bill = new Bill();
    bill.billedAmount = fee.amount;
    bill.status = 'PENDING';
    bill.generatedDate = new Date();
    bill.appType = 'APPLICATION';
    bill.billDescription = `Application Bill For ${applicationNo}`;
    bill.billReference = applicationNo;
    bill.billControlNumber = '0';
    bill.billPayed = false;
    bill.billEquivalentAmount = fee.amount;
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
