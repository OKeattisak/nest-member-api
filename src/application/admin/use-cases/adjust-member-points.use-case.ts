import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { AdjustMemberPointsRequest } from '../dto/admin-member.dto';
import { MemberService } from '../../../domains/member/services/member.service';
import { PointService } from '../../../domains/point/services/point.service';
import { AuditService } from '../../../domains/audit/services/audit.service';

@Injectable()
export class AdjustMemberPointsUseCase extends BaseCommand<AdjustMemberPointsRequest, ApplicationResult<void>> {
  constructor(
    private readonly memberService: MemberService,
    private readonly pointService: PointService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async execute(request: AdjustMemberPointsRequest): Promise<ApplicationResult<void>> {
    try {
      // 1. Verify member exists
      await this.memberService.getMemberById(request.memberId);

      // 2. Validate adjustment amount
      if (request.amount === 0) {
        return ApplicationResult.failure('Adjustment amount cannot be zero', 'INVALID_AMOUNT');
      }

      // 3. For negative adjustments, check if member has enough points
      if (request.amount < 0) {
        const availablePoints = await this.pointService.getAvailableBalance(request.memberId);
        if (availablePoints < Math.abs(request.amount)) {
          return ApplicationResult.failure('Insufficient points for adjustment', 'INSUFFICIENT_POINTS');
        }
      }

      // 4. Execute point adjustment
      if (request.amount > 0) {
        // Add points
        await this.pointService.addPoints({
          memberId: request.memberId,
          amount: request.amount,
          description: `Admin adjustment: ${request.reason}`,
        });
      } else {
        // Deduct points
        await this.pointService.deductPoints({
          memberId: request.memberId,
          amount: Math.abs(request.amount),
          description: `Admin adjustment: ${request.reason}`,
        });
      }

      // 5. Log the adjustment for audit (this is already handled in PointService)
      await this.auditService.logAdminAction(
        'UPDATE',
        {
          entityType: 'Member',
          entityId: request.memberId,
          metadata: {
            action: 'point_adjustment',
            amount: request.amount,
            reason: request.reason,
          },
        },
        request.adminId,
      );

      // 6. Return success
      return ApplicationResult.success();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return ApplicationResult.failure(errorMessage, 'POINT_ADJUSTMENT_FAILED');
    }
  }
}