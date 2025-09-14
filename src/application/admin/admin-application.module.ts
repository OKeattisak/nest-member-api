import { Module } from '@nestjs/common';
import { DomainsModule } from '../../domains/domains.module';
import { GetAllMembersUseCase } from './use-cases/get-all-members.use-case';
import { GetMemberDetailsUseCase } from './use-cases/get-member-details.use-case';
import { AdjustMemberPointsUseCase } from './use-cases/adjust-member-points.use-case';
import { CreatePrivilegeUseCase } from './use-cases/create-privilege.use-case';
import { UpdatePrivilegeUseCase } from './use-cases/update-privilege.use-case';
import { DeletePrivilegeUseCase } from './use-cases/delete-privilege.use-case';
import { GetAllPrivilegesUseCase } from './use-cases/get-all-privileges.use-case';
import { GetSystemStatsUseCase } from './use-cases/get-system-stats.use-case';

@Module({
  imports: [DomainsModule],
  providers: [
    GetAllMembersUseCase,
    GetMemberDetailsUseCase,
    AdjustMemberPointsUseCase,
    CreatePrivilegeUseCase,
    UpdatePrivilegeUseCase,
    DeletePrivilegeUseCase,
    GetAllPrivilegesUseCase,
    GetSystemStatsUseCase,
  ],
  exports: [
    GetAllMembersUseCase,
    GetMemberDetailsUseCase,
    AdjustMemberPointsUseCase,
    CreatePrivilegeUseCase,
    UpdatePrivilegeUseCase,
    DeletePrivilegeUseCase,
    GetAllPrivilegesUseCase,
    GetSystemStatsUseCase,
  ],
})
export class AdminApplicationModule {}