import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';
import { AppealFilterDto } from './dto/appeal.filter.dto';
import { Appeal } from './entities/appeal.entity';
import { formatDate } from '../../utils/helper.utils';
import { BillService } from '../../payment/bill/bill.service';
import { NoticeService } from '../notice/notice.service';
import { CommonSetupService } from '../../settings/common-setup/common-setup.service';
import { PartiesService } from '../../settings/parties/parties.service';
import { Party } from '../../settings/parties/entities/party.entity';

@Controller('appeals')
export class AppealsController {
  constructor(private readonly appealsService: AppealsService,
              private  readonly billService: BillService,
              private readonly  noticeService: NoticeService,
              private readonly commonSetupService: CommonSetupService,
              private readonly partyService: PartiesService) {}

  @Post()
  create(@Body() createAppealDto: CreateAppealDto) {
    return this.appealsService.create(createAppealDto);
  }

  @Get()
  findAll() {
    return this.appealsService.findAll();
  }

  @Get('/appeal/:id')
  findOne(@Param('id') id: string) {
    return this.appealsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppealDto: UpdateAppealDto) {
    return this.appealsService.update(+id, updateAppealDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appealsService.remove(+id);
  }

  @Get("/top-appellant")
  getTopAppellant(){
    return this.appealsService.getTopAppellants();
  }


  @Get("/card-details")
  getCardDetails(){
    return this.appealsService.getCardsStatistics();
  }

  @Get("/yearly-cases")
  getYearlyCases(){
    return this.appealsService.getCaseSummary();
  }

  @Get('/filter')
  async filterAppeals(@Query() filters: AppealFilterDto) {
    return this.appealsService.filterAppeals(filters);
  }

  @Post("/import")
  importAppeals() {

    const csv = require('csv-parser');
    const fs = require('fs');
    const rows = [];
    const appeals = []; // Initialize an array to store unique name

    // Step 1: Read all rows into memory and collect unique names directly into the array
    fs.createReadStream('/Users/amtz/gepg/new_gepg/nest/appeals_with_headers.csv')
      .pipe(csv())
      .on('data', async (row) => {
        if(row.appeal_no.split("/")[1] == "2024"){
          console.log(row.appeal_no);
          console.log(row.date_of_filling);
          console.log(row.decided_date);

          const appeal = new Appeal();
          const parties = [];
          const  appeals = [];
          appeal.appealNo = row.appeal_no;


          appeal.dateOfFilling = new Date(formatDate(row.date_of_filling));

          if(row.decided_date !="null"){
            appeal.dateOfDecision = new Date(formatDate(row.decided_date));
          }

          appeal.financialYear = row.financial_year;
          appeal.natureOfRequest = row.nature_of_appeal
          appeal.assNo = row.ass_no
          appeal.billNo = row.bill_no
          appeal.remarks = row.remarks
          appeal.taxedOff = row.taxed_off


          console.log(row.appellant_name.trim().toUpperCase())
          let party: Party;
          if(row.appellant_name === "COMMISSIONER GENERAL"){
            party = await this.partyService.findOne(3)
          }else {
            party = await this.partyService.getBusinessByName(row.appellant_name.trim().toUpperCase())
          }

          console.log(party)
          parties.push(party)
          appeal.appellantList = parties


          if(!row.bill.empty){
            appeal.billId = await this.billService.findByBillId(row.bill);
          }

          if(row.notice_number !="NOTICENO"){
            appeal.notice = await  this.noticeService.findByNoticeNo(row.notice_number)
          }else{
            appeal.notice = null;
          }


          if(!Number.isInteger(row.status_trend)){
            appeal.statusTrend = await this.commonSetupService.findOne(20)
          }else {
            appeal.statusTrend = await this.commonSetupService.findOne(row.tax_id)
          }
          appeal.taxes =  await this.commonSetupService.findOne( row.tax_id)


          console.log("saved" + appeal.appealNo)
          appeals.push(await this.appealsService.save(appeal) );
          // party.appellantList =  appeals
          // await this.partyService.save(party)
          // console.log("party saved" + party.name)


        }
      })

  }

}
