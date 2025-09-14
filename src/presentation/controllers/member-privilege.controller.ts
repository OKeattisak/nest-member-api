import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { MemberJwtGuard } from '@/common/guards/member-jwt.guard';
import { CurrentMember, CurrentMemberData } from '@/common/decorators/current-member.decorator';
import {
  ExchangePrivilegeDto,
  AvailablePrivilegeResponseDto,
  MemberPrivilegeResponseDto,
  PrivilegeExchangeResponseDto
} from '@/domains/member/dto/member-privilege.dto';
import { ApiSuccessResponse } from '@/common/interfaces/api-response.interface';
import { ApiDocumentationHelper } from '@/common/swagger/api-documentation.helper';

// Import Application Layer Use Cases
import { ExchangePrivilegeUseCase } from '../../application/member/use-cases/exchange-privilege.use-case';
import { GetAvailablePrivilegesUseCase } from '../../application/member/use-cases/get-available-privileges.use-case';
import { GetMemberPrivilegesUseCase } from '../../application/member/use-cases/get-member-privileges.use-case';

@ApiTags('Member Privileges')
@Controller('member/privileges')
@UseGuards(MemberJwtGuard)
@ApiBearerAuth()
export class MemberPrivilegeController {
  private readonly logger = new Logger(MemberPrivilegeController.name);

  constructor(
    // Use Application Layer Use Cases
    private readonly exchangePrivilegeUseCase: ExchangePrivilegeUseCase,
    private readonly getAvailablePrivilegesUseCase: GetAvailablePrivilegesUseCase,
    private readonly getMemberPrivilegesUseCase: GetMemberPrivilegesUseCase,
  ) { }

  @Get('available')
  @ApiOperation({
    summary: 'Get available privileges',
    description: 'Retrieve all active privileges that are available for point exchange. Only shows privileges that are currently active and can be exchanged.'
  })
  @ApiResponse({
    status: 200,
    description: 'Available privileges retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clpr123456789' },
              name: { type: 'string', example: 'Premium Access' },
              description: { type: 'string', example: 'Access to premium features and exclusive content' },
              pointCost: { type: 'number', example: 500 },
              validityDays: { type: 'number', example: 30, nullable: true },
              isActive: { type: 'boolean', example: true }
            }
          }
        },
        message: { type: 'string', example: 'Available privileges retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T13:00:00.000Z' },
            traceId: { type: 'string', example: 'trace-avail123' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  async getAvailablePrivileges(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<any[]>> {
    this.logger.log(`Member ${currentMember.id} fetching available privileges`);

    // Use Application Layer Use Case
    const result = await this.getAvailablePrivilegesUseCase.execute({
      memberId: currentMember.id,
    });

    // Handle Application Result
    if (!result.isSuccess || !result.data) {
      this.logger.warn(`Failed to get available privileges for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.data,
      message: 'Available privileges retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Post('exchange')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Exchange points for privilege',
    description: 'Exchange points for a specific privilege. Points are deducted using FIFO logic and the privilege is granted to the member.'
  })
  @ApiBody({
    type: ExchangePrivilegeDto,
    description: 'Privilege exchange details',
    examples: {
      'premium-access': {
        summary: 'Exchange for Premium Access',
        description: 'Exchange points for premium access privilege',
        value: {
          privilegeId: 'clpr123456789'
        }
      },
      'vip-status': {
        summary: 'Exchange for VIP Status',
        description: 'Exchange points for VIP status privilege',
        value: {
          privilegeId: 'clpr987654321'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Privilege exchanged successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            memberPrivilegeId: { type: 'string', example: 'clmp123456789' },
            privilegeName: { type: 'string', example: 'Premium Access' },
            pointsDeducted: { type: 'number', example: 500 },
            expiresAt: { type: 'string', example: '2024-01-01T00:00:00.000Z', nullable: true },
            exchangedAt: { type: 'string', example: '2023-12-01T13:05:00.000Z' }
          }
        },
        message: { type: 'string', example: 'Privilege exchanged successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T13:05:00.000Z' },
            traceId: { type: 'string', example: 'trace-exchange123' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.INSUFFICIENT_POINTS)
  async exchangePrivilege(
    @Body() exchangeDto: ExchangePrivilegeDto,
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`Member ${currentMember.id} exchanging privilege: ${exchangeDto.privilegeId}`);

    // Use Application Layer Use Case
    const result = await this.exchangePrivilegeUseCase.execute({
      memberId: currentMember.id,
      privilegeId: exchangeDto.privilegeId,
    });

    // Handle Application Result
    if (!result.isSuccess || !result.data) {
      this.logger.warn(`Failed to exchange privilege for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    this.logger.log(`Successfully exchanged privilege '${result.data.privilege.name}' for member: ${currentMember.id}`);

    return {
      success: true,
      data: result.data,
      message: 'Privilege exchanged successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get('my-privileges')
  @ApiOperation({
    summary: 'Get member privileges',
    description: 'Retrieve all privileges owned by the current member, including both active and expired privileges.'
  })
  @ApiResponse({
    status: 200,
    description: 'Member privileges retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: ApiDocumentationHelper.SCHEMAS.MEMBER_PRIVILEGE
        },
        message: { type: 'string', example: 'Member privileges retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T13:10:00.000Z' },
            traceId: { type: 'string', example: 'trace-mypriv123' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  async getMemberPrivileges(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<any[]>> {
    this.logger.log(`Member ${currentMember.id} fetching their privileges`);

    // Use Application Layer Use Case
    const result = await this.getMemberPrivilegesUseCase.execute({
      memberId: currentMember.id,
    });

    // Handle Application Result
    if (!result.isSuccess || !result.data) {
      this.logger.warn(`Failed to get member privileges for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.data,
      message: 'Member privileges retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active member privileges',
    description: 'Retrieve only the currently active (non-expired) privileges owned by the member.'
  })
  @ApiResponse({
    status: 200,
    description: 'Active member privileges retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clmp123456789' },
              privilegeId: { type: 'string', example: 'clpr123456789' },
              privilegeName: { type: 'string', example: 'Premium Access' },
              privilegeDescription: { type: 'string', example: 'Access to premium features' },
              pointCost: { type: 'number', example: 500 },
              grantedAt: { type: 'string', example: '2023-12-01T13:05:00.000Z' },
              expiresAt: { type: 'string', example: '2024-01-01T00:00:00.000Z', nullable: true },
              isActive: { type: 'boolean', example: true },
              isExpired: { type: 'boolean', example: false },
              daysRemaining: { type: 'number', example: 30, nullable: true }
            }
          }
        },
        message: { type: 'string', example: 'Active member privileges retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T13:15:00.000Z' },
            traceId: { type: 'string', example: 'trace-active123' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  async getActiveMemberPrivileges(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<any[]>> {
    this.logger.log(`Member ${currentMember.id} fetching active privileges`);

    // Use Application Layer Use Case
    const result = await this.getMemberPrivilegesUseCase.execute({
      memberId: currentMember.id,
      status: 'ACTIVE',
    });

    // Handle Application Result
    if (!result.isSuccess || !result.data) {
      this.logger.warn(`Failed to get active member privileges for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.data,
      message: 'Active member privileges retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }
}