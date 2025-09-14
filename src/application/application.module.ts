import { Module } from '@nestjs/common';
import { AdminApplicationModule } from './admin/admin-application.module';
import { MemberApplicationModule } from './member/member-application.module';
import { AuthApplicationModule } from './auth/auth-application.module';

@Module({
  imports: [
    AdminApplicationModule,
    MemberApplicationModule,
    AuthApplicationModule,
  ],
  exports: [
    AdminApplicationModule,
    MemberApplicationModule,
    AuthApplicationModule,
  ],
})
export class ApplicationModule {}