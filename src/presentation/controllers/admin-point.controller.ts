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
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CurrentAdmin, CurrentAdminData } from '../../common/decorators/current-admin.decorator';
import { PointService } from '../../domains/point/services/point.service';
import { 
  AddPointsDto, 
  DeductPointsDto, 
  PointBalanceResponseDto, 
  PointTransactionResponseDto 
} from '../../domains/admin/dto/point-management.dto';
import { PaginationDto } from '../../domains/admin/dto/member-management.dto';
import { ApiSuccessResponse, PaginationMeta } from '../../common/interfaces/api-response.interface';

@Controller('admin/points')
@UseGuards(AdminJwtGuard)
export class AdminPointController {
  private readonly logger = new Logger(AdminPointController.name);

  constructor(private readonly pointService: PointService) {}

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
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