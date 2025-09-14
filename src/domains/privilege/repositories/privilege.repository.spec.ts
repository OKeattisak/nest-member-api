import { TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { PrivilegeRepository } from './privilege.repository';
import { MemberPrivilegeRepository } from './member-privilege.repository';
import { MemberRepository } from '@/domains/member/repositories/member.repository';
import { createTestingModule, cleanupDatabase, createTestMember, createTestPrivilege } from '@/domains/common/test-utils/test-database.setup';

describe('PrivilegeRepository', () => {
  let module: TestingModule;
  let repository: PrivilegeRepository;
  let memberPrivilegeRepository: MemberPrivilegeRepository;
  let memberRepository: MemberRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await createTestingModule([
      PrivilegeRepository,
      MemberPrivilegeRepository,
      MemberRepository,
    ]);
    repository = module.get<PrivilegeRepository>(PrivilegeRepository);
    memberPrivilegeRepository = module.get<MemberPrivilegeRepository>(MemberPrivilegeRepository);
    memberRepository = module.get<MemberRepository>(MemberRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await module.close();
  });

  describe('create', () => {
    it('should create a new privilege', async () => {
      const privilegeData = createTestPrivilege();
      const privilege = await repository.create(privilegeData);

      expect(privilege).toBeDefined();
      expect(privilege.name).toBe(privilegeData.name);
      expect(privilege.description).toBe(privilegeData.description);
      expect(Number(privilege.pointCost)).toBe(privilegeData.pointCost);
      expect(privilege.validityDays).toBe(privilegeData.validityDays);
      expect(privilege.isActive).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find privilege by id', async () => {
      const privilegeData = createTestPrivilege();
      const createdPrivilege = await repository.create(privilegeData);
      
      const foundPrivilege = await repository.findById(createdPrivilege.id);
      
      expect(foundPrivilege).toBeDefined();
      expect(foundPrivilege!.id).toBe(createdPrivilege.id);
      expect(foundPrivilege!.name).toBe(privilegeData.name);
    });

    it('should return null for non-existent id', async () => {
      const foundPrivilege = await repository.findById('non-existent-id');
      expect(foundPrivilege).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find privilege by name', async () => {
      const privilegeData = createTestPrivilege();
      await repository.create(privilegeData);
      
      const foundPrivilege = await repository.findByName(privilegeData.name);
      
      expect(foundPrivilege).toBeDefined();
      expect(foundPrivilege!.name).toBe(privilegeData.name);
    });

    it('should return null for non-existent name', async () => {
      const foundPrivilege = await repository.findByName('Non-existent Privilege');
      expect(foundPrivilege).toBeNull();
    });
  });

  describe('update', () => {
    it('should update privilege data', async () => {
      const privilegeData = createTestPrivilege();
      const createdPrivilege = await repository.create(privilegeData);
      
      const updateData = {
        name: 'Updated Privilege',
        pointCost: 200,
        isActive: false,
      };
      
      const updatedPrivilege = await repository.update(createdPrivilege.id, updateData);
      
      expect(updatedPrivilege.name).toBe(updateData.name);
      expect(Number(updatedPrivilege.pointCost)).toBe(updateData.pointCost);
      expect(updatedPrivilege.isActive).toBe(updateData.isActive);
      expect(updatedPrivilege.updatedAt.getTime()).toBeGreaterThan(createdPrivilege.updatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete a privilege', async () => {
      const privilegeData = createTestPrivilege();
      const createdPrivilege = await repository.create(privilegeData);
      
      await repository.delete(createdPrivilege.id);
      
      const deletedPrivilege = await repository.findById(createdPrivilege.id);
      expect(deletedPrivilege).toBeNull();
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      // Create test privileges
      await repository.create(createTestPrivilege({
        name: 'Premium Access',
        pointCost: 100,
        isActive: true,
      }));
      
      await repository.create(createTestPrivilege({
        name: 'VIP Status',
        pointCost: 200,
        isActive: true,
      }));
      
      await repository.create(createTestPrivilege({
        name: 'Inactive Privilege',
        pointCost: 50,
        isActive: false,
      }));
    });

    it('should return paginated results', async () => {
      const result = await repository.findMany({}, { page: 1, limit: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by name', async () => {
      const result = await repository.findMany(
        { name: 'Premium' },
        { page: 1, limit: 10 }
      );
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.name).toBe('Premium Access');
    });

    it('should filter by isActive', async () => {
      const result = await repository.findMany(
        { isActive: false },
        { page: 1, limit: 10 }
      );
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.isActive).toBe(false);
    });

    it('should filter by point cost range', async () => {
      const result = await repository.findMany(
        { pointCostMin: 100, pointCostMax: 200 },
        { page: 1, limit: 10 }
      );
      
      expect(result.data).toHaveLength(2);
      expect(result.data.every(p => Number(p.pointCost) >= 100 && Number(p.pointCost) <= 200)).toBe(true);
    });
  });

  describe('findActivePrivileges', () => {
    it('should return only active privileges', async () => {
      await repository.create(createTestPrivilege({
        name: 'Active 1',
        pointCost: 100,
        isActive: true,
      }));
      
      await repository.create(createTestPrivilege({
        name: 'Active 2',
        pointCost: 50,
        isActive: true,
      }));
      
      await repository.create(createTestPrivilege({
        name: 'Inactive',
        pointCost: 200,
        isActive: false,
      }));

      const activePrivileges = await repository.findActivePrivileges();
      
      expect(activePrivileges).toHaveLength(2);
      expect(activePrivileges.every(p => p.isActive)).toBe(true);
      expect(Number(activePrivileges[0]?.pointCost)).toBeLessThanOrEqual(Number(activePrivileges[1]?.pointCost)); // Ordered by cost
    });
  });

  describe('existsByName', () => {
    it('should return true for existing name', async () => {
      const privilegeData = createTestPrivilege();
      await repository.create(privilegeData);
      
      const exists = await repository.existsByName(privilegeData.name);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing name', async () => {
      const exists = await repository.existsByName('Non-existent Privilege');
      expect(exists).toBe(false);
    });
  });
});

describe('MemberPrivilegeRepository', () => {
  let module: TestingModule;
  let repository: MemberPrivilegeRepository;
  let privilegeRepository: PrivilegeRepository;
  let memberRepository: MemberRepository;
  let prisma: PrismaService;
  let testMemberId: string;
  let testPrivilegeId: string;

  beforeAll(async () => {
    module = await createTestingModule([
      MemberPrivilegeRepository,
      PrivilegeRepository,
      MemberRepository,
    ]);
    repository = module.get<MemberPrivilegeRepository>(MemberPrivilegeRepository);
    privilegeRepository = module.get<PrivilegeRepository>(PrivilegeRepository);
    memberRepository = module.get<MemberRepository>(MemberRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    
    // Create test member and privilege
    const member = await memberRepository.create(createTestMember());
    const privilege = await privilegeRepository.create(createTestPrivilege());
    testMemberId = member.id;
    testPrivilegeId = privilege.id;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await module.close();
  });

  describe('create', () => {
    it('should create a member privilege', async () => {
      const memberPrivilegeData = {
        memberId: testMemberId,
        privilegeId: testPrivilegeId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const memberPrivilege = await repository.create(memberPrivilegeData);

      expect(memberPrivilege).toBeDefined();
      expect(memberPrivilege.memberId).toBe(testMemberId);
      expect(memberPrivilege.privilegeId).toBe(testPrivilegeId);
      expect(memberPrivilege.isActive).toBe(true);
      expect(memberPrivilege.expiresAt).toBeDefined();
    });
  });

  describe('findByMemberId', () => {
    it('should find all privileges for a member', async () => {
      // Create another privilege
      const privilege2 = await privilegeRepository.create(createTestPrivilege({
        name: 'Second Privilege',
        pointCost: 150,
      }));

      await repository.create({
        memberId: testMemberId,
        privilegeId: testPrivilegeId,
      });

      await repository.create({
        memberId: testMemberId,
        privilegeId: privilege2.id,
      });

      const memberPrivileges = await repository.findByMemberId(testMemberId);

      expect(memberPrivileges).toHaveLength(2);
      expect(memberPrivileges.every(mp => mp.memberId === testMemberId)).toBe(true);
      expect(memberPrivileges.every(mp => mp.privilege)).toBeDefined(); // Should include privilege details
    });
  });

  describe('findByMemberAndPrivilege', () => {
    it('should find specific member privilege', async () => {
      await repository.create({
        memberId: testMemberId,
        privilegeId: testPrivilegeId,
      });

      const memberPrivilege = await repository.findByMemberAndPrivilege(testMemberId, testPrivilegeId);

      expect(memberPrivilege).toBeDefined();
      expect(memberPrivilege!.memberId).toBe(testMemberId);
      expect(memberPrivilege!.privilegeId).toBe(testPrivilegeId);
    });

    it('should return null for non-existent combination', async () => {
      const memberPrivilege = await repository.findByMemberAndPrivilege('non-existent', 'non-existent');
      expect(memberPrivilege).toBeNull();
    });
  });

  describe('findActiveMemberPrivileges', () => {
    it('should find only active and non-expired privileges', async () => {
      // Create active privilege
      await repository.create({
        memberId: testMemberId,
        privilegeId: testPrivilegeId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Create expired privilege
      const privilege2 = await privilegeRepository.create(createTestPrivilege({
        name: 'Expired Privilege',
        pointCost: 150,
      }));

      await repository.create({
        memberId: testMemberId,
        privilegeId: privilege2.id,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });

      const activePrivileges = await repository.findActiveMemberPrivileges(testMemberId);

      expect(activePrivileges).toHaveLength(1);
      expect(activePrivileges[0]?.privilegeId).toBe(testPrivilegeId);
    });
  });

  describe('expireMemberPrivilege', () => {
    it('should mark member privilege as inactive', async () => {
      const memberPrivilege = await repository.create({
        memberId: testMemberId,
        privilegeId: testPrivilegeId,
      });

      await repository.expireMemberPrivilege(memberPrivilege.id);

      const expiredPrivilege = await repository.findById(memberPrivilege.id);
      expect(expiredPrivilege!.isActive).toBe(false);
    });
  });

  describe('findExpiringPrivileges', () => {
    it('should find privileges expiring within specified days', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await repository.create({
        memberId: testMemberId,
        privilegeId: testPrivilegeId,
        expiresAt: tomorrow,
      });

      const privilege2 = await privilegeRepository.create(createTestPrivilege({
        name: 'Week Privilege',
        pointCost: 150,
      }));

      await repository.create({
        memberId: testMemberId,
        privilegeId: privilege2.id,
        expiresAt: nextWeek,
      });

      const privilege3 = await privilegeRepository.create(createTestPrivilege({
        name: 'Month Privilege',
        pointCost: 200,
      }));

      await repository.create({
        memberId: testMemberId,
        privilegeId: privilege3.id,
        expiresAt: nextMonth,
      });

      const expiringIn7Days = await repository.findExpiringPrivileges(7);
      const expiringIn2Days = await repository.findExpiringPrivileges(2);

      expect(expiringIn7Days).toHaveLength(2); // Tomorrow and next week
      expect(expiringIn2Days).toHaveLength(1); // Only tomorrow
    });
  });

  describe('deactivateMemberPrivilege', () => {
    it('should deactivate member privilege', async () => {
      const memberPrivilege = await repository.create({
        memberId: testMemberId,
        privilegeId: testPrivilegeId,
      });

      await repository.deactivateMemberPrivilege(memberPrivilege.id);

      const deactivatedPrivilege = await repository.findById(memberPrivilege.id);
      expect(deactivatedPrivilege!.isActive).toBe(false);
    });
  });
});