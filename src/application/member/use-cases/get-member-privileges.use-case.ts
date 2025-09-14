import { Injectable } from '@nestjs/common';
import { BaseQuery, ApplicationResult } from '../../common';
import { GetMemberPrivilegesRequest, MemberPrivilege } from '../dto/privilege-exchange.dto';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';
import { MemberService } from '../../../domains/member/services/member.service';

@Injectable()
export class GetMemberPrivilegesUseCase extends BaseQuery<GetMemberPrivilegesRequest, ApplicationResult<MemberPrivilege[]>> {
  constructor(
    private readonly privilegeService: PrivilegeService,
    private readonly memberService: MemberService,
  ) {
    super();
  }

  async execute(request: GetMemberPrivilegesRequest): Promise<ApplicationResult<MemberPrivilege[]>> {
    try {
      // 1. Verify member exists
      await this.memberService.getMemberById(request.memberId);

      // 2. Get member privileges based on status filter
      let memberPrivileges;
      if (request.status === 'ACTIVE') {
        memberPrivileges = await this.privilegeService.getActiveMemberPrivileges(request.memberId);
      } else {
        memberPrivileges = await this.privilegeService.getMemberPrivileges(request.memberId);
      }

      // 3. Transform to match DTO format and apply status filter
      const transformedPrivileges: MemberPrivilege[] = memberPrivileges
        .filter(mp => {
          if (!request.status) return true;
          
          // Map isActive and isExpired to status
          let status: 'ACTIVE' | 'USED' | 'EXPIRED';
          if (mp.isExpired) {
            status = 'EXPIRED';
          } else if (mp.isActive) {
            status = 'ACTIVE';
          } else {
            status = 'USED';
          }
          
          return status === request.status;
        })
        .map(mp => ({
          id: mp.id,
          privilege: {
            id: mp.privilegeId,
            name: mp.privilegeName,
            description: mp.privilegeDescription,
            category: 'General', // Default category
          },
          status: mp.isExpired ? 'EXPIRED' : mp.isActive ? 'ACTIVE' : 'USED',
          exchangedAt: mp.grantedAt,
          usedAt: undefined, // Not available in current structure
          expiresAt: mp.expiresAt,
        }));

      // 4. Return response
      return ApplicationResult.success(transformedPrivileges);
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'GET_MEMBER_PRIVILEGES_FAILED'
      );
    }
  }
}