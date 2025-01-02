import { Module } from '@nestjs/common';
import { CommonSetupModule } from './common-setup/common-setup.module';
import { JudgesModule } from './judges/judges.module';
import { PartiesModule } from './parties/parties.module';
import { FeesModule } from './fees/fees.module';
import { CommonSetup } from './common-setup/entities/common-setup.entity';

@Module({
  imports: [CommonSetupModule, JudgesModule, PartiesModule, FeesModule, CommonSetup]
})
export class SettingsModule {}
