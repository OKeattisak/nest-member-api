import { Module } from '@nestjs/common';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminJobsController } from './controllers/admin-jobs.controller';
import { AdminMemberController } from './controllers/admin-member.controller';
import { AdminPointController } from './controllers/admin-point.controller';
import { AdminPrivilegeController } from './controllers/admin-privilege.controller';
import { MemberAuthController } from './controllers/member-auth.controller';
import { MemberPointController } from './controllers/member-point.controller';
import { MemberPrivilegeController } from './controllers/member-privilege.controller';
import { MemberProfileController } from './controllers/member-profile.controller';
import { AdminModule } from '../domains/admin/admin.module';
import { MemberModule } from '../domains/member/member.module';
import { PointModule } from '../domains/point/point.module';
import { PrivilegeModule } from '../domains/privilege/privilege.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { JobsModule } from '../infrastructure/jobs/jobs.module';
import { AuditModule } from '../domains/audit/audit.module';

@Module({
  imports: [
    AdminModule,
    MemberModule,
    PointModule,
    PrivilegeModule,
    AuthModule,
    JobsModule,
    AuditModule,
  ],
  controllers: [
    AdminAuthController,
    AdminJobsController,
    AdminMemberController,
    AdminPointController,
    AdminPrivilegeController,
    MemberAuthController,
    MemberPointController,
    MemberPrivilegeController,
    MemberProfileController,
  ],
})
export class PresentationModule {}