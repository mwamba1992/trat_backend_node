import { Module } from '@nestjs/common';
import { CommonSetupModule } from './common-setup/common-setup.module';
import { JudgesModule } from './judges/judges.module';
import { PartiesModule } from './parties/parties.module';
import { FeesModule } from './fees/fees.module';

@Module({
  imports: [CommonSetupModule, JudgesModule, PartiesModule, FeesModule]
})
export class SettingsModule {}
