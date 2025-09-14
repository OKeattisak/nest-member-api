import { Injectable } from '@nestjs/common';
import { BaseQuery, ApplicationResult } from '../../common';
import { GetMemberProfileRequest, MemberProfileResponse } from '../dto/member-profile.dto';
import { MemberService } from '../../../domains/member/services/member.service';
import { PointService } from '../../../domains/point/services/point.service';

@Injectable()
export class GetMemberProfileUseCase extends BaseQuery<GetMemberProfileRequest, ApplicationResult<MemberProfileResponse>> {
  constructor(
    private readonly memberService: MemberService,
    private readonly pointService: PointService,
  ) {
    super();
  }

  async execute(request: GetMemberProfileRequest): Promise<ApplicationResult<MemberProfileResponse>> {
    try {
      // 1. Get member by ID
      const member = await this.memberService.getMemberById(request.memberId);

      // 2. Get current point balance
      const totalPoints = await this.pointService.getAvailableBalance(request.memberId);

      // 3. Return member profile
      return ApplicationResult.success({
        id: member.id,
        email: member.email,
        name: `${member.firstName} ${member.lastName}`,
        phone: undefined, // Not available in current member entity
        dateOfBirth: undefined, // Not available in current member entity
        totalPoints,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'GET_PROFILE_FAILED'
      );
    }
  }
}