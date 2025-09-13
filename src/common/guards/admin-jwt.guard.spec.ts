import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminJwtGuard } from './admin-jwt.guard';
import { JwtService } from '../../infrastructure/auth/jwt.service';
import { AdminRole } from '../../domains/admin/entities/admin.entity';

describe('AdminJwtGuard', () => {
  let guard: AdminJwtGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminJwtGuard,
        {
          provide: JwtService,
          useValue: {
            extractTokenFromHeader: jest.fn(),
            verifyAdminToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminJwtGuard>(AdminJwtGuard);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (authHeader?: string): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access with valid admin token', async () => {
      const authHeader = 'Bearer valid-admin-token';
      const token = 'valid-admin-token';
      const payload = {
        sub: 'admin-123',
        role: AdminRole.ADMIN,
        type: 'admin' as const,
      };

      const context = createMockExecutionContext(authHeader);
      const request = context.switchToHttp().getRequest();

      jwtService.extractTokenFromHeader.mockReturnValue(token);
      jwtService.verifyAdminToken.mockResolvedValue(payload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.extractTokenFromHeader).toHaveBeenCalledWith(authHeader);
      expect(jwtService.verifyAdminToken).toHaveBeenCalledWith(token);
      expect((request as any).user).toEqual({
        id: payload.sub,
        role: payload.role,
        type: payload.type,
      });
    });

    it('should allow access with super admin token', async () => {
      const authHeader = 'Bearer valid-super-admin-token';
      const token = 'valid-super-admin-token';
      const payload = {
        sub: 'admin-456',
        role: AdminRole.SUPER_ADMIN,
        type: 'admin' as const,
      };

      const context = createMockExecutionContext(authHeader);
      const request = context.switchToHttp().getRequest();

      jwtService.extractTokenFromHeader.mockReturnValue(token);
      jwtService.verifyAdminToken.mockResolvedValue(payload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect((request as any).user).toEqual({
        id: payload.sub,
        role: payload.role,
        type: payload.type,
      });
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const context = createMockExecutionContext();

      jwtService.extractTokenFromHeader.mockReturnValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Access token is required')
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const authHeader = 'Bearer invalid-token';
      const token = 'invalid-token';

      const context = createMockExecutionContext(authHeader);

      jwtService.extractTokenFromHeader.mockReturnValue(token);
      jwtService.verifyAdminToken.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired token')
      );
    });

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      const context = createMockExecutionContext(undefined);

      jwtService.extractTokenFromHeader.mockReturnValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Access token is required')
      );
    });
  });
});