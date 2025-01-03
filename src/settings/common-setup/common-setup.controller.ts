import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CommonSetupService } from './common-setup.service';
import { CreateCommonSetupDto } from './dto/create-common-setup.dto';
import { AuthGuard } from '../../auth/auth.guard';


@Controller('common-setup')
export class CommonSetupController {
  constructor(private readonly setupService: CommonSetupService) {}

  @Post(':type')
  @UseGuards(AuthGuard)
  create(@Param('type', ) type: string , @Body() createSetupDto: CreateCommonSetupDto) {
    return this.setupService.create(createSetupDto, type);
  }


  @Get("/type/:type")
  @UseGuards(AuthGuard)
  findAll(@Param('type') type: string) {
    return this.setupService.findAll(type);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.setupService.findOne(+id);
  }

  @Patch('/:type/:id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateSetupDto: CreateCommonSetupDto) {
    return this.setupService.update(+id, updateSetupDto);
  }

  @Delete('/:type/:id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.setupService.remove(+id);
  }
}
