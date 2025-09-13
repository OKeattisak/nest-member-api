import { 
  Controller, 
  Get, 
  Put, 
  Post,
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Logger 
} from '@nestjs/common';
import { MemberJwtGuard } from '../../common/guards/member-jwt.guard';
import { CurrentMember, CurrentMemberData } from '../../common/decorators/current-member.decorator';
import { MemberService } from '../../domains/member/services/member.service';
import { 
  UpdateMemberProfileDto,
  ChangePasswordDto
} from '../../domains/member/dto/member-profile.dto';
import { MemberProfileResponseDto } from '../../domains/member/dto/member-auth.dto';
import { ApiSuccessResponse } from '../../common/interfaces/api-response.interface';

@Controller('member/profile')
@UseGuards(MemberJwtGuard)
export class MemberProfileController {
  private readonly logger = new Logger(MemberProfileController.name);

  constructor(private readonly memberService: MemberService) {}

  @Get()
  async getProfile(
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<MemberProfileResponseDto>> {
    this.logger.log(`Member ${currentMember.id} fetching profile`);

    const member = await this.memberService.getMemberById(currentMember.id);

    const responseData: MemberProfileResponseDto = {
      id: member.id,
      email: member.email,
      username: member.username,
      firstName: member.firstName,
      lastName: member.lastName,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };

    return {
      success: true,
      data: responseData,
      message: 'Profile retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Put()
  async updateProfile(
    @Body() updateProfileDto: UpdateMemberProfileDto,
    @CurrentMember() currentMember: CurrentMemberData,
  ): Promise<ApiSuccessResponse<MemberProfileResponseDto>> {
    this.logger.log(`Member ${currentMember.id} updating profile`);

    const member = await this.memberService.updateMemberProfile(currentMember.id, {
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      username: updateProfileDto.username,
    });

    const responseData: MemberProfileResponseDto = {
      id: member.id,
      email: member.email,
      username: member.username,
      firstName: member.firstName,
      lastName: member.lastName,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };

    this.logger.log(`Successfully updated profile for member: ${currentMember.id}`);

    return {
      success: true,
      data: responseData,
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