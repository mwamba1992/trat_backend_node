// summons.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SummonsService } from './summons.service';
import { Summons } from './entities/summons.entity';
import { CreateSummonsDto } from './dto/summons.dto';
import { SummonsFilterDto } from "./dto/summons.filter.dto";

@Controller('summons')
export class SummonsController {
  constructor(private readonly summonsService: SummonsService) {}

  // Get all summons
  @Get()
  async findAll(): Promise<Summons[]> {
    return this.summonsService.findAll();
  }

  // Get summons by ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Summons> {
    return this.summonsService.findOne(id);
  }

  // Create a new summons
  @Post()
  async create(@Body() createSummonsDto: CreateSummonsDto): Promise<Summons> {
    return this.summonsService.create(createSummonsDto);
  }

  // Update an existing summons
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSummonsDto: CreateSummonsDto,
  ): Promise<Summons> {
    return this.summonsService.update(id, updateSummonsDto);
  }

  // Delete summons
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.summonsService.remove(id);
  }

  @Put(':id/conclude')
  async conclude(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ): Promise<any> {
    return this.summonsService.concludeSummons(id, data);
  }
  @Post('/filter')
  async filterSummons(@Body() filterDto: SummonsFilterDto): Promise<Summons[]> {
    return this.summonsService.filterSummons(filterDto);
  }
}
