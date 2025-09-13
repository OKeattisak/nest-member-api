import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('PasswordService', () => {
  let service: PasswordService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(12),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should throw error for empty password', async () => {
      await expect(service.hash('')).rejects.toThrow('Password is required');
      await expect(service.hash('   ')).rejects.toThrow('Password is required');
    });

    it('should throw error for null/undefined password', async () => {
      await expect(service.hash(null as any)).rejects.toThrow('Password is required');
      await expect(service.hash(undefined as any)).rejects.toThrow('Password is required');
    });
  });

  describe('verify', () => {
    it('should verify password successfully', async () => {
      const password = 'testPassword123!';
      const hash = 'hashedPassword';
      
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.verify(password, hash);

      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPassword';
      
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.verify(password, hash);

      expect(result).toBe(false);
    });

    it('should return false for empty password or hash', async () => {
      expect(await service.verify('', 'hash')).toBe(false);
      expect(await service.verify('password', '')).toBe(false);
      expect(await service.verify(null as any, 'hash')).toBe(false);
      expect(await service.verify('password', null as any)).toBe(false);
    });

    it('should return false when bcrypt throws error', async () => {
      const password = 'testPassword123!';
      const hash = 'hashedPassword';
      
      mockedBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);

      const result = await service.verify(password, hash);

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const password = 'StrongPass123!';
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without lowercase letter', () => {
      const password = 'STRONGPASS123!';
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const password = 'strongpass123!';
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const password = 'StrongPass!';
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const password = 'StrongPass123';
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject password that is too short', () => {
      const password = 'Short1!';
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password that is too long', () => {
      const password = 'A'.repeat(129); // 129 characters total
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot exceed 128 characters');
    });

    it('should reject null/undefined password', () => {
      expect(service.validatePasswordStrength(null as any).errors).toContain('Password is required');
      expect(service.validatePasswordStrength(undefined as any).errors).toContain('Password is required');
    });

    it('should return multiple errors for weak password', () => {
      const password = 'weak';
      
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});