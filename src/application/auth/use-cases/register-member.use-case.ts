import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { RegisterMemberRequest, RegisterMemberResponse } from '../dto/register-member.dto';
import { MemberService } from '../../../domains/member/services/member.service';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { PointService } from '../../../domains/point/services/point.service';

@Injectable()
export class RegisterMemberUseCase extends BaseCommand<RegisterMemberRequest, ApplicationResult<RegisterMemberResponse>> {
  constructor(
    private readonly memberService: MemberService,
    private readonly jwtService: JwtService,
    private readonly pointService: PointService,
  ) {
    super();
  }

  async execute(request: RegisterMemberRequest): Promise<ApplicationResult<RegisterMemberResponse>> {
    try {
      // 1. Create new member (this will validate if email/username already exists)
      const member = await this.memberService.registerMember({
        email: request.email,
        username: request.email.split('@')[0] || 'user', // Generate username from email
        password: request.password,
        firstName: request.name.split(' ')[0] || request.name,
        lastName: request.name.split(' ').slice(1).join(' ') || '',
      });

      // 2. Get initial point balance (should be 0 for new members)
      const pointBalance = await this.pointService.getAvailableBalance(member.id);

      // 3. Generate JWT tokens
      const tokens = await this.jwtService.generateMemberToken(member.id);

      // 4. Return response
      return ApplicationResult.success({
        accessToken: tokens.accessToken,
        refreshToken: tokens.accessToken, // Note: Current JWT service doesn't have separate refresh tokens
        member: {
          id: member.id,
          email: member.email,
          name: `${member.firstName} ${member.lastName}`,
          totalPoints: pointBalance,
        },
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'REGISTRATION_FAILED'
      );
    }
  }
}