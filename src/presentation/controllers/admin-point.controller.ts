import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AdminJwtGuard } from '@/common/guards/admin-jwt.guard';
import { CurrentAdmin, CurrentAdminData } from '@/common/decorators/current-admin.decorator';
import { PointService } from '@/domains/point/services/point.service';
import {
  AddPointsDto,
  DeductPointsDto,
  PointBalanceResponseDto,
  PointTransactionResponseDto
} from '@/domains/admin/dto/point-management.dto';
import { PaginationDto } from '@/domains/admin/dto/member-management.dto';
import { ApiSuccessResponse, PaginationMeta } from '@/common/interfaces/api-response.interface';
import { ApiDocumentationHelper } from '@/common/swagger/api-documentation.helper';

@ApiTags('Admin Points')
@Controller('admin/points')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class AdminPointController {
  private readonly logger = new Logger(AdminPointController.name);

  constructor(private readonly pointService: PointService) { }

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add points to member account',
    description: 'Add points to a specific member account with optional expiration date. Points are added using FIFO (First In, First Out) logic for expiration tracking.'
  })
  @ApiBody({
    type: AddPointsDto,
    description: 'Point addition details',
    examples: {
      'bonus-points': {
        summary: 'Bonus points with expiration',
        description: 'Adding bonus points that expire in 1 year',
        value: {
          memberId: 'clm123456789',
          amount: 500,
          description: 'Monthly activity bonus',
          expirationDays: 365
        }
      },
      'permanent-points': {
        summary: 'Permanent points',
        description: 'Adding points without expiration',
        value: {
          memberId: 'clm987654321',
          amount: 1000,
          description: 'Welcome bonus for new member'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Points added successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Successfully added 500 points' }
          }
        },
        message: { type: 'string', example: 'Points added successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T10:30:00.000Z' },
            traceId: { type: 'string', example: 'trace-abc123' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
  async addPoints(
    @Body() addPointsDto: AddPointsDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<{ message: string }>> {
    this.logger.log(`Admin ${admin.id} adding ${addPointsDto.amount} points to member ${addPointsDto.memberId}`);

    await this.pointService.addPoints({
      memberId: addPointsDto.memberId,
      amount: addPointsDto.amount,
      description: addPointsDto.description,
      expirationDays: addPointsDto.expirationDays,
    });

    this.logger.log(`Successfully added ${addPointsDto.amount} points to member ${addPointsDto.memberId}`);

    return {
      success: true,
      data: { message: `Successfully added ${addPointsDto.amount} points` },
      message: 'Points added successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Post('deduct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deduct points from member account',
    description: 'Deduct points from a member account using FIFO logic. Points are deducted from the oldest non-expired points first.'
  })
  @ApiBody({
    type: DeductPointsDto,
    description: 'Point deduction details',
    examples: {
      'penalty-deduction': {
        summary: 'Penalty deduction',
        description: 'Deducting points as penalty for policy violation',
        value: {
          memberId: 'clm123456789',
          amount: 200,
          description: 'Penalty for policy violation'
        }
      },
      'correction-deduction': {
        summary: 'Correction deduction',
        description: 'Correcting previously awarded points',
        value: {
          memberId: 'clm987654321',
          amount: 50,
          description: 'Correction for duplicate bonus points'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Points deducted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Successfully deducted 200 points' }
          }
        },
        message: { type: 'string', example: 'Points deducted successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T10:35:00.000Z' },
            traceId: { type: 'string', example: 'trace-def456' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.INSUFFICIENT_POINTS)
  async deductPoints(
    @Body() deductPointsDto: DeductPointsDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<{ message: string }>> {
    this.logger.log(`Admin ${admin.id} deducting ${deductPointsDto.amount} points from member ${deductPointsDto.memberId}`);

    await this.pointService.deductPoints({
      memberId: deductPointsDto.memberId,
      amount: deductPointsDto.amount,
      description: deductPointsDto.description,
    });

    this.logger.log(`Successfully deducted ${deductPointsDto.amount} points from member ${deductPointsDto.memberId}`);

    return {
      success: true,
      data: { message: `Successfully deducted ${deductPointsDto.amount} points` },
      message: 'Points deducted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get('balance/:memberId')
  @ApiOperation({
    summary: 'Get member point balance',
    description: 'Retrieve comprehensive point balance information for a specific member, including total earned, deducted, expired, exchanged, and available balance.'
  })
  @ApiParam({
    name: 'memberId',
    description: 'Unique identifier of the member',
    example: 'clm123456789'
  })
  @ApiResponse({
    status: 200,
    description: 'Point balance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: ApiDocumentationHelper.SCHEMAS.POINT_BALANCE,
        message: { type: 'string', example: 'Point balance retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T10:40:00.000Z' },
            traceId: { type: 'string', example: 'trace-ghi789' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
  async getPointBalance(
    @Param('memberId') memberId: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PointBalanceResponseDto>> {
    this.logger.log(`Admin ${admin.id} fetching point balance for member ${memberId}`);

    const balance = await this.pointService.getPointBalance(memberId);

    const responseData: PointBalanceResponseDto = {
      memberId: balance.memberId,
      totalEarned: balance.totalEarned,
      totalDeducted: balance.totalDeducted,
      totalExpired: balance.totalExpired,
      totalExchanged: balance.totalExchanged,
      availableBalance: balance.availableBalance,
      lastUpdated: balance.lastUpdated,
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

  @Get('history/:memberId')
  @ApiOperation({
    summary: 'Get member point transaction history',
    description: 'Retrieve paginated point transaction history for a specific member, including all point additions, deductions, expirations, and exchanges.'
  })
  @ApiParam({
    name: 'memberId',
    description: 'Unique identifier of the member',
    example: 'clm123456789'
  })
  @ApiQuery(ApiDocumentationHelper.QUERY_PARAMS.PAGE)
  @ApiQuery(ApiDocumentationHelper.QUERY_PARAMS.LIMIT)
  @ApiResponse({
    status: 200,
    description: 'Point history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: ApiDocumentationHelper.SCHEMAS.POINT_TRANSACTION
        },
        message: { type: 'string', example: 'Point history retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T10:45:00.000Z' },
            traceId: { type: 'string', example: 'trace-jkl012' },
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
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
  async getPointHistory(
    @Param('memberId') memberId: string,
    @Query() pagination: PaginationDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PointTransactionResponseDto[]>> {
    this.logger.log(`Admin ${admin.id} fetching point history for member ${memberId}`);

    const result = await this.pointService.getPointHistory(memberId, {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
    });

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

  @Get('expiring')
  @ApiOperation({
    summary: 'Get points expiring soon',
    description: 'Retrieve all points across all members that are expiring within the specified number of days. Useful for monitoring and member notifications.'
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead for expiring points (default: 30)',
    example: 30
  })
  @ApiResponse({
    status: 200,
    description: 'Expiring points retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: ApiDocumentationHelper.SCHEMAS.POINT_TRANSACTION,
          example: [
            {
              id: 'clp123456789',
              memberId: 'clm123456789',
              amount: 500,
              signedAmount: 500,
              type: 'EARNED',
              description: 'Welcome bonus',
              expiresAt: '2023-12-15T00:00:00.000Z',
              isExpired: false,
              createdAt: '2022-12-15T00:00:00.000Z'
            },
            {
              id: 'clp987654321',
              memberId: 'clm987654321',
              amount: 200,
              signedAmount: 200,
              type: 'EARNED',
              description: 'Activity bonus',
              expiresAt: '2023-12-20T00:00:00.000Z',
              isExpired: false,
              createdAt: '2022-12-20T00:00:00.000Z'
            }
          ]
        },
        message: { type: 'string', example: 'Expiring points retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T10:50:00.000Z' },
            traceId: { type: 'string', example: 'trace-mno345' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
  async getExpiringPoints(
    @Query('days') days: number = 30,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PointTransactionResponseDto[]>> {
    this.logger.log(`Admin ${admin.id} fetching points expiring within ${days} days`);

    const expiringPoints = await this.pointService.getExpiringPoints(days);

    const responseData: PointTransactionResponseDto[] = expiringPoints.map(transaction => ({
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

    return {
      success: true,
      data: responseData,
      message: 'Expiring points retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }
}