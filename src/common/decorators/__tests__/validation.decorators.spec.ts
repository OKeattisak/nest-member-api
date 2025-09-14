import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  IsEmailUniqueConstraint,
  IsUsernameUniqueConstraint,
  IsStrongPasswordConstraint,
  IsValidPointAmountConstraint,
  MemberExistsConstraint,
  PrivilegeExistsConstraint,
} from '../validation.decorators';

describe('Validation Decorators', () => {
  let prismaService: PrismaService;
  let emailUniqueConstraint: IsEmailUniqueConstraint;
  let usernameUniqueConstraint: IsUsernameUniqueConstraint;
  let memberExistsConstraint: MemberExistsConstraint;
  let privilegeExistsConstraint: PrivilegeExistsConstraint;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            member: {
              findUnique: jest.fn(),
            },
            privilege: {
              findUnique: jest.fn(),
            },
          },
        },
        IsEmailUniqueConstraint,
        IsUsernameUniqueConstraint,
        MemberExistsConstraint,
        PrivilegeExistsConstraint,
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    emailUniqueConstraint = module.get<IsEmailUniqueConstraint>(IsEmailUniqueConstraint);
    usernameUniqueConstraint = module.get<IsUsernameUniqueConstraint>(IsUsernameUniqueConstraint);
    memberExistsConstraint = module.get<MemberExistsConstraint>(MemberExistsConstraint);
    privilegeExistsConstraint = module.get<PrivilegeExistsConstraint>(PrivilegeExistsConstraint);
  });

  describe('IsEmailUniqueConstraint', () => {
    it('should return true when email does not exist', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue(null);

      const result = await emailUniqueConstraint.validate('test@example.com', {} as any);

      expect(result).toBe(true);
      expect(prismaService.member.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return false when email already exists', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      } as any);

      const result = await emailUniqueConstraint.validate('test@example.com', {} as any);

      expect(result).toBe(false);
    });

    it('should return true for empty email', async () => {
      const result = await emailUniqueConstraint.validate('', {} as any);
      expect(result).toBe(true);
    });

    it('should normalize email case', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue(null);

      await emailUniqueConstraint.validate('TEST@EXAMPLE.COM', {} as any);

      expect(prismaService.member.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('IsUsernameUniqueConstraint', () => {
    it('should return true when username does not exist', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue(null);

      const result = await usernameUniqueConstraint.validate('testuser', {} as any);

      expect(result).toBe(true);
      expect(prismaService.member.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return false when username already exists', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue({
        id: '1',
        username: 'testuser',
      } as any);

      const result = await usernameUniqueConstraint.validate('testuser', {} as any);

      expect(result).toBe(false);
    });

    it('should trim whitespace from username', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue(null);

      await usernameUniqueConstraint.validate('  testuser  ', {} as any);

      expect(prismaService.member.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });
  });

  describe('IsStrongPasswordConstraint', () => {
    const constraint = new IsStrongPasswordConstraint();

    it('should return true for strong password', () => {
      const result = constraint.validate('StrongPass123!', {} as any);
      expect(result).toBe(true);
    });

    it('should return false for password without uppercase', () => {
      const result = constraint.validate('weakpass123!', {} as any);
      expect(result).toBe(false);
    });

    it('should return false for password without lowercase', () => {
      const result = constraint.validate('WEAKPASS123!', {} as any);
      expect(result).toBe(false);
    });

    it('should return false for password without digit', () => {
      const result = constraint.validate('WeakPass!', {} as any);
      expect(result).toBe(false);
    });

    it('should return false for password without special character', () => {
      const result = constraint.validate('WeakPass123', {} as any);
      expect(result).toBe(false);
    });

    it('should return false for password too short', () => {
      const result = constraint.validate('Weak1!', {} as any);
      expect(result).toBe(false);
    });

    it('should return false for password too long', () => {
      const longPassword = 'A'.repeat(130) + 'a1!';
      const result = constraint.validate(longPassword, {} as any);
      expect(result).toBe(false);
    });

    it('should return false for non-string password', () => {
      const result = constraint.validate(123 as any, {} as any);
      expect(result).toBe(false);
    });
  });

  describe('IsValidPointAmountConstraint', () => {
    const constraint = new IsValidPointAmountConstraint();

    it('should return true for valid point amount', () => {
      const result = constraint.validate(100.50, {} as any);
      expect(result).toBe(true);
    });

    it('should return false for negative amount', () => {
      const result = constraint.validate(-10, {} as any);
      expect(result).toBe(false);
    });

    it('should return false for zero amount', () => {
      const result = constraint.validate(0, {} as any);
      expect(result).toBe(false);
    });

    it('should return false for amount exceeding maximum', () => {
      const result = constraint.validate(1000000, {} as any);
      expect(result).toBe(false);
    });

    it('should return false for amount with more than 2 decimal places', () => {
      const result = constraint.validate(100.123, {} as any);
      expect(result).toBe(false);
    });

    it('should return false for NaN', () => {
      const result = constraint.validate(NaN, {} as any);
      expect(result).toBe(false);
    });

    it('should return false for Infinity', () => {
      const result = constraint.validate(Infinity, {} as any);
      expect(result).toBe(false);
    });

    it('should return false for non-number', () => {
      const result = constraint.validate('100' as any, {} as any);
      expect(result).toBe(false);
    });
  });

  describe('MemberExistsConstraint', () => {
    it('should return true when member exists and is active', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue({
        id: '1',
        isActive: true,
        deletedAt: null,
      } as any);

      const result = await memberExistsConstraint.validate('member-id', {} as any);

      expect(result).toBe(true);
      expect(prismaService.member.findUnique).toHaveBeenCalledWith({
        where: { id: 'member-id', isActive: true, deletedAt: null },
      });
    });

    it('should return false when member does not exist', async () => {
      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue(null);

      const result = await memberExistsConstraint.validate('member-id', {} as any);

      expect(result).toBe(false);
    });

    it('should return false for empty member ID', async () => {
      const result = await memberExistsConstraint.validate('', {} as any);
      expect(result).toBe(false);
    });
  });

  describe('PrivilegeExistsConstraint', () => {
    it('should return true when privilege exists and is active', async () => {
      jest.spyOn(prismaService.privilege, 'findUnique').mockResolvedValue({
        id: '1',
        isActive: true,
      } as any);

      const result = await privilegeExistsConstraint.validate('privilege-id', {} as any);

      expect(result).toBe(true);
      expect(prismaService.privilege.findUnique).toHaveBeenCalledWith({
        where: { id: 'privilege-id', isActive: true },
      });
    });

    it('should return false when privilege does not exist', async () => {
      jest.spyOn(prismaService.privilege, 'findUnique').mockResolvedValue(null);

      const result = await privilegeExistsConstraint.validate('privilege-id', {} as any);

      expect(result).toBe(false);
    });

    it('should return false for empty privilege ID', async () => {
      const result = await privilegeExistsConstraint.validate('', {} as any);
      expect(result).toBe(false);
    });
  });
});