import { Test, TestingModule } from '@nestjs/testing';
import { PrivilegeService } from './privilege.service';
import { IPrivilegeRepository, IMemberPrivilegeRepository } from '../repositories/privilege.repository.interface';
import { PointService } from '../../point/services/point.service';
import { BusinessRuleException, NotFoundExceptionDomain, ValidationException } from '../../../common/exceptions/domain.exception';
import { Privilege as PrismaPrivilege, MemberPrivilege as PrismaMemberPrivilege } from '@prisma/client';

describe('PrivilegeService', () => {
  let service: PrivilegeService;
  let privilegeRepository: jest.Mocked<IPrivilegeRepository>;
  let memberPrivilegeRepository: jest.Mocked<IMemberPrivilegeRepository>;
  let pointService: jest.Mocked<PointService>;

  const mockPrivilege: PrismaPrivilege = {
    id: 'privilege-1',
    name: 'Premium Access',
    description: 'Access to premium features',
    pointCost: new (require('@prisma/client').Prisma.Decimal)(100),
    isActive: true,
    validityDays: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockMemberPrivilege: PrismaMemberPrivilege = {
    id: 'member-privilege-1',
    memberId: 'member-1',
    privilegeId: 'privilege-1',
    grantedAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-02-01'),
    isActive: true,
  };

  beforeEach(async () => {
    const mockPrivilegeRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findActivePrivileges: jest.fn(),
      existsByName: jest.fn(),
    };

    const mockMemberPrivilegeRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      findByMemberId: jest.fn(),
      findByMemberAndPrivilege: jest.fn(),
      findActiveMemberPrivileges: jest.fn(),
      expireMemberPrivilege: jest.fn(),
      findExpiringPrivileges: jest.fn(),
      deactivateMemberPrivilege: jest.fn(),
    };

    const mockPointService = {
      addPoints: jest.fn(),
      deductPoints: jest.fn(),
      exchangePoints: jest.fn(),
      getAvailableBalance: jest.fn(),
      getPointHistory: jest.fn(),
      getPointBalance: jest.fn(),
      processExpiredPoints: jest.fn(),
      getExpiringPoints: jest.fn(),
      validateSufficientPoints: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivilegeService,
        {
          provide: 'IPrivilegeRepository',
          useValue: mockPrivilegeRepository,
        },
        {
          provide: 'IMemberPrivilegeRepository',
          useValue: mockMemberPrivilegeRepository,
        },
        {
          provide: 'IPointService',
          useValue: mockPointService,
        },
      ],
    }).compile();

    service = module.get<PrivilegeService>(PrivilegeService);
    privilegeRepository = module.get('IPrivilegeRepository');
    memberPrivilegeRepository = module.get('IMemberPrivilegeRepository');
    pointService = module.get('IPointService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPrivilege', () => {
    const createData = {
      name: 'Premium Access',
      description: 'Access to premium features',
      pointCost: 100,
      validityDays: 30,
    };

    it('should create a new privilege successfully', async () => {
      privilegeRepository.findByName.mockResolvedValue(null);
      privilegeRepository.create.mockResolvedValue(mockPrivilege);

      const result = await service.createPrivilege(createData);

      expect(privilegeRepository.findByName).toHaveBeenCalledWith(createData.name);
      expect(privilegeRepository.create).toHaveBeenCalledWith(createData);
      expect(result.name).toBe(mockPrivilege.name);
      expect(result.pointCost).toBe(Number(mockPrivilege.pointCost));
    });

    it('should throw ValidationException if privilege name already exists', async () => {
      privilegeRepository.findByName.mockResolvedValue(mockPrivilege);

      await expect(service.createPrivilege(createData)).rejects.toThrow(ValidationException);
      expect(privilegeRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if privilege creation fails', async () => {
      privilegeRepository.findByName.mockResolvedValue(null);
      privilegeRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createPrivilege(createData)).rejects.toThrow('Database error');
    });
  });

  describe('updatePrivilege', () => {
    const updateData = {
      name: 'Updated Premium Access',
      pointCost: 150,
    };

    it('should update privilege successfully', async () => {
      const updatedPrivilege = { 
        ...mockPrivilege, 
        name: updateData.name!,
        pointCost: new (require('@prisma/client').Prisma.Decimal)(updateData.pointCost!)
      };
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      privilegeRepository.findByName.mockResolvedValue(null);
      privilegeRepository.update.mockResolvedValue(updatedPrivilege);

      const result = await service.updatePrivilege('privilege-1', updateData);

      expect(privilegeRepository.findById).toHaveBeenCalledWith('privilege-1');
      expect(privilegeRepository.update).toHaveBeenCalledWith('privilege-1', updateData);
      expect(result.name).toBe(updateData.name);
    });

    it('should throw NotFoundExceptionDomain if privilege does not exist', async () => {
      privilegeRepository.findById.mockResolvedValue(null);

      await expect(service.updatePrivilege('privilege-1', updateData)).rejects.toThrow(NotFoundExceptionDomain);
      expect(privilegeRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ValidationException if new name already exists', async () => {
      const existingPrivilege = { ...mockPrivilege, id: 'different-id' };
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      privilegeRepository.findByName.mockResolvedValue(existingPrivilege);

      await expect(service.updatePrivilege('privilege-1', updateData)).rejects.toThrow(ValidationException);
      expect(privilegeRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getAvailablePrivileges', () => {
    it('should return list of active privileges', async () => {
      const activePrivileges = [mockPrivilege];
      privilegeRepository.findActivePrivileges.mockResolvedValue(activePrivileges);

      const result = await service.getAvailablePrivileges();

      expect(privilegeRepository.findActivePrivileges).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe(mockPrivilege.name);
    });

    it('should handle empty result', async () => {
      privilegeRepository.findActivePrivileges.mockResolvedValue([]);

      const result = await service.getAvailablePrivileges();

      expect(result).toHaveLength(0);
    });
  });

  describe('activatePrivilege', () => {
    it('should activate inactive privilege', async () => {
      const inactivePrivilege = { ...mockPrivilege, isActive: false };
      const activatedPrivilege = { ...mockPrivilege, isActive: true };
      
      privilegeRepository.findById.mockResolvedValue(inactivePrivilege);
      privilegeRepository.update.mockResolvedValue(activatedPrivilege);

      const result = await service.activatePrivilege('privilege-1');

      expect(privilegeRepository.update).toHaveBeenCalledWith('privilege-1', { isActive: true });
      expect(result.isActive).toBe(true);
    });

    it('should throw error if privilege is already active', async () => {
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);

      await expect(service.activatePrivilege('privilege-1')).rejects.toThrow('Privilege is already active');
    });
  });

  describe('deactivatePrivilege', () => {
    it('should deactivate active privilege', async () => {
      const deactivatedPrivilege = { ...mockPrivilege, isActive: false };
      
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      privilegeRepository.update.mockResolvedValue(deactivatedPrivilege);

      const result = await service.deactivatePrivilege('privilege-1');

      expect(privilegeRepository.update).toHaveBeenCalledWith('privilege-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should throw error if privilege is already inactive', async () => {
      const inactivePrivilege = { ...mockPrivilege, isActive: false };
      privilegeRepository.findById.mockResolvedValue(inactivePrivilege);

      await expect(service.deactivatePrivilege('privilege-1')).rejects.toThrow('Privilege is already inactive');
    });
  });

  describe('exchangePrivilege', () => {
    const exchangeData = {
      memberId: 'member-1',
      privilegeId: 'privilege-1',
    };

    it('should exchange privilege successfully', async () => {
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      memberPrivilegeRepository.findByMemberAndPrivilege.mockResolvedValue(null);
      pointService.getAvailableBalance.mockResolvedValue(150);
      pointService.exchangePoints.mockResolvedValue(undefined);
      memberPrivilegeRepository.create.mockResolvedValue(mockMemberPrivilege);

      const result = await service.exchangePrivilege(exchangeData);

      expect(privilegeRepository.findById).toHaveBeenCalledWith('privilege-1');
      expect(pointService.getAvailableBalance).toHaveBeenCalledWith('member-1');
      expect(pointService.exchangePoints).toHaveBeenCalledWith('member-1', 100, 'Premium Access');
      expect(memberPrivilegeRepository.create).toHaveBeenCalled();
      expect(result.privilegeName).toBe('Premium Access');
      expect(result.pointsDeducted).toBe(100);
    });

    it('should throw NotFoundExceptionDomain if privilege does not exist', async () => {
      privilegeRepository.findById.mockResolvedValue(null);

      await expect(service.exchangePrivilege(exchangeData)).rejects.toThrow(NotFoundExceptionDomain);
    });

    it('should throw BusinessRuleException if privilege is not active', async () => {
      const inactivePrivilege = { ...mockPrivilege, isActive: false };
      privilegeRepository.findById.mockResolvedValue(inactivePrivilege);

      await expect(service.exchangePrivilege(exchangeData)).rejects.toThrow(BusinessRuleException);
    });

    it('should throw BusinessRuleException if member already has active privilege', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days in the future
      const activeMemberPrivilege = { ...mockMemberPrivilege, expiresAt: futureDate };
      
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      memberPrivilegeRepository.findByMemberAndPrivilege.mockResolvedValue(activeMemberPrivilege);

      await expect(service.exchangePrivilege(exchangeData)).rejects.toThrow(BusinessRuleException);
    });

    it('should throw BusinessRuleException if member has insufficient points', async () => {
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      memberPrivilegeRepository.findByMemberAndPrivilege.mockResolvedValue(null);
      pointService.getAvailableBalance.mockResolvedValue(50); // Less than required 100

      await expect(service.exchangePrivilege(exchangeData)).rejects.toThrow(BusinessRuleException);
      expect(pointService.exchangePoints).not.toHaveBeenCalled();
    });

    it('should allow exchange if member has expired privilege', async () => {
      const expiredMemberPrivilege = { ...mockMemberPrivilege, expiresAt: new Date('2023-01-01') };
      
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      memberPrivilegeRepository.findByMemberAndPrivilege.mockResolvedValue(expiredMemberPrivilege);
      pointService.getAvailableBalance.mockResolvedValue(150);
      pointService.exchangePoints.mockResolvedValue(undefined);
      memberPrivilegeRepository.create.mockResolvedValue(mockMemberPrivilege);

      const result = await service.exchangePrivilege(exchangeData);

      expect(result.privilegeName).toBe('Premium Access');
    });
  });

  describe('getMemberPrivileges', () => {
    it('should return member privileges with details', async () => {
      const memberPrivilegeWithDetails = {
        ...mockMemberPrivilege,
        privilege: mockPrivilege,
      };
      
      memberPrivilegeRepository.findByMemberId.mockResolvedValue([memberPrivilegeWithDetails]);

      const result = await service.getMemberPrivileges('member-1');

      expect(memberPrivilegeRepository.findByMemberId).toHaveBeenCalledWith('member-1');
      expect(result).toHaveLength(1);
      expect(result[0]?.privilegeName).toBe('Premium Access');
      expect(result[0]?.pointCost).toBe(100);
    });

    it('should calculate days remaining correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const memberPrivilegeWithDetails = {
        ...mockMemberPrivilege,
        expiresAt: futureDate,
        privilege: mockPrivilege,
      };
      
      memberPrivilegeRepository.findByMemberId.mockResolvedValue([memberPrivilegeWithDetails]);

      const result = await service.getMemberPrivileges('member-1');

      expect(result[0]?.daysRemaining).toBe(10);
      expect(result[0]?.isExpired).toBe(false);
    });

    it('should mark expired privileges correctly', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const memberPrivilegeWithDetails = {
        ...mockMemberPrivilege,
        expiresAt: pastDate,
        privilege: mockPrivilege,
      };
      
      memberPrivilegeRepository.findByMemberId.mockResolvedValue([memberPrivilegeWithDetails]);

      const result = await service.getMemberPrivileges('member-1');

      expect(result[0]?.isExpired).toBe(true);
      expect(result[0]?.isActive).toBe(false);
      expect(result[0]?.daysRemaining).toBeUndefined();
    });
  });

  describe('getActiveMemberPrivileges', () => {
    it('should return only active member privileges', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future
      
      const activeMemberPrivilegeWithDetails = {
        ...mockMemberPrivilege,
        expiresAt: futureDate, // Make sure it's not expired
        privilege: mockPrivilege,
      };
      
      memberPrivilegeRepository.findActiveMemberPrivileges.mockResolvedValue([activeMemberPrivilegeWithDetails]);

      const result = await service.getActiveMemberPrivileges('member-1');

      expect(memberPrivilegeRepository.findActiveMemberPrivileges).toHaveBeenCalledWith('member-1');
      expect(result).toHaveLength(1);
      expect(result[0]?.isActive).toBe(true);
    });
  });

  describe('deactivateMemberPrivilege', () => {
    it('should deactivate member privilege successfully', async () => {
      memberPrivilegeRepository.findById.mockResolvedValue(mockMemberPrivilege);
      memberPrivilegeRepository.deactivateMemberPrivilege.mockResolvedValue(undefined);

      await service.deactivateMemberPrivilege('member-privilege-1');

      expect(memberPrivilegeRepository.findById).toHaveBeenCalledWith('member-privilege-1');
      expect(memberPrivilegeRepository.deactivateMemberPrivilege).toHaveBeenCalledWith('member-privilege-1');
    });

    it('should throw NotFoundExceptionDomain if member privilege does not exist', async () => {
      memberPrivilegeRepository.findById.mockResolvedValue(null);

      await expect(service.deactivateMemberPrivilege('member-privilege-1')).rejects.toThrow(NotFoundExceptionDomain);
    });

    it('should throw BusinessRuleException if member privilege is already inactive', async () => {
      const inactiveMemberPrivilege = { ...mockMemberPrivilege, isActive: false };
      memberPrivilegeRepository.findById.mockResolvedValue(inactiveMemberPrivilege);

      await expect(service.deactivateMemberPrivilege('member-privilege-1')).rejects.toThrow(BusinessRuleException);
    });
  });

  describe('processExpiredMemberPrivileges', () => {
    it('should process expired member privileges successfully', async () => {
      const expiredPrivileges = [mockMemberPrivilege];
      memberPrivilegeRepository.findExpiringPrivileges.mockResolvedValue(expiredPrivileges);
      memberPrivilegeRepository.expireMemberPrivilege.mockResolvedValue(undefined);

      const result = await service.processExpiredMemberPrivileges();

      expect(memberPrivilegeRepository.findExpiringPrivileges).toHaveBeenCalledWith(0);
      expect(memberPrivilegeRepository.expireMemberPrivilege).toHaveBeenCalledWith('member-privilege-1');
      expect(result.processed).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors during processing', async () => {
      const expiredPrivileges = [mockMemberPrivilege];
      memberPrivilegeRepository.findExpiringPrivileges.mockResolvedValue(expiredPrivileges);
      memberPrivilegeRepository.expireMemberPrivilege.mockRejectedValue(new Error('Database error'));

      const result = await service.processExpiredMemberPrivileges();

      expect(result.processed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Database error');
    });

    it('should return early if no expired privileges found', async () => {
      memberPrivilegeRepository.findExpiringPrivileges.mockResolvedValue([]);

      const result = await service.processExpiredMemberPrivileges();

      expect(result.processed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(memberPrivilegeRepository.expireMemberPrivilege).not.toHaveBeenCalled();
    });
  });

  describe('deletePrivilege', () => {
    it('should delete privilege successfully', async () => {
      privilegeRepository.findById.mockResolvedValue(mockPrivilege);
      privilegeRepository.delete.mockResolvedValue(undefined);

      await service.deletePrivilege('privilege-1');

      expect(privilegeRepository.findById).toHaveBeenCalledWith('privilege-1');
      expect(privilegeRepository.delete).toHaveBeenCalledWith('privilege-1');
    });

    it('should throw NotFoundExceptionDomain if privilege does not exist', async () => {
      privilegeRepository.findById.mockResolvedValue(null);

      await expect(service.deletePrivilege('privilege-1')).rejects.toThrow(NotFoundExceptionDomain);
      expect(privilegeRepository.delete).not.toHaveBeenCalled();
    });
  });
});