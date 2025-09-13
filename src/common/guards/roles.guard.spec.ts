import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AdminRole } from '../../domains/admin/entities/admin.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    const mockRequest = { user };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockExecutionContext();

      reflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should allow access when admin has required role', () => {
      const user = {
        id: 'admin-123',
        role: AdminRole.ADMIN,
        type: 'admin',
      };
      const context = createMockExecutionContext(user);

      reflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when super admin has admin role requirement', () => {
      const user = {
        id: 'admin-123',
        role: AdminRole.SUPER_ADMIN,
        type: 'admin',
      };
      const context = createMockExecutionContext(user);

      reflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not admin', () => {
      const user = {
        id: 'member-123',
        type: 'member',
      };
      const context = createMockExecutionContext(user);

      reflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Admin access required')
      );
    });

    it('should throw ForbiddenException when no user in request', () => {
      const context = createMockExecutionContext();

      reflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Admin access required')
      );
    });

    it('should throw ForbiddenException when admin does not have required role', () => {
      const user = {
        id: 'admin-123',
        role: AdminRole.ADMIN,
        type: 'admin',
      };
      const context = createMockExecutionContext(user);

      reflector.getAllAndOverride.mockReturnValue([AdminRole.SUPER_ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Required roles: SUPER_ADMIN')
      );
    });

    it('should allow access when admin has one of multiple required roles', () => {
      const user = {
        id: 'admin-123',
        role: AdminRole.ADMIN,
        type: 'admin',
      };
      const context = createMockExecutionContext(user);

      reflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN, AdminRole.SUPER_ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException with multiple required roles message', () => {
      const user = {
        id: 'admin-123',
        role: AdminRole.ADMIN,
        type: 'admin',
      };
      const context = createMockExecutionContext(user);

      reflector.getAllAndOverride.mockReturnValue([AdminRole.SUPER_ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Required roles: SUPER_ADMIN')
      );
    });
  });
});