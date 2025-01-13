import { Body, Controller, Get, Post } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { BillService } from '../../payment/bill/bill.service';
import { CreateNoticeHigh } from './dto/create-notice-high';

@Controller('notices-high')
export class NoticeHighController {

  constructor(private readonly noticeService: NoticeService,
              private readonly billService: BillService,) {
  }


  @Get()
  findAll() {
    return this.noticeService.findAllNoticeHigh();
  }

  @Post()
  create(@Body() createNoticeHigh: CreateNoticeHigh) {
    return this.noticeService.saveHighCourtNotice(createNoticeHigh);

  }
}