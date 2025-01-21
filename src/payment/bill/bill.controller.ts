import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BillService } from './bill.service';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillCreateDTO } from './dto/create-bill.dto';
import csvParser from 'csv-parser';
import * as fs from 'fs';
import { Bill } from './entities/bill.entity';
import { formatDate } from '../../utils/helper.utils';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('bills')
export class BillController {
  constructor(
    private readonly billService: BillService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createBillDto: BillCreateDTO) {
    console.log(createBillDto);
    return this.billService.create(createBillDto);
  }


  @Post("/receive-bill")
  receiveBill(@Body() receiveBillDto: string) {
    return this.billService.receiveBill(receiveBillDto);
  }

  @Get()
  findAll() {
    return this.billService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billService.update(+id, updateBillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billService.remove(+id);
  }


  @Post("/import")
  importBill() {
    console.log("Importing bills from CSV file");

    const csv = require('csv-parser')
    const fs = require('fs')
    const results = [];

    fs.createReadStream('/Users/amtz/gepg/new_gepg/nest/bill_edited.csv')
      .pipe(csv())
      .on('data', async (row) => {


        // Map CSV rows to Bill entity
        const bill = new Bill();
        bill.billId = row['billId'];
        bill.appType = row['appType'];
        bill.createdByUser = row['createdBy'];  // Ensure user is resolved if needed
        bill.billDescription = row['billDescription'];
        bill.billedAmount = parseFloat(row['billedAmount']);
        bill.billReference = row['reference'];
        bill.billControlNumber = row['controlNumber'];
        bill.billEquivalentAmount = parseFloat(row['billEqvAmount']);
        bill.currency = row['currency'];
        bill.miscellaneousAmount = parseFloat(row['miscAmount']);


        bill.expiryDate = new Date(formatDate(row['expiryDate']))
        bill.generatedDate = new Date(formatDate(row['createdDate']));
        bill.payerEmail = row['email'];
        bill.payerName = row['payerName'];
        bill.payerPhone = row['phoneNumber'];
        bill.financialYear = row['financialYear'];
        bill.responseCode = row['responseCode'];

        console.log(bill);

        if(await this.billService.findBillByControlNUmber(bill.billControlNumber) === null)
          {
            await this.billService.saveBill(bill);
          }

      })
      .on('end', () => {

      });
  }

  @Post("/resend-bill")
  resendBill(@Body() resendBillDto: string) {
    return this.billService.resendBill(resendBillDto);
  }
}
