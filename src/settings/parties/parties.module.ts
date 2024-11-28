import { Module } from '@nestjs/common';
import { PartiesService } from './parties.service';
import { PartiesController } from './parties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity';
import { CommonSetup } from '../common-setup/entities/common-setup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Party, CommonSetup])],
  controllers: [PartiesController],
  providers: [PartiesService],
})
export class PartiesModule {}
