import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommonSetupService } from './common-setup.service';
import { CreateCommonSetupDto } from './dto/create-common-setup.dto';


@Controller('common-setup')
export class CommonSetupController {
  constructor(private readonly setupService: CommonSetupService) {}

  @Post(':type')
  create(@Param('type', ) type: string , @Body() createSetupDto: CreateCommonSetupDto) {
    return this.setupService.create(createSetupDto, type);
  }


  @Get("/type/:type")
  findAll(@Param('type') type: string) {
    return this.setupService.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.setupService.findOne(+id);
  }

  @Patch('/:type/:id')
  update(@Param('id') id: string, @Body() updateSetupDto: CreateCommonSetupDto) {
    return this.setupService.update(+id, updateSetupDto);
  }

  @Delete('/:type/:id')
  remove(@Param('id') id: string) {
    return this.setupService.remove(+id);
  }
}
