import { Injectable } from '@nestjs/common';
import { BaseQuery, ApplicationResult } from '../../common';
import { GetMemberDetailsRequest, MemberDetails } from '../dto/admin-member.dto';
import { MemberService } from '../../../domains/member/services/member.service';
import { PointService } from '../../../domains/point/services/point.service';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';

@Injectable()
export class GetMemberDetailsUseCase extends BaseQuery<GetMemberDetailsRequest, ApplicationResult<MemberDetails>> {
  constructor(
    private readonly memberService: MemberService,
    private readonly pointService: PointService,
    private readonly privilegeService: PrivilegeService,
  ) {
    super();
  }

  async execute(request: GetMemberDetailsRequest): Promise<ApplicationResult<MemberDetails>> {
    try {
      // 1. Get member details
      const member = await this.memberService.getMemberById(request.memberId);

      // 2. Get point balance and transactions
      const pointBalance = await this.pointService.getPointBalance(request.memberId);
      const pointHistory = await this.pointService.getPointHistory(request.memberId, { page: 1, limit: 50 });

      // 3. Get member privileges
      const memberPrivileges = await this.privilegeService.getMemberPrivileges(request.memberId);

      // 4. Transform data to match DTO
      const pointTransactions = pointHistory.data.map(t => ({
        id: t.id,
        type: t.type as 'EARNED' | 'SPENT' | 'EXPIRED' | 'ADJUSTED',
        amount: t.signedAmount,
        description: t.description,
        createdAt: t.createdAt,
      }));

      const privileges = memberPrivileges.map(p => ({
        id: p.id,
        privilegeName: p.privilegeName,
        status: (p.isExpired ? 'EXPIRED' : p.isActive ? 'ACTIVE' : 'USED') as 'EXPIRED' | 'ACTIVE' | 'USED',
        exchangedAt: p.grantedAt,
      }));

      // 5. Return detailed response
      return ApplicationResult.success({
        id: member.id,
        email: member.email,
        name: `${member.firstName} ${member.lastName}`,
        phone: undefined, // Not available in current member entity
        dateOfBirth: undefined, // Not available in current member entity
        totalPoints: pointBalance.totalEarned,
        availablePoints: pointBalance.availableBalance,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        lastLoginAt: undefined, // Not available in current member entity
        pointTransactions,
        privileges,
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'GET_MEMBER_DETAILS_FAILED'
      );
    }
  }
}