import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { ExchangePrivilegeRequest, ExchangePrivilegeResponse } from '../dto/privilege-exchange.dto';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';
import { MemberService } from '../../../domains/member/services/member.service';
import { PointService } from '../../../domains/point/services/point.service';

@Injectable()
export class ExchangePrivilegeUseCase extends BaseCommand<ExchangePrivilegeRequest, ApplicationResult<ExchangePrivilegeResponse>> {
  constructor(
    private readonly privilegeService: PrivilegeService,
    private readonly memberService: MemberService,
    private readonly pointService: PointService,
  ) {
    super();
  }

  async execute(request: ExchangePrivilegeRequest): Promise<ApplicationResult<ExchangePrivilegeResponse>> {
    try {
      // 1. Verify member exists
      await this.memberService.getMemberById(request.memberId);

      // 2. Execute the privilege exchange (this handles all validations internally)
      const exchangeResult = await this.privilegeService.exchangePrivilege({
        memberId: request.memberId,
        privilegeId: request.privilegeId,
      });

      // 3. Get remaining points after exchange
      const remainingPoints = await this.pointService.getAvailableBalance(request.memberId);

      // 4. Return response
      return ApplicationResult.success({
        memberPrivilegeId: exchangeResult.memberPrivilegeId,
        privilege: {
          id: request.privilegeId,
          name: exchangeResult.privilegeName,
          description: '', // Not available in exchange result
          pointsCost: exchangeResult.pointsDeducted,
        },
        exchangedAt: exchangeResult.exchangedAt,
        remainingPoints,
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'EXCHANGE_FAILED'
      );
    }
  }
}