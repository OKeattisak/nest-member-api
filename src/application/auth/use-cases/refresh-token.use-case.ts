import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { MemberService } from '../../../domains/member/services/member.service';
import { AdminService } from '../../../domains/admin/services/admin.service';

export interface RefreshTokenRequest {
  refreshToken: string;
  userType: 'member' | 'admin';
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase extends BaseCommand<RefreshTokenRequest, ApplicationResult<RefreshTokenResponse>> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly memberService: MemberService,
    private readonly adminService: AdminService,
  ) {
    super();
  }

  async execute(request: RefreshTokenRequest): Promise<ApplicationResult<RefreshTokenResponse>> {
    try {
      // Note: Current JWT service doesn't have refresh token verification
      // This is a simplified implementation
      
      let tokens: { accessToken: string; expiresIn: string };

      if (request.userType === 'member') {
        // For now, we'll verify the token as a regular member token
        const payload = await this.jwtService.verifyMemberToken(request.refreshToken);
        
        // Verify member still exists and is active
        const member = await this.memberService.getMemberById(payload.sub);
        
        // Generate new member token
        tokens = await this.jwtService.generateMemberToken(member.id);
      } else {
        // For admin tokens
        const payload = await this.jwtService.verifyAdminToken(request.refreshToken);
        
        // Verify admin still exists and is active
        const admin = await this.adminService.getAdminById(payload.sub);
        
        // Generate new admin token
        tokens = await this.jwtService.generateAdminToken(admin.id, admin.role);
      }

      // Return new tokens
      return ApplicationResult.success({
        accessToken: tokens.accessToken,
        refreshToken: tokens.accessToken, // Same token for now
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'TOKEN_REFRESH_FAILED'
      );
    }
  }
}