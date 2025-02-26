import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';
import { AppealFilterDto } from './dto/appeal.filter.dto';
import { NoticeService } from '../notice/notice.service';
import { PartiesService } from '../../settings/parties/parties.service';
import { AuthGuard } from '../../auth/auth.guard';
import { Appeal } from './entities/appeal.entity';
import { formatDate } from '../../utils/helper.utils';
import { Party } from '../../settings/parties/entities/party.entity';
import { BillService } from '../../payment/bill/bill.service';
import { CommonSetupService } from '../../settings/common-setup/common-setup.service';

@Controller('appeals')
export class AppealsController {
  constructor(
    private readonly appealsService: AppealsService,
    private readonly noticeService: NoticeService,
    private readonly partyService: PartiesService,
    private readonly billService: BillService,
    private readonly commonSetupService: CommonSetupService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createAppealDto: CreateAppealDto) {
    return this.appealsService.create(createAppealDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.appealsService.findAll();
  }

  @Get('/appeal/:id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.appealsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppealDto: CreateAppealDto) {
    return this.appealsService.update(+id, updateAppealDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.appealsService.remove(+id);
  }

  @Get('/top-appellant')
  @UseGuards(AuthGuard)
  getTopAppellant() {
    return this.appealsService.getTopAppellants();
  }

  @Get('/card-details')
  @UseGuards(AuthGuard)
  getCardDetails() {
    return this.appealsService.getCardsStatistics();
  }

  @Get('/yearly-cases')
  @UseGuards(AuthGuard)
  getYearlyCases() {
    return this.appealsService.getCaseSummary();
  }

  @Get('/filter')
  @UseGuards(AuthGuard)
  async filterAppeals(@Query() filters: AppealFilterDto) {
    return this.appealsService.filterAppeals(filters);
  }

  @Post('/import') async importAppeals() {
    const csv = require('csv-parser');
    const fs = require('fs');
    const rows = [];
    const appeals = []; // Initialize an array to store unique name

    let i = 0;
    // Step 1: Read all rows into memory and collect unique names directly into the array
    await fs
      .createReadStream('/Users/mwendavano/trat/register.csv')
      .pipe(csv())
      .on('data', async (row) => {
        i++;
        if (row.appeal_no.trim().split('/')[1] == '2019') {
          console.log(row.appeal_no.trim());
          // const parties = [];
          // const appeal = await this.appealsService.findByAppealNo(
          //   row.appeal_no,
          // );
          //

          // if (appeal != null) {
          //   if (row.respondent_name === 'COMMISSIONER GENERAL') {
          //     const party = await this.partyService.findOne(3);
          //     parties.push(party);
          //     appeal.respondentList = parties;
          //     await this.appealsService.save(appeal);
          //   } else {
          //     if (row.respondent_name === 'NONOTICE') {
          //       console.log(row.notice_number);
          //       const notice = await this.noticeService.findByNoticeNo(
          //         row.notice_number,
          //       );
          //       const party = await this.partyService.getBusinessByName(
          //         notice.respondentFullName,
          //       );
          //       parties.push(party);
          //       appeal.respondentList = parties;
          //       await this.appealsService.save(appeal);
          //     } else {
          //       const party = await this.partyService.getBusinessByName(
          //         row.respondent_name.trim().toUpperCase(),
          //       );
          //       parties.push(party);
          //       appeal.respondentList = parties;
          //       await this.appealsService.save(appeal);
          //     }
          //   }
          // }

          const checkAppeal = await this.appealsService.findByAppealNo(
            row.appeal_no.trim(),
          );

          if (!checkAppeal) {
            console.log('not found' + row.appeal_no.trim());
            const appeal = new Appeal();
            const parties = [];
            const appeals = [];
            appeal.appealNo = row.appeal_no.trim();

            //
            if (row.date_of_filling) {
              appeal.dateOfFilling = new Date(
                formatDate(row.date_of_filling.trimEnd()),
              );
            } else {
              appeal.dateOfFilling = formatDate('01/01/2019');
            }

            console.log('formatted ' + row.date_of_filling);
            //
            if (row.decided_date != 'null') {
              appeal.dateOfDecision = formatDate(row.decided_date);
              appeal.remarks = '';
            } else {
              appeal.dateOfDecision = null;
            }
            //
            appeal.financialYear = '2018/2019';
            appeal.natureOfRequest = 'nan';
            appeal.assNo = row.ass_no;
            appeal.billNo = row.bill_no;
            appeal.remarks = row.remarks;
            appeal.taxedOff = row.taxed_off;
            //
            //
            let party: Party;
            if (row.appellant_name === 'COMMISSIONER GENERAL') {
              party = await this.partyService.findOne(3);
            } else if (row.appellant_name === 'NONOTICE') {
              console.log(row.notice_number);
              const notice = await this.noticeService.findByNoticeNo(
                row.notice_number,
              );
              console.log(notice);
              party = await this.partyService.getBusinessByName(
                notice.appellantFullName,
              );
            } else {
              party = await this.partyService.getBusinessByName(
                row.appellant_name.trim().toUpperCase(),
              );

              if (!party) {
                party = new Party();
                party.name = row.appellant_name.trim().toUpperCase();
                party.phone_number = '0789000000';
                party = await this.partyService.save(party);
              }
            }

            parties.push(party);
            appeal.appellantList = parties;
            //
            // if (!row.bill.empty) {
            //   appeal.billId = await this.billService.findByBillId(row.bill);
            // }

            // if (row.notice_number != 'NOTICENO') {
            //   appeal.notice = await this.noticeService.findByNoticeNo(
            //     row.notice_number,
            //   );
            // } else {
            //   appeal.notice = null;
            // }

            if (!Number.isInteger(row.status_trend)) {
              appeal.statusTrend = await this.commonSetupService.findOne(20);
            } else {
              appeal.statusTrend = await this.commonSetupService.findOne(
                row.tax_id,
              );
            }
            appeal.taxes = await this.commonSetupService.findOne(row.tax_id);

            console.log('saved' + appeal.appealNo);
            appeals.push(await this.appealsService.save(appeal));
            party.appellantList = appeals;
            await this.partyService.save(party);
            console.log('party saved' + party.name);
          }
        }
      });
    console.log('Total rows: ' + i);
  }
}
