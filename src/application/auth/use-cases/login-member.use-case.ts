import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { LoginMemberRequest, LoginMemberResponse } from '../dto/login-member.dto';
import { MemberService } from '../../../domains/member/services/member.service';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { PointService } from '../../../domains/point/services/point.service';
import { AuditService } from '../../../domains/audit/services/audit.service';

@Injectable()
export class LoginMemberUseCase extends BaseCommand<LoginMemberRequest, ApplicationResult<LoginMemberResponse>> {
  constructor(
    private readonly memberService: MemberService,
    private readonly jwtService: JwtService,
    private readonly pointService: PointService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async execute(request: LoginMemberRequest): Promise<ApplicationResult<LoginMemberResponse>> {
    try {
      // 1. Authenticate member credentials
      const authResult = await this.memberService.authenticateMember({
        emailOrUsername: request.email,
        password: request.password,
      });

      if (!authResult.isAuthenticated) {
        // Log failed login attempt
        await this.auditService.logLoginAttempt({
          emailOrUsername: request.email,
          actorType: 'MEMBER',
          success: false,
          failureReason: 'Invalid credentials',
        });
        return ApplicationResult.failure('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // 2. Get member's current point balance
      const pointBalance = await this.pointService.getAvailableBalance(authResult.member.id);

      // 3. Generate JWT tokens
      const tokens = await this.jwtService.generateMemberToken(authResult.member.id);

      // 4. Log successful login attempt
      await this.auditService.logLoginAttempt({
        emailOrUsername: request.email,
        actorType: 'MEMBER',
        success: true,
      });

      // 5. Return response
      return ApplicationResult.success({
        accessToken: tokens.accessToken,
        refreshToken: tokens.accessToken, // Note: Current JWT service doesn't have separate refresh tokens
        member: {
          id: authResult.member.id,
          email: authResult.member.email,
          name: `${authResult.member.firstName} ${authResult.member.lastName}`,
          totalPoints: pointBalance,
        },
      });
    } catch (error) {
      // Log failed login attempt for any error
      await this.auditService.logLoginAttempt({
        emailOrUsername: request.email,
        actorType: 'MEMBER',
        success: false,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'LOGIN_FAILED'
      );
    }
  }
}