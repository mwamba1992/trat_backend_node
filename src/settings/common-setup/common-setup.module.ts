import { Module } from '@nestjs/common';
import { CommonSetupService } from './common-setup.service';
import { CommonSetupController } from './common-setup.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonSetup } from './entities/common-setup.entity';
import { Fee } from '../fees/entities/fee.entity';
import { UserContextService } from '../../auth/user/dto/user.context';

@Module({
  imports: [TypeOrmModule.forFeature([CommonSetup, Fee])],
  controllers: [CommonSetupController],
  providers: [CommonSetupService, UserContextService],
})
export class CommonSetupModule {}
