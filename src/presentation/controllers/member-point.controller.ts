import { 
  Controller, 
  Get, 
  Query,
  UseGuards,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MemberJwtGuard } from '@/common/guards/member-jwt.guard';
import { CurrentMember, CurrentMemberData } from '@/common/decorators/current-member.decorator';
import { 
  PointHistoryQueryDto,
  PointBalanceResponseDto,
  PointTransactionResponseDto
} from '@/domains/member/dto/member-point.dto';
import { ApiSuccessResponse, PaginationMeta } from '@/common/interfaces/api-response.interface';

// Import Application Layer Use Case
import { GetMemberPointsUseCase } from '../../application/member/use-cases/get-member-points.use-case';

@ApiTags('Member Points')
@ApiBearerAuth('member-auth')
@Controller('member/points')
@UseGuards(MemberJwtGuard)
export class MemberPointController {
  private readonly logger = new Logger(MemberPointController.name);

  constructor(
    // Use Application Layer Use Case
    private readonly getMemberPointsUseCase: GetMemberPointsUseCase,
  ) {}

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
  ): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`Member ${currentMember.id} fetching point balance`);

    // Use Application Layer Use Case
    const result = await this.getMemberPointsUseCase.execute({
      memberId: currentMember.id,
      page: 1,
      limit: 1, // Just get the balance info
    });

    // Handle Application Result
    if (!result.isSuccess || !result.data) {
      this.logger.warn(`Failed to get points for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    // Extract balance information from the result
    const responseData = {
      memberId: currentMember.id,
      totalEarned: result.data.totalPoints,
      totalDeducted: 0, // Not available in current response
      totalExpired: 0, // Not available in current response
      totalExchanged: 0, // Not available in current response
      availableBalance: result.data.availablePoints,
      lastUpdated: new Date(),
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
  ): Promise<ApiSuccessResponse<any[]>> {
    this.logger.log(`Member ${currentMember.id} fetching point history`);

    // Use Application Layer Use Case
    const result = await this.getMemberPointsUseCase.execute({
      memberId: currentMember.id,
      page: query.page || 1,
      limit: query.limit || 10,
    });

    // Handle Application Result
    if (!result.isSuccess || !result.data) {
      this.logger.warn(`Failed to get point history for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    const paginationMeta: PaginationMeta = {
      page: result.data.pagination.page,
      limit: result.data.pagination.limit,
      total: result.data.pagination.total,
      totalPages: result.data.pagination.totalPages,
      hasNext: result.data.pagination.page < result.data.pagination.totalPages,
      hasPrev: result.data.pagination.page > 1,
    };

    return {
      success: true,
      data: result.data.transactions,
      message: 'Point history retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
        pagination: paginationMeta,
      },
    };
  }
}