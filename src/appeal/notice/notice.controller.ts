import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { Notice } from './entities/notice.entity';
import { formatDate } from '../../utils/helper.utils';
import { BillService } from '../../payment/bill/bill.service';

@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService,
              private readonly billService: BillService,) {
  }

  @Post()
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticeService.create(createNoticeDto);
  }

  @Get()
  findAll() {
    return this.noticeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNoticeDto: CreateNoticeDto) {
    return this.noticeService.update(+id, updateNoticeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticeService.remove(+id);
  }

  @Post("/import")
  importNotice() {
    console.log("Importing notices from CSV file");

    const csv = require('csv-parser')
    const fs = require('fs')
    const results = [];

    fs.createReadStream('/Users/amtz/gepg/new_gepg/nest/notice_edited.csv')
      .pipe(csv())
      .on('data', async (row) => {
        const notice = new Notice();
        notice.noticeNo = row.noticeNo;
        notice.noticeType = row.noticeType;
        notice.appellantFullName = row.applicant;
        notice.respondentFullName = row.respondent;
        notice.createdAt = new Date(formatDate(row.date));

        console.log(row.billId);

        if(row.bill) {
          notice.bill = await this.billService.findByBillId(row.bill);
        }else{
          notice.bill = null;
        }
        notice.financialYear = row.financialYear;
        notice.noticeType = row.noticeType;
        notice.appellantPhone = row.phone;
        notice.respondentPhone = row.phone2;


        if(await this.noticeService.findByNoticeNo(notice.noticeNo) === null){
       await this.noticeService.save(notice);
       console.log("Notice saved" + notice.noticeNo);
        }


      })
  }
}
