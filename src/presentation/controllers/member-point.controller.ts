import { 
  Controller, 
  Get, 
  Query,
  UseGuards,
  Logger 
} from '@nestjs/common';
import { MemberJwtGuard } from '../../common/guards/member-jwt.guard';
import { CurrentMember, CurrentMemberData } from '../../common/decorators/current-member.decorator';
import { PointService } from '../../domains/point/services/point.service';
import { 
  PointHistoryQueryDto,
  PointBalanceResponseDto,
  PointTransactionResponseDto
} from '../../domains/member/dto/member-point.dto';
import { ApiSuccessResponse, PaginationMeta } from '../../common/interfaces/api-response.interface';

@Controller('member/points')
@UseGuards(MemberJwtGuard)
export class MemberPointController {
  private readonly logger = new Logger(MemberPointController.name);

  constructor(private readonly pointService: PointService) {}

  @Get('balance')
  async getPointBalance(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<PointBalanceResponseDto>> {
    this.logger.log(`Member ${currentMember.id} fetching point balance`);

    const pointBalance = await this.pointService.getPointBalance(currentMember.id);

    const responseData: PointBalanceResponseDto = {
      memberId: pointBalance.memberId,
      totalEarned: pointBalance.totalEarned,
      totalDeducted: pointBalance.totalDeducted,
      totalExpired: pointBalance.totalExpired,
      totalExchanged: pointBalance.totalExchanged,
      availableBalance: pointBalance.availableBalance,
      lastUpdated: pointBalance.lastUpdated,
    };

    return {
      success: true,
      data: responseData,
      message: 'Point balance retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get('history')
  async getPointHistory(
    @Query() query: PointHistoryQueryDto,
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<PointTransactionResponseDto[]>> {
    this.logger.log(`Member ${currentMember.id} fetching point history`);

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const result = await this.pointService.getPointHistory(currentMember.id, pagination);

    const responseData: PointTransactionResponseDto[] = result.data.map(transaction => ({
      id: transaction.id,
      memberId: transaction.memberId,
      amount: transaction.amount,
      signedAmount: transaction.signedAmount,
      type: transaction.type,
      description: transaction.description,
      expiresAt: transaction.expiresAt,
      isExpired: transaction.isExpired,
      createdAt: transaction.createdAt,
    }));

    const paginationMeta: PaginationMeta = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1,
    };

    return {
      success: true,
      data: responseData,
      message: 'Point history retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
        pagination: paginationMeta,
      },
    };
  }
}