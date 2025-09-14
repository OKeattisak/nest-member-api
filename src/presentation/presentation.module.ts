import { Module } from '@nestjs/common';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminJobsController } from './controllers/admin-jobs.controller';
import { AdminMemberController } from './controllers/admin-member.controller';
import { AdminPointController } from './controllers/admin-point.controller';
import { AdminPrivilegeController } from './controllers/admin-privilege.controller';
import { AdminModule } from '../domains/admin/admin.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { JobsModule } from '../infrastructure/jobs/jobs.module';
import { MemberService } from '../domains/member/services/member.service';
import { PointService } from '../domains/point/services/point.service';
import { PrivilegeService } from '../domains/privilege/services/privilege.service';

@Module({
  imports: [
    AdminModule,
    AuthModule,
    JobsModule,
  ],
  controllers: [
    AdminAuthController,
    AdminJobsController,
    AdminMemberController,
    AdminPointController,
    AdminPrivilegeController,
  ],
  providers: [
    // Services will be imported from their respective modules
    // These are temporary providers until proper module imports are set up
    {
      provide: MemberService,
      useValue: {}, // This will be replaced with proper injection
    },
    {
      provide: PointService,
      useValue: {}, // This will be replaced with proper injection
    },
    {
      provide: PrivilegeService,
      useValue: {}, // This will be replaced with proper injection
    },
  ],
})
export class PresentationModule {}