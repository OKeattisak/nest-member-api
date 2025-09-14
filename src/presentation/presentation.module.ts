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

// Import Application Layer instead of Domain Modules directly
import { ApplicationModule } from '../application/application.module';

// Keep infrastructure modules that are still needed
import { AuthModule } from '@/infrastructure/auth/auth.module';
import { JobsModule } from '@/infrastructure/jobs/jobs.module';

// Keep some domain modules for controllers that haven't been updated yet
import { AdminModule } from '@/domains/admin/admin.module';
import { MemberModule } from '@/domains/member/member.module';
import { PointModule } from '@/domains/point/point.module';
import { PrivilegeModule } from '@/domains/privilege/privilege.module';
import { AuditModule } from '@/domains/audit/audit.module';

@Module({
  imports: [
    // Primary import: Application Layer
    ApplicationModule,
    
    // Infrastructure modules
    AuthModule,
    JobsModule,
    
    // Domain modules (for controllers not yet updated)
    AdminModule,
    MemberModule,
    PointModule,
    PrivilegeModule,
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