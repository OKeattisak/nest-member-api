import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtService } from './jwt.service';
import { AdminRole } from '@/domains/admin/entities/admin.entity';

describe('JwtService', () => {
  let service: JwtService;
  let nestJwtService: jest.Mocked<NestJwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: NestJwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
    nestJwtService = module.get(NestJwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMemberToken', () => {
    it('should generate member token successfully', async () => {
      const memberId = 'member-123';
      const token = 'generated-token';
      const expiresIn = '24h';
      
      configService.get.mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'member-secret';
        if (key === 'JWT_EXPIRES_IN') return expiresIn;
        return null;
      });
      
      nestJwtService.signAsync.mockResolvedValue(token);

      const result = await service.generateMemberToken(memberId);

      expect(result).toEqual({
        accessToken: token,
        expiresIn,
      });
      
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: memberId,
          type: 'member',
        },
        {
          secret: 'member-secret',
          expiresIn,
        }
      );
    });
  });

  describe('generateAdminToken', () => {
    it('should generate admin token successfully', async () => {
      const adminId = 'admin-123';
      const role = AdminRole.ADMIN;
      const token = 'generated-admin-token';
      const expiresIn = '8h';
      
      configService.get.mockImplementation((key) => {
        if (key === 'ADMIN_JWT_SECRET') return 'admin-secret';
        if (key === 'ADMIN_JWT_EXPIRES_IN') return expiresIn;
        return null;
      });
      
      nestJwtService.signAsync.mockResolvedValue(token);

      const result = await service.generateAdminToken(adminId, role);

      expect(result).toEqual({
        accessToken: token,
        expiresIn,
      });
      
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: adminId,
          role,
          type: 'admin',
        },
        {
          secret: 'admin-secret',
          expiresIn,
        }
      );
    });
  });

  describe('verifyMemberToken', () => {
    it('should verify member token successfully', async () => {
      const token = 'valid-member-token';
      const payload = {
        sub: 'member-123',
        type: 'member' as const,
        iat: 1234567890,
        exp: 1234567890,
      };
      
      configService.get.mockReturnValue('member-secret');
      nestJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyMemberToken(token);

      expect(result).toEqual(payload);
      expect(nestJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'member-secret',
      });
    });

    it('should throw error for invalid token type', async () => {
      const token = 'invalid-token';
      const payload = {
        sub: 'admin-123',
        type: 'admin' as const,
        role: AdminRole.ADMIN,
      };
      
      configService.get.mockReturnValue('member-secret');
      nestJwtService.verifyAsync.mockResolvedValue(payload as any);

      await expect(service.verifyMemberToken(token)).rejects.toThrow('Invalid or expired member token');
    });

    it('should throw error when verification fails', async () => {
      const token = 'invalid-token';
      
      configService.get.mockReturnValue('member-secret');
      nestJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyMemberToken(token)).rejects.toThrow('Invalid or expired member token');
    });
  });

  describe('verifyAdminToken', () => {
    it('should verify admin token successfully', async () => {
      const token = 'valid-admin-token';
      const payload = {
        sub: 'admin-123',
        role: AdminRole.ADMIN,
        type: 'admin' as const,
        iat: 1234567890,
        exp: 1234567890,
      };
      
      configService.get.mockReturnValue('admin-secret');
      nestJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyAdminToken(token);

      expect(result).toEqual(payload);
      expect(nestJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'admin-secret',
      });
    });

    it('should throw error for invalid token type', async () => {
      const token = 'invalid-token';
      const payload = {
        sub: 'member-123',
        type: 'member' as const,
      };
      
      configService.get.mockReturnValue('admin-secret');
      nestJwtService.verifyAsync.mockResolvedValue(payload as any);

      await expect(service.verifyAdminToken(token)).rejects.toThrow('Invalid or expired admin token');
    });

    it('should throw error when verification fails', async () => {
      const token = 'invalid-token';
      
      configService.get.mockReturnValue('admin-secret');
      nestJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyAdminToken(token)).rejects.toThrow('Invalid or expired admin token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const authHeader = 'Bearer valid-token-123';
      
      const result = service.extractTokenFromHeader(authHeader);

      expect(result).toBe('valid-token-123');
    });

    it('should return null for invalid header format', () => {
      expect(service.extractTokenFromHeader('Invalid token-123')).toBeNull();
      expect(service.extractTokenFromHeader('Bearer')).toBeNull();
      expect(service.extractTokenFromHeader('token-123')).toBeNull();
    });

    it('should return null for undefined header', () => {
      expect(service.extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for empty header', () => {
      expect(service.extractTokenFromHeader('')).toBeNull();
    });
  });
});