import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApplicationRegisterService } from './application-register.service';
import { CreateApplicationRegisterDto } from './dto/create-application-register.dto';



@Controller('application-register')
export class ApplicationRegisterController {
  constructor(private readonly applicationRegisterService: ApplicationRegisterService) {}

  @Post()
  create(@Body() createApplicationRegisterDto: CreateApplicationRegisterDto) {
    return this.applicationRegisterService.create(createApplicationRegisterDto);
  }

  @Get()
  findAll() {
    return this.applicationRegisterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationRegisterService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApplicationRegisterDto: CreateApplicationRegisterDto) {
    return this.applicationRegisterService.update(+id, updateApplicationRegisterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationRegisterService.remove(+id);
  }
}
