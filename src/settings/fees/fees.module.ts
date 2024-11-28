import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fee } from './entities/fee.entity';
import { CommonSetup } from '../common-setup/entities/common-setup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fee, CommonSetup])],
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}
