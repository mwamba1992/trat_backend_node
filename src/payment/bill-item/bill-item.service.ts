import { Injectable } from '@nestjs/common';
import { CreateBillItemDto } from './dto/create-bill-item.dto';
import { UpdateBillItemDto } from './dto/update-bill-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillItem } from './entities/bill-item.entity';
import { Bill } from '../bill/entities/bill.entity';

@Injectable()
export class BillItemService {


  constructor(
    @InjectRepository(BillItem)
    private readonly billItemRepository: Repository<BillItem>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
  ) {}



  create(createBillItemDto: CreateBillItemDto) {
    return 'This action adds a new billItem';
  }

  findAll() {
    return `This action returns all billItem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} billItem`;
  }

  update(id: number, updateBillItemDto: UpdateBillItemDto) {
    return `This action updates a #${id} billItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} billItem`;
  }

  async  findByBillId(billId: number): Promise<BillItem[]> {
    const bill = await this.billRepository.findOne({
      where: { id: billId },
    })
    return this.billItemRepository.find({ where: { bill: bill } });
  }
}
