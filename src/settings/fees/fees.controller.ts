import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeDto } from './dto/create-fee.dto';

@Controller('fees')
export class FeesController {
  constructor(private readonly feeService: FeesService) {}

  // Create a new Fee
  @Post()
  async create(@Body() createFeeDto: CreateFeeDto) {
    return this.feeService.create(createFeeDto);
  }

  // Get all Fees
  @Get()
  async findAll() {
    return this.feeService.findAll();
  }

  // Get a Fee by ID
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.feeService.findById(id);
  }

  // Update a Fee by ID
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateFeeDto: CreateFeeDto) {
    return this.feeService.update(id, updateFeeDto);
  }

  // Delete a Fee by ID
  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.feeService.remove(id);
  }

  /**
   * Approve a fee and make it active.
   */
  @Patch('approve/:id')
  async approveFee(@Param('id') id: number) {
    try {
      const fee = await this.feeService.approve(id);
      return { message: 'Fee approved successfully.', data: fee };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
