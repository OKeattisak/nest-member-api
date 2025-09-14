import { Module } from '@nestjs/common';
import { PrivilegeService } from './services/privilege.service';
import { PrivilegeRepository } from './repositories/privilege.repository';
import { MemberPrivilegeRepository } from './repositories/member-privilege.repository';
import { PointModule } from '@/domains/point/point.module';
import { PointService } from '@/domains/point/services/point.service';

@Module({
  imports: [PointModule],
  providers: [
    PrivilegeService,
    {
      provide: 'IPrivilegeRepository',
      useClass: PrivilegeRepository,
    },
    {
      provide: 'IMemberPrivilegeRepository',
      useClass: MemberPrivilegeRepository,
    },
    {
      provide: 'IPointService',
      useExisting: PointService,
    },
  ],
  exports: [
    PrivilegeService,
    'IPrivilegeRepository',
    'IMemberPrivilegeRepository',
  ],
})
export class PrivilegeModule {}