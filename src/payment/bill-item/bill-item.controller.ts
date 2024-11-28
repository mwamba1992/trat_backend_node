import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BillItemService } from './bill-item.service';
import { CreateBillItemDto } from './dto/create-bill-item.dto';
import { UpdateBillItemDto } from './dto/update-bill-item.dto';

@Controller('bill-item')
export class BillItemController {
  constructor(private readonly billItemService: BillItemService) {}

  @Post()
  create(@Body() createBillItemDto: CreateBillItemDto) {
    return this.billItemService.create(createBillItemDto);
  }

  @Get()
  findAll() {
    return this.billItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billItemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBillItemDto: UpdateBillItemDto) {
    return this.billItemService.update(+id, updateBillItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billItemService.remove(+id);
  }
}
