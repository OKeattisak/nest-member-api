import { Module } from '@nestjs/common';
import { PointModule } from './point/point.module';
import { MemberModule } from './member/member.module';
import { PrivilegeModule } from './privilege/privilege.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PointModule,
    MemberModule,
    PrivilegeModule,
    AdminModule,
  ],
  exports: [
    PointModule,
    MemberModule,
    PrivilegeModule,
    AdminModule,
  ],
})
export class DomainsModule {}