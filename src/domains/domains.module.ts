import { Module } from '@nestjs/common';
import { PointModule } from './point/point.module';
import { MemberModule } from './member/member.module';
import { PrivilegeModule } from './privilege/privilege.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    PointModule,
    MemberModule,
    PrivilegeModule,
    AdminModule,
    AuditModule,
  ],
  exports: [
    PointModule,
    MemberModule,
    PrivilegeModule,
    AdminModule,
    AuditModule,
  ],
})
export class DomainsModule {}