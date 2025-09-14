import { 
  Controller, 
  Get, 
  Put, 
  Post,
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { MemberJwtGuard } from '@/common/guards/member-jwt.guard';
import { CurrentMember, CurrentMemberData } from '@/common/decorators/current-member.decorator';
import { MemberService } from '@/domains/member/services/member.service';
import { 
  UpdateMemberProfileDto,
  ChangePasswordDto
} from '@/domains/member/dto/member-profile.dto';
import { MemberProfileResponseDto } from '@/domains/member/dto/member-auth.dto';
import { ApiSuccessResponse } from '@/common/interfaces/api-response.interface';

// Import Application Layer Use Cases
import { GetMemberProfileUseCase } from '../../application/member/use-cases/get-member-profile.use-case';
import { UpdateMemberProfileUseCase } from '../../application/member/use-cases/update-member-profile.use-case';

@ApiTags('Member Profile')
@ApiBearerAuth('member-auth')
@Controller('member/profile')
@UseGuards(MemberJwtGuard)
export class MemberProfileController {
  private readonly logger = new Logger(MemberProfileController.name);

  constructor(
    // Use Application Layer Use Cases instead of Domain Services
    private readonly getMemberProfileUseCase: GetMemberProfileUseCase,
    private readonly updateMemberProfileUseCase: UpdateMemberProfileUseCase,
    private readonly memberService: MemberService, // Keep for change password (not implemented in use cases yet)
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get member profile',
    description: 'Retrieve the current member profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clm123456789' },
            email: { type: 'string', example: 'member@example.com' },
            username: { type: 'string', example: 'member123' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
          }
        },
        message: { type: 'string', example: 'Profile retrieved successfully' }
      }
    }
  })
  async getProfile(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`Member ${currentMember.id} fetching profile`);

    // Use Application Layer Use Case
    const result = await this.getMemberProfileUseCase.execute({
      memberId: currentMember.id,
    });

    // Handle Application Result
    if (!result.isSuccess) {
      this.logger.warn(`Failed to get profile for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: result.data,
      message: 'Profile retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Put()
  @ApiOperation({ 
    summary: 'Update member profile',
    description: 'Update the current member profile information'
  })
  @ApiBody({
    type: UpdateMemberProfileDto,
    description: 'Profile update data',
    examples: {
      example1: {
        summary: 'Profile update example',
        value: {
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully'
  })
  async updateProfile(
    @Body() updateProfileDto: UpdateMemberProfileDto,
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`Member ${currentMember.id} updating profile`);

    // Use Application Layer Use Case
    const result = await this.updateMemberProfileUseCase.execute({
      memberId: currentMember.id,
      name: updateProfileDto.firstName && updateProfileDto.lastName ? 
        `${updateProfileDto.firstName} ${updateProfileDto.lastName}` : 
        undefined,
    });

    // Handle Application Result
    if (!result.isSuccess) {
      this.logger.warn(`Failed to update profile for member ${currentMember.id}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    this.logger.log(`Successfully updated profile for member: ${currentMember.id}`);

    return {
      success: true,
      data: result.data,
      message: 'Profile updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<null>> {
    this.logger.log(`Member ${currentMember.id} changing password`);

    await this.memberService.changePassword(
      currentMember.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    this.logger.log(`Successfully changed password for member: ${currentMember.id}`);

    return {
      success: true,
      data: null,
      message: 'Password changed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }
}