import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminService } from '../../domains/admin/services/admin.service';
import { JwtService } from '../../infrastructure/auth/jwt.service';
import { AdminLoginDto, AdminLoginResponseDto } from '../../domains/admin/dto/admin-auth.dto';
import { ApiSuccessResponse } from '../../common/interfaces/api-response.interface';
import { AuditService } from '../../domains/audit/services/audit.service';
import { ActorType } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Admin login',
    description: 'Authenticate an administrator and return JWT token'
  })
  @ApiBody({
    type: AdminLoginDto,
    description: 'Admin login credentials',
    examples: {
      example1: {
        summary: 'Admin login example',
        value: {
          emailOrUsername: 'admin@example.com',
          password: 'securePassword123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clm123456789' },
            email: { type: 'string', example: 'admin@example.com' },
            username: { type: 'string', example: 'admin' },
            role: { type: 'string', example: 'ADMIN' },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn: { type: 'number', example: 28800 }
          }
        },
        message: { type: 'string', example: 'Login successful' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            traceId: { type: 'string', example: 'generated-trace-id' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'AUTHENTICATION_FAILED' },
            message: { type: 'string', example: 'Invalid credentials' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            traceId: { type: 'string', example: 'generated-trace-id' }
          }
        }
      }
    }
  })
  async login(@Body() loginDto: AdminLoginDto, @Req() req: Request): Promise<ApiSuccessResponse<AdminLoginResponseDto>> {
    this.logger.log(`Admin login attempt for: ${loginDto.emailOrUsername}`);

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    try {
      const authResult = await this.adminService.authenticateAdmin({
        emailOrUsername: loginDto.emailOrUsername,
        password: loginDto.password,
      });

      if (!authResult.isAuthenticated) {
        // Log failed login attempt
        await this.auditService.logLoginAttempt({
          emailOrUsername: loginDto.emailOrUsername,
          actorType: ActorType.ADMIN,
          success: false,
          failureReason: 'invalid_credentials',
          ipAddress,
          userAgent,
        });

        this.logger.warn(`Failed login attempt for: ${loginDto.emailOrUsername}`);
        throw new Error('Authentication failed');
      }

      // Generate JWT token
      const tokens = await this.jwtService.generateAdminToken(
        authResult.admin.id,
        authResult.admin.role
      );
      const expiresIn = 8 * 60 * 60; // 8 hours in seconds

      // Log successful login attempt
      await this.auditService.logLoginAttempt({
        emailOrUsername: loginDto.emailOrUsername,
        actorType: ActorType.ADMIN,
        success: true,
        ipAddress,
        userAgent,
      });

      this.logger.log(`Successful admin login for: ${authResult.admin.username}`);

      const responseData: AdminLoginResponseDto = {
        id: authResult.admin.id,
        email: authResult.admin.email,
        username: authResult.admin.username,
        role: authResult.admin.role,
        accessToken: tokens.accessToken,
        expiresIn,
      };

      return {
        success: true,
        data: responseData,
        message: 'Login successful',
        meta: {
          timestamp: new Date().toISOString(),
          traceId: 'generated-trace-id', // This would be generated by interceptor
        },
      };
    } catch (error) {
      // Log failed login attempt if not already logged
      if (error instanceof Error && error.message === 'Authentication failed') {
        // Already logged above
      } else {
        await this.auditService.logLoginAttempt({
          emailOrUsername: loginDto.emailOrUsername,
          actorType: ActorType.ADMIN,
          success: false,
          failureReason: 'system_error',
          ipAddress,
          userAgent,
        });
      }
      throw error;
    }
  }
}