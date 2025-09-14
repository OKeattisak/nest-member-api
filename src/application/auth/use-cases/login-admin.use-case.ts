import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { LoginAdminRequest, LoginAdminResponse } from '../dto/login-admin.dto';
import { AdminService } from '../../../domains/admin/services/admin.service';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { AuditService } from '../../../domains/audit/services/audit.service';

@Injectable()
export class LoginAdminUseCase extends BaseCommand<LoginAdminRequest, ApplicationResult<LoginAdminResponse>> {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async execute(request: LoginAdminRequest): Promise<ApplicationResult<LoginAdminResponse>> {
    try {
      // 1. Authenticate admin credentials
      const authResult = await this.adminService.authenticateAdmin({
        emailOrUsername: request.username,
        password: request.password,
      });

      if (!authResult.isAuthenticated) {
        // Log failed login attempt
        await this.auditService.logLoginAttempt({
          emailOrUsername: request.username,
          actorType: 'ADMIN',
          success: false,
          failureReason: 'Invalid credentials',
        });
        return ApplicationResult.failure('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // 2. Generate JWT tokens
      const tokens = await this.jwtService.generateAdminToken(authResult.admin.id, authResult.admin.role);

      // 3. Log successful login attempt
      await this.auditService.logLoginAttempt({
        emailOrUsername: request.username,
        actorType: 'ADMIN',
        success: true,
      });

      // 4. Return response
      return ApplicationResult.success({
        accessToken: tokens.accessToken,
        refreshToken: tokens.accessToken, // Note: Current JWT service doesn't have separate refresh tokens
        admin: {
          id: authResult.admin.id,
          username: authResult.admin.username,
          role: authResult.admin.role,
        },
      });
    } catch (error) {
      // Log failed login attempt for any error
      await this.auditService.logLoginAttempt({
        emailOrUsername: request.username,
        actorType: 'ADMIN',
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