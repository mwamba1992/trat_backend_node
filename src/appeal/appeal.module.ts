import { Module } from '@nestjs/common';
import { NoticeModule } from './notice/notice.module';
import { ApplicationRegisterModule } from './application-register/application-register.module';
import { AppealsModule } from './appeals/appeals.module';

@Module({
  imports: [NoticeModule, ApplicationRegisterModule, AppealsModule]
})
export class AppealModule {}
