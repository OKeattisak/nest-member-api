import { Module } from '@nestjs/common';
import { PrivilegeRepository } from './privilege.repository';
import { MemberPrivilegeRepository } from './member-privilege.repository';

@Module({
  providers: [PrivilegeRepository, MemberPrivilegeRepository],
  exports: [PrivilegeRepository, MemberPrivilegeRepository],
})
export class PrivilegeRepositoryModule {}