import { Test, TestingModule } from '@nestjs/testing';
import { PrivilegeService } from './privilege.service';
import { PointService } from '../../point/services/point.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PrivilegeRepository } from '../repositories/privilege.repository';
import { MemberPrivilegeRepository } from '../repositories/member-privilege.repository';
import { BusinessRuleException, NotFoundExceptionDomain } from '../../../common/exceptions/domain.exception';
import { Privilege, MemberPrivilege, Member, Point, PointType } from '@prisma/client';

describe('PrivilegeService - Exchange Integration', () => {
  let service: PrivilegeService;
  let pointService: PointService;
  let prisma: PrismaService;
  let module: TestingModule;

  // Test data
  const testMember: Partial<Member> = {
    id: 'test-member-1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
  };

  const testPrivilege: Partial<Privilege> = {
    id: 'test-privilege-1',
    name: 'Premium Access',
    description: 'Access to premium features',
    pointCost: new (require('@prisma/client').Prisma.Decimal)(100),
    isActive: true,
    validityDays: 30,
  };

  const expensivePrivilege: Partial<Privilege> = {
    id: 'test-privilege-2',
    name: 'VIP Access',
    description: 'VIP level access',
    pointCost: new (require('@prisma/client').Prisma.Decimal)(500),
    isActive: true,
    validityDays: 60,
  };

  beforeAll(async () => {
    // Mock PrismaService for integration testing
    const mockPrismaService = {
      privilege: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      memberPrivilege: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      point: {
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn(),
      },
      member: {
        findUnique: jest.fn(),
      },
    };

    // Mock PointService methods
    const mockPointService = {
      getAvailableBalance: jest.fn(),
      exchangePoints: jest.fn(),
      addPoints: jest.fn(),
      deductPoints: jest.fn(),
      getPointHistory: jest.fn(),
      getPointBalance: jest.fn(),
      processExpiredPoints: jest.fn(),
      getExpiringPoints: jest.fn(),
      validateSufficientPoints: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        PrivilegeService,
        PrivilegeRepository,
        MemberPrivilegeRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: 'IPrivilegeRepository',
          useClass: PrivilegeRepository,
        },
        {
          provide: 'IMemberPrivilegeRepository',
          useClass: MemberPrivilegeRepository,
        },
        {
          provide: 'IPointService',
          useValue: mockPointService,
        },
      ],
    }).compile();

    service = module.get<PrivilegeService>(PrivilegeService);
    pointService = module.get('IPointService');
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FIFO Point Exchange Scenarios', () => {
    it('should exchange privilege using FIFO point deduction', async () => {
      // Setup: Member has 150 points available
      const mockPoints: Point[] = [
        {
          id: 'point-1',
          memberId: testMember.id!,
          amount: new (require('@prisma/client').Prisma.Decimal)(80),
          type: PointType.EARNED,
          description: 'First batch',
          expiresAt: new Date('2024-12-31'),
          isExpired: false,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'point-2',
          memberId: testMember.id!,
          amount: new (require('@prisma/client').Prisma.Decimal)(70),
          type: PointType.EARNED,
          description: 'Second batch',
          expiresAt: new Date('2024-12-31'),
          isExpired: false,
          createdAt: new Date('2024-01-02'),
        },
      ];

      // Mock repository responses
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(testPrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(150);
      (pointService.exchangePoints as jest.Mock).mockResolvedValue(undefined);
      (prisma.memberPrivilege.create as jest.Mock).mockResolvedValue({
        id: 'new-member-privilege',
        memberId: testMember.id,
        privilegeId: testPrivilege.id,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      });

      const result = await service.exchangePrivilege({
        memberId: testMember.id!,
        privilegeId: testPrivilege.id!,
      });

      expect(pointService.exchangePoints).toHaveBeenCalledWith(
        testMember.id,
        100,
        'Premium Access'
      );
      expect(result.privilegeName).toBe('Premium Access');
      expect(result.pointsDeducted).toBe(100);
      expect(result.expiresAt).toBeDefined();
    });

    it('should handle insufficient points scenario', async () => {
      // Setup: Member has only 50 points, but privilege costs 100
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(testPrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(50);

      await expect(
        service.exchangePrivilege({
          memberId: testMember.id!,
          privilegeId: testPrivilege.id!,
        })
      ).rejects.toThrow(BusinessRuleException);

      expect(pointService.exchangePoints).not.toHaveBeenCalled();
    });

    it('should handle expensive privilege exchange', async () => {
      // Setup: Member has exactly enough points for expensive privilege
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(expensivePrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(500);
      (pointService.exchangePoints as jest.Mock).mockResolvedValue(undefined);
      (prisma.memberPrivilege.create as jest.Mock).mockResolvedValue({
        id: 'new-member-privilege-vip',
        memberId: testMember.id,
        privilegeId: expensivePrivilege.id,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true,
      });

      const result = await service.exchangePrivilege({
        memberId: testMember.id!,
        privilegeId: expensivePrivilege.id!,
      });

      expect(pointService.exchangePoints).toHaveBeenCalledWith(
        testMember.id,
        500,
        'VIP Access'
      );
      expect(result.privilegeName).toBe('VIP Access');
      expect(result.pointsDeducted).toBe(500);
    });
  });

  describe('Privilege Validation Scenarios', () => {
    it('should prevent exchange of inactive privilege', async () => {
      const inactivePrivilege = { ...testPrivilege, isActive: false };
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(inactivePrivilege);

      await expect(
        service.exchangePrivilege({
          memberId: testMember.id!,
          privilegeId: testPrivilege.id!,
        })
      ).rejects.toThrow(BusinessRuleException);
    });

    it('should prevent duplicate active privilege exchange', async () => {
      const activeMemberPrivilege: MemberPrivilege = {
        id: 'existing-privilege',
        memberId: testMember.id!,
        privilegeId: testPrivilege.id!,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        isActive: true,
      };

      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(testPrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(activeMemberPrivilege);

      await expect(
        service.exchangePrivilege({
          memberId: testMember.id!,
          privilegeId: testPrivilege.id!,
        })
      ).rejects.toThrow(BusinessRuleException);
    });

    it('should allow exchange if previous privilege is expired', async () => {
      const expiredMemberPrivilege: MemberPrivilege = {
        id: 'expired-privilege',
        memberId: testMember.id!,
        privilegeId: testPrivilege.id!,
        grantedAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-01-31'), // Expired
        isActive: true,
      };

      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(testPrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(expiredMemberPrivilege);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(150);
      (pointService.exchangePoints as jest.Mock).mockResolvedValue(undefined);
      (prisma.memberPrivilege.create as jest.Mock).mockResolvedValue({
        id: 'new-member-privilege-after-expired',
        memberId: testMember.id,
        privilegeId: testPrivilege.id,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      });

      const result = await service.exchangePrivilege({
        memberId: testMember.id!,
        privilegeId: testPrivilege.id!,
      });

      expect(result.privilegeName).toBe('Premium Access');
      expect(pointService.exchangePoints).toHaveBeenCalled();
    });
  });

  describe('Permanent Privilege Scenarios', () => {
    it('should handle permanent privilege (no expiration)', async () => {
      const permanentPrivilege = { ...testPrivilege, validityDays: null };
      
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(permanentPrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(150);
      (pointService.exchangePoints as jest.Mock).mockResolvedValue(undefined);
      (prisma.memberPrivilege.create as jest.Mock).mockResolvedValue({
        id: 'permanent-member-privilege',
        memberId: testMember.id,
        privilegeId: permanentPrivilege.id,
        grantedAt: new Date(),
        expiresAt: null, // Permanent
        isActive: true,
      });

      const result = await service.exchangePrivilege({
        memberId: testMember.id!,
        privilegeId: permanentPrivilege.id!,
      });

      expect(result.expiresAt).toBeUndefined();
      expect(result.privilegeName).toBe('Premium Access');
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle non-existent privilege', async () => {
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.exchangePrivilege({
          memberId: testMember.id!,
          privilegeId: 'non-existent-privilege',
        })
      ).rejects.toThrow(NotFoundExceptionDomain);
    });

    it('should handle point service failures', async () => {
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(testPrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(150);
      (pointService.exchangePoints as jest.Mock).mockRejectedValue(new Error('Point service error'));

      await expect(
        service.exchangePrivilege({
          memberId: testMember.id!,
          privilegeId: testPrivilege.id!,
        })
      ).rejects.toThrow('Point service error');
    });

    it('should handle member privilege creation failures', async () => {
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(testPrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(150);
      (pointService.exchangePoints as jest.Mock).mockResolvedValue(undefined);
      (prisma.memberPrivilege.create as jest.Mock).mockRejectedValue(new Error('Database constraint violation'));

      await expect(
        service.exchangePrivilege({
          memberId: testMember.id!,
          privilegeId: testPrivilege.id!,
        })
      ).rejects.toThrow('Database constraint violation');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero point cost privilege', async () => {
      const freePrivilege = { ...testPrivilege, pointCost: new (require('@prisma/client').Prisma.Decimal)(0) };
      
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(freePrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(0);
      (pointService.exchangePoints as jest.Mock).mockResolvedValue(undefined);
      (prisma.memberPrivilege.create as jest.Mock).mockResolvedValue({
        id: 'free-member-privilege',
        memberId: testMember.id,
        privilegeId: freePrivilege.id,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      });

      const result = await service.exchangePrivilege({
        memberId: testMember.id!,
        privilegeId: freePrivilege.id!,
      });

      expect(result.pointsDeducted).toBe(0);
      expect(pointService.exchangePoints).toHaveBeenCalledWith(testMember.id, 0, 'Premium Access');
    });

    it('should handle large point amounts within limit', async () => {
      const expensivePrivilege = { 
        ...testPrivilege, 
        pointCost: new (require('@prisma/client').Prisma.Decimal)(50000) 
      };
      
      (prisma.privilege.findUnique as jest.Mock).mockResolvedValue(expensivePrivilege);
      (prisma.memberPrivilege.findUnique as jest.Mock).mockResolvedValue(null);
      (pointService.getAvailableBalance as jest.Mock).mockResolvedValue(60000);
      (pointService.exchangePoints as jest.Mock).mockResolvedValue(undefined);
      (prisma.memberPrivilege.create as jest.Mock).mockResolvedValue({
        id: 'expensive-member-privilege',
        memberId: testMember.id,
        privilegeId: expensivePrivilege.id,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      });

      const result = await service.exchangePrivilege({
        memberId: testMember.id!,
        privilegeId: expensivePrivilege.id!,
      });

      expect(result.pointsDeducted).toBe(50000);
    });
  });
});