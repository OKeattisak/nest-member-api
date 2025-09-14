import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { UpdateMemberProfileRequest, MemberProfileResponse } from '../dto/member-profile.dto';
import { MemberService } from '../../../domains/member/services/member.service';
import { PointService } from '../../../domains/point/services/point.service';

@Injectable()
export class UpdateMemberProfileUseCase extends BaseCommand<UpdateMemberProfileRequest, ApplicationResult<MemberProfileResponse>> {
  constructor(
    private readonly memberService: MemberService,
    private readonly pointService: PointService,
  ) {
    super();
  }

  async execute(request: UpdateMemberProfileRequest): Promise<ApplicationResult<MemberProfileResponse>> {
    try {
      // 1. Parse name into first and last name if provided
      let firstName: string | undefined;
      let lastName: string | undefined;
      
      if (request.name) {
        const nameParts = request.name.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // 2. Update member profile
      const updatedMember = await this.memberService.updateMemberProfile(request.memberId, {
        firstName,
        lastName,
        // Note: phone and dateOfBirth are not supported in current member service
      });

      // 3. Get current point balance
      const totalPoints = await this.pointService.getAvailableBalance(request.memberId);

      // 4. Return updated profile
      return ApplicationResult.success({
        id: updatedMember.id,
        email: updatedMember.email,
        name: `${updatedMember.firstName} ${updatedMember.lastName}`,
        phone: request.phone, // Return what was requested (not persisted yet)
        dateOfBirth: request.dateOfBirth, // Return what was requested (not persisted yet)
        totalPoints,
        createdAt: updatedMember.createdAt,
        updatedAt: updatedMember.updatedAt,
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'UPDATE_PROFILE_FAILED'
      );
    }
  }
}