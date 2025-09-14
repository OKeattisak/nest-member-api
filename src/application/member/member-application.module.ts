import { Module } from '@nestjs/common';
import { DomainsModule } from '../../domains/domains.module';
import { GetMemberProfileUseCase } from './use-cases/get-member-profile.use-case';
import { UpdateMemberProfileUseCase } from './use-cases/update-member-profile.use-case';
import { GetMemberPointsUseCase } from './use-cases/get-member-points.use-case';
import { ExchangePrivilegeUseCase } from './use-cases/exchange-privilege.use-case';
import { GetMemberPrivilegesUseCase } from './use-cases/get-member-privileges.use-case';
import { GetAvailablePrivilegesUseCase } from './use-cases/get-available-privileges.use-case';

@Module({
  imports: [DomainsModule],
  providers: [
    GetMemberProfileUseCase,
    UpdateMemberProfileUseCase,
    GetMemberPointsUseCase,
    ExchangePrivilegeUseCase,
    GetMemberPrivilegesUseCase,
    GetAvailablePrivilegesUseCase,
  ],
  exports: [
    GetMemberProfileUseCase,
    UpdateMemberProfileUseCase,
    GetMemberPointsUseCase,
    ExchangePrivilegeUseCase,
    GetMemberPrivilegesUseCase,
    GetAvailablePrivilegesUseCase,
  ],
})
export class MemberApplicationModule {}