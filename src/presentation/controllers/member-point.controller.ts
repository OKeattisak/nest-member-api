import { 
  Controller, 
  Get, 
  Query,
  UseGuards,
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MemberJwtGuard } from '../../common/guards/member-jwt.guard';
import { CurrentMember, CurrentMemberData } from '../../common/decorators/current-member.decorator';
import { PointService } from '../../domains/point/services/point.service';
import { 
  PointHistoryQueryDto,
  PointBalanceResponseDto,
  PointTransactionResponseDto
} from '../../domains/member/dto/member-point.dto';
import { ApiSuccessResponse, PaginationMeta } from '../../common/interfaces/api-response.interface';

@ApiTags('Member Points')
@ApiBearerAuth('member-auth')
@Controller('member/points')
@UseGuards(MemberJwtGuard)
export class MemberPointController {
  private readonly logger = new Logger(MemberPointController.name);

  constructor(private readonly pointService: PointService) {}

  @Get('balance')
  @ApiOperation({ 
    summary: 'Get point balance',
    description: 'Retrieve the current member point balance and statistics'
  })
  @ApiResponse({
    status: 200,
    description: 'Point balance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            memberId: { type: 'string', example: 'clm123456789' },
            totalEarned: { type: 'number', example: 2000 },
            totalDeducted: { type: 'number', example: 500 },
            totalExpired: { type: 'number', example: 100 },
            totalExchanged: { type: 'number', example: 300 },
            availableBalance: { type: 'number', example: 1100 },
            lastUpdated: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
          }
        },
        message: { type: 'string', example: 'Point balance retrieved successfully' }
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Get point transaction history',
    description: 'Retrieve paginated point transaction history for the current member'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'type', required: false, enum: ['EARNED', 'DEDUCTED', 'EXPIRED', 'EXCHANGED'], description: 'Filter by transaction type' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for filtering (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for filtering (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'Point history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clp123456789' },
              memberId: { type: 'string', example: 'clm123456789' },
              amount: { type: 'number', example: 100 },
              signedAmount: { type: 'number', example: 100 },
              type: { type: 'string', example: 'EARNED' },
              description: { type: 'string', example: 'Daily login bonus' },
              expiresAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
              isExpired: { type: 'boolean', example: false },
              createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
            }
          }
        },
        message: { type: 'string', example: 'Point history retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 25 },
                totalPages: { type: 'number', example: 3 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false }
              }
            }
          }
        }
      }
    }
  })
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