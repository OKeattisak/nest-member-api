import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import { MemberJwtGuard } from '../../common/guards/member-jwt.guard';
import { CurrentMember, CurrentMemberData } from '../../common/decorators/current-member.decorator';
import { PrivilegeService } from '../../domains/privilege/services/privilege.service';
import {
  ExchangePrivilegeDto,
  AvailablePrivilegeResponseDto,
  MemberPrivilegeResponseDto,
  PrivilegeExchangeResponseDto
} from '../../domains/member/dto/member-privilege.dto';
import { ApiSuccessResponse } from '../../common/interfaces/api-response.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Member Privileges')
@Controller('member/privileges')
@UseGuards(MemberJwtGuard)
export class MemberPrivilegeController {
  private readonly logger = new Logger(MemberPrivilegeController.name);

  constructor(private readonly privilegeService: PrivilegeService) { }

  @Get('available')
  async getAvailablePrivileges(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<AvailablePrivilegeResponseDto[]>> {
    this.logger.log(`Member ${currentMember.id} fetching available privileges`);

    const privileges = await this.privilegeService.getAvailablePrivileges();

    const responseData: AvailablePrivilegeResponseDto[] = privileges.map(privilege => ({
      id: privilege.id,
      name: privilege.name,
      description: privilege.description,
      pointCost: privilege.pointCost,
      validityDays: privilege.validityDays,
      isActive: privilege.isActive,
    }));

    return {
      success: true,
      data: responseData,
      message: 'Available privileges retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Post('exchange')
  @HttpCode(HttpStatus.CREATED)
  async exchangePrivilege(
    @Body() exchangeDto: ExchangePrivilegeDto,
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<PrivilegeExchangeResponseDto>> {
    this.logger.log(`Member ${currentMember.id} exchanging privilege: ${exchangeDto.privilegeId}`);

    const exchangeResult = await this.privilegeService.exchangePrivilege({
      memberId: currentMember.id,
      privilegeId: exchangeDto.privilegeId,
    });

    const responseData: PrivilegeExchangeResponseDto = {
      memberPrivilegeId: exchangeResult.memberPrivilegeId,
      privilegeName: exchangeResult.privilegeName,
      pointsDeducted: exchangeResult.pointsDeducted,
      expiresAt: exchangeResult.expiresAt,
      exchangedAt: exchangeResult.exchangedAt,
    };

    this.logger.log(`Successfully exchanged privilege '${exchangeResult.privilegeName}' for member: ${currentMember.id}`);

    return {
      success: true,
      data: responseData,
      message: 'Privilege exchanged successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get('my-privileges')
  async getMemberPrivileges(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<MemberPrivilegeResponseDto[]>> {
    this.logger.log(`Member ${currentMember.id} fetching their privileges`);

    const memberPrivileges = await this.privilegeService.getMemberPrivileges(currentMember.id);

    const responseData: MemberPrivilegeResponseDto[] = memberPrivileges.map(privilege => ({
      id: privilege.id,
      privilegeId: privilege.privilegeId,
      privilegeName: privilege.privilegeName,
      privilegeDescription: privilege.privilegeDescription,
      pointCost: privilege.pointCost,
      grantedAt: privilege.grantedAt,
      expiresAt: privilege.expiresAt,
      isActive: privilege.isActive,
      isExpired: privilege.isExpired,
      daysRemaining: privilege.daysRemaining,
    }));

    return {
      success: true,
      data: responseData,
      message: 'Member privileges retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get('active')
  async getActiveMemberPrivileges(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<MemberPrivilegeResponseDto[]>> {
    this.logger.log(`Member ${currentMember.id} fetching active privileges`);

    const activePrivileges = await this.privilegeService.getActiveMemberPrivileges(currentMember.id);

    const responseData: MemberPrivilegeResponseDto[] = activePrivileges.map(privilege => ({
      id: privilege.id,
      privilegeId: privilege.privilegeId,
      privilegeName: privilege.privilegeName,
      privilegeDescription: privilege.privilegeDescription,
      pointCost: privilege.pointCost,
      grantedAt: privilege.grantedAt,
      expiresAt: privilege.expiresAt,
      isActive: privilege.isActive,
      isExpired: privilege.isExpired,
      daysRemaining: privilege.daysRemaining,
    }));

    return {
      success: true,
      data: responseData,
      message: 'Active member privileges retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }
}