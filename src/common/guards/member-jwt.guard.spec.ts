import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MemberJwtGuard } from './member-jwt.guard';
import { JwtService } from '@/infrastructure/auth/jwt.service';

describe('MemberJwtGuard', () => {
  let guard: MemberJwtGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberJwtGuard,
        {
          provide: JwtService,
          useValue: {
            extractTokenFromHeader: jest.fn(),
            verifyMemberToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<MemberJwtGuard>(MemberJwtGuard);
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
    it('should allow access with valid member token', async () => {
      const authHeader = 'Bearer valid-token';
      const token = 'valid-token';
      const payload = {
        sub: 'member-123',
        type: 'member' as const,
      };

      const context = createMockExecutionContext(authHeader);
      const request = context.switchToHttp().getRequest();

      jwtService.extractTokenFromHeader.mockReturnValue(token);
      jwtService.verifyMemberToken.mockResolvedValue(payload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.extractTokenFromHeader).toHaveBeenCalledWith(authHeader);
      expect(jwtService.verifyMemberToken).toHaveBeenCalledWith(token);
      expect((request as any).user).toEqual({
        id: payload.sub,
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
      jwtService.verifyMemberToken.mockRejectedValue(new Error('Invalid token'));

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