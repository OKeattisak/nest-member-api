import { Test, TestingModule } from '@nestjs/testing';
import { PrivilegeRepository } from './privilege.repository';
import { MemberPrivilegeRepository } from './member-privilege.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('PrivilegeRepository Unit Tests', () => {
  let repository: PrivilegeRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      privilege: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivilegeRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrivilegeRepository>(PrivilegeRepository);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should call prisma.privilege.create with correct data', async () => {
      const createData = {
        name: 'Test Privilege',
        description: 'A test privilege',
        pointCost: 100,
        validityDays: 30,
      };
      const mockPrivilege = { id: 'privilege-id', ...createData };
      
      prismaService.privilege.create.mockResolvedValue(mockPrivilege as any);

      const result = await repository.create(createData);

      expect(prismaService.privilege.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: createData.description,
          pointCost: new Prisma.Decimal(createData.pointCost),
          validityDays: createData.validityDays,
        },
      });
      expect(result).toBe(mockPrivilege);
    });
  });

  describe('findById', () => {
    it('should call prisma.privilege.findUnique with correct parameters', async () => {
      const testId = 'privilege-id';
      const mockPrivilege = { id: testId, name: 'Test Privilege' };
      
      prismaService.privilege.findUnique.mockResolvedValue(mockPrivilege as any);

      const result = await repository.findById(testId);

      expect(prismaService.privilege.findUnique).toHaveBeenCalledWith({
        where: { id: testId },
      });
      expect(result).toBe(mockPrivilege);
    });
  });

  describe('findByName', () => {
    it('should call prisma.privilege.findUnique with name parameter', async () => {
      const testName = 'Test Privilege';
      const mockPrivilege = { id: 'privilege-id', name: testName };
      
      prismaService.privilege.findUnique.mockResolvedValue(mockPrivilege as any);

      const result = await repository.findByName(testName);

      expect(prismaService.privilege.findUnique).toHaveBeenCalledWith({
        where: { name: testName },
      });
      expect(result).toBe(mockPrivilege);
    });
  });

  describe('update', () => {
    it('should call prisma.privilege.update with correct parameters', async () => {
      const testId = 'privilege-id';
      const updateData = { name: 'Updated Privilege', pointCost: 200 };
      const mockPrivilege = { id: testId, ...updateData };
      
      prismaService.privilege.update.mockResolvedValue(mockPrivilege as any);

      const result = await repository.update(testId, updateData);

      expect(prismaService.privilege.update).toHaveBeenCalledWith({
        where: { id: testId },
        data: {
          ...updateData,
          pointCost: new Prisma.Decimal(updateData.pointCost),
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(mockPrivilege);
    });
  });

  describe('delete', () => {
    it('should call prisma.privilege.delete with correct parameters', async () => {
      const testId = 'privilege-id';
      
      prismaService.privilege.delete.mockResolvedValue({} as any);

      await repository.delete(testId);

      expect(prismaService.privilege.delete).toHaveBeenCalledWith({
        where: { id: testId },
      });
    });
  });

  describe('findActivePrivileges', () => {
    it('should return only active privileges ordered by cost', async () => {
      const mockPrivileges = [
        { id: '1', name: 'Cheap', pointCost: 50, isActive: true },
        { id: '2', name: 'Expensive', pointCost: 200, isActive: true },
      ];
      
      prismaService.privilege.findMany.mockResolvedValue(mockPrivileges as any);

      const result = await repository.findActivePrivileges();

      expect(prismaService.privilege.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { pointCost: 'asc' },
      });
      expect(result).toBe(mockPrivileges);
    });
  });

  describe('existsByName', () => {
    it('should return true when privilege exists', async () => {
      prismaService.privilege.count.mockResolvedValue(1);

      const result = await repository.existsByName('Test Privilege');

      expect(prismaService.privilege.count).toHaveBeenCalledWith({
        where: { name: 'Test Privilege' },
      });
      expect(result).toBe(true);
    });

    it('should return false when privilege does not exist', async () => {
      prismaService.privilege.count.mockResolvedValue(0);

      const result = await repository.existsByName('Non-existent Privilege');

      expect(result).toBe(false);
    });
  });
});

describe('MemberPrivilegeRepository Unit Tests', () => {
  let repository: MemberPrivilegeRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      memberPrivilege: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberPrivilegeRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MemberPrivilegeRepository>(MemberPrivilegeRepository);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should call prisma.memberPrivilege.create with correct data', async () => {
      const createData = {
        memberId: 'member-id',
        privilegeId: 'privilege-id',
        expiresAt: new Date(),
      };
      const mockMemberPrivilege = { id: 'mp-id', ...createData };
      
      prismaService.memberPrivilege.create.mockResolvedValue(mockMemberPrivilege as any);

      const result = await repository.create(createData);

      expect(prismaService.memberPrivilege.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toBe(mockMemberPrivilege);
    });
  });

  describe('findByMemberId', () => {
    it('should call prisma.memberPrivilege.findMany with member ID and include privilege', async () => {
      const memberId = 'member-id';
      const mockMemberPrivileges = [
        {
          id: 'mp-1',
          memberId,
          privilege: { id: 'p-1', name: 'Test Privilege' },
        },
      ];
      
      prismaService.memberPrivilege.findMany.mockResolvedValue(mockMemberPrivileges as any);

      const result = await repository.findByMemberId(memberId);

      expect(prismaService.memberPrivilege.findMany).toHaveBeenCalledWith({
        where: { memberId },
        include: { privilege: true },
        orderBy: { grantedAt: 'desc' },
      });
      expect(result).toBe(mockMemberPrivileges);
    });
  });

  describe('findActiveMemberPrivileges', () => {
    it('should find only active and non-expired privileges', async () => {
      const memberId = 'member-id';
      const mockActivePrivileges = [
        {
          id: 'mp-1',
          memberId,
          isActive: true,
          privilege: { id: 'p-1', name: 'Active Privilege' },
        },
      ];
      
      prismaService.memberPrivilege.findMany.mockResolvedValue(mockActivePrivileges as any);

      const result = await repository.findActiveMemberPrivileges(memberId);

      expect(prismaService.memberPrivilege.findMany).toHaveBeenCalledWith({
        where: {
          memberId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } },
          ],
        },
        include: { privilege: true },
        orderBy: { grantedAt: 'desc' },
      });
      expect(result).toBe(mockActivePrivileges);
    });
  });

  describe('expireMemberPrivilege', () => {
    it('should mark member privilege as inactive', async () => {
      const privilegeId = 'mp-id';
      
      prismaService.memberPrivilege.update.mockResolvedValue({} as any);

      await repository.expireMemberPrivilege(privilegeId);

      expect(prismaService.memberPrivilege.update).toHaveBeenCalledWith({
        where: { id: privilegeId },
        data: { isActive: false },
      });
    });
  });

  describe('findExpiringPrivileges', () => {
    it('should find privileges expiring within specified days', async () => {
      const days = 7;
      const mockExpiringPrivileges = [
        { id: 'mp-1', expiresAt: new Date() },
      ];
      
      prismaService.memberPrivilege.findMany.mockResolvedValue(mockExpiringPrivileges as any);

      const result = await repository.findExpiringPrivileges(days);

      expect(prismaService.memberPrivilege.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lte: expect.any(Date),
            gt: expect.any(Date),
          },
          isActive: true,
        },
        orderBy: { expiresAt: 'asc' },
      });
      expect(result).toBe(mockExpiringPrivileges);
    });
  });
});