import { Injectable } from '@nestjs/common';
import { BaseQuery, ApplicationResult } from '../../common';
import { GetMemberPointsRequest, MemberPointsResponse } from '../dto/member-points.dto';
import { PointService } from '../../../domains/point/services/point.service';
import { MemberService } from '../../../domains/member/services/member.service';

@Injectable()
export class GetMemberPointsUseCase extends BaseQuery<GetMemberPointsRequest, ApplicationResult<MemberPointsResponse>> {
  constructor(
    private readonly pointService: PointService,
    private readonly memberService: MemberService,
  ) {
    super();
  }

  async execute(request: GetMemberPointsRequest): Promise<ApplicationResult<MemberPointsResponse>> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 20;

      // 1. Verify member exists
      await this.memberService.getMemberById(request.memberId);

      // 2. Get comprehensive point balance
      const pointBalance = await this.pointService.getPointBalance(request.memberId);

      // 3. Get point transactions with pagination
      const transactions = await this.pointService.getPointHistory(request.memberId, { page, limit });

      // 4. Get points expiring in next 30 days
      const expiringPoints = await this.pointService.getExpiringPoints(30);
      const memberExpiringPoints = expiringPoints
        .filter(p => p.memberId === request.memberId)
        .reduce((sum, p) => sum + p.amount, 0);

      // 5. Transform transactions to match DTO format
      const transformedTransactions = transactions.data.map(t => ({
        id: t.id,
        type: t.type as 'EARNED' | 'SPENT' | 'EXPIRED',
        amount: t.signedAmount, // Use signed amount for display
        description: t.description,
        expiresAt: t.expiresAt,
        createdAt: t.createdAt,
      }));

      // 6. Return response
      return ApplicationResult.success({
        totalPoints: pointBalance.totalEarned,
        availablePoints: pointBalance.availableBalance,
        expiringPoints: memberExpiringPoints,
        transactions: transformedTransactions,
        pagination: {
          page,
          limit,
          total: transactions.total,
          totalPages: Math.ceil(transactions.total / limit),
        },
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'GET_POINTS_FAILED'
      );
    }
  }
}