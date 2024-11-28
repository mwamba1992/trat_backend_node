import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Fee } from './entities/fee.entity';
import { Repository } from 'typeorm';
import { CommonSetup } from '../common-setup/entities/common-setup.entity';

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(Fee)
    private feeRepository: Repository<Fee>,
    @InjectRepository(CommonSetup)
    private commonSetupService: Repository<CommonSetup>,  // Injecting the CommonSetupService
  ) {}

  // Create a new Fee
  async create(createFeeDto: CreateFeeDto): Promise<Fee> {

    console.log(createFeeDto);


    const gfs = await this.commonSetupService.findOne({
      where: { id: createFeeDto.gfsId },
    });  // Get the CommonSetup entity

    const fee = this.feeRepository.create({
      revenueName: createFeeDto.revenueName,
      amount: createFeeDto.amount,
      type: createFeeDto.type,
      gfs,  // Set the CommonSetup relationship
      active: false
    });

    return await this.feeRepository.save(fee);  // Save and return the new Fee
  }

  // Find all Fees, optionally including relations like CommonSetup
  async findAll(): Promise<Fee[]> {
    return this.feeRepository.find({ relations: ['gfs'] });  // Include the gfs relation
  }

  // Find a Fee by ID
  async findById(id: number): Promise<Fee> {
    // @ts-ignore
    return this.feeRepository.findOne(id, { relations: ['gfs'] });
  }

  // Update a Fee by ID
  async update(id: number, updateFeeDto: CreateFeeDto): Promise<Fee> {

    console.log(updateFeeDto);

    const fee = await this.feeRepository.findOne( {where: {id: id}});
    if (!fee) {
      throw new Error('Fee not found');
    }

    const gf = await this.commonSetupService.findOne({
      where: { id: updateFeeDto.gfsId },
    });

    fee.amount = updateFeeDto.amount;
    fee.revenueName = updateFeeDto.revenueName;
    fee.type = updateFeeDto.type;
    fee.gfs = gf;

    return await this.feeRepository.save(fee);
  }

  // Delete a Fee by ID
  async remove(id: number): Promise<void> {
    await this.feeRepository.delete(id);
  }



  async approve(id: number): Promise<Fee> {
    const fee = await this.feeRepository.findOne({where: {id: id}});

    if (!fee) {
      throw new NotFoundException(`Fee with ID ${id} not found.`);
    }

    if (fee.active) {
      throw new BadRequestException(`Fee with ID ${id} is already active.`);
    }

    fee.active = true; // Set the fee to active
    fee.approvedBy = "Joel M Gaitan";
    fee.approvedDate = new Date();
    return await this.feeRepository.save(fee);
  }


}
