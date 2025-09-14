import { TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MemberRepository } from './member.repository';
import { createTestingModule, cleanupDatabase, createTestMember } from '@/domains/common/test-utils/test-database.setup';

describe('MemberRepository', () => {
  let module: TestingModule;
  let repository: MemberRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await createTestingModule([MemberRepository]);
    repository = module.get<MemberRepository>(MemberRepository);
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
    it('should create a new member', async () => {
      const memberData = createTestMember();
      const member = await repository.create(memberData);

      expect(member).toBeDefined();
      expect(member.email).toBe(memberData.email);
      expect(member.username).toBe(memberData.username);
      expect(member.firstName).toBe(memberData.firstName);
      expect(member.lastName).toBe(memberData.lastName);
      expect(member.isActive).toBe(true);
      expect(member.deletedAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find member by id', async () => {
      const memberData = createTestMember();
      const createdMember = await repository.create(memberData);
      
      const foundMember = await repository.findById(createdMember.id);
      
      expect(foundMember).toBeDefined();
      expect(foundMember!.id).toBe(createdMember.id);
      expect(foundMember!.email).toBe(memberData.email);
    });

    it('should return null for non-existent id', async () => {
      const foundMember = await repository.findById('non-existent-id');
      expect(foundMember).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find member by email', async () => {
      const memberData = createTestMember();
      await repository.create(memberData);
      
      const foundMember = await repository.findByEmail(memberData.email);
      
      expect(foundMember).toBeDefined();
      expect(foundMember!.email).toBe(memberData.email);
    });

    it('should return null for non-existent email', async () => {
      const foundMember = await repository.findByEmail('nonexistent@example.com');
      expect(foundMember).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find member by username', async () => {
      const memberData = createTestMember();
      await repository.create(memberData);
      
      const foundMember = await repository.findByUsername(memberData.username);
      
      expect(foundMember).toBeDefined();
      expect(foundMember!.username).toBe(memberData.username);
    });

    it('should return null for non-existent username', async () => {
      const foundMember = await repository.findByUsername('nonexistentuser');
      expect(foundMember).toBeNull();
    });
  });

  describe('update', () => {
    it('should update member data', async () => {
      const memberData = createTestMember();
      const createdMember = await repository.create(memberData);
      
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        isActive: false,
      };
      
      const updatedMember = await repository.update(createdMember.id, updateData);
      
      expect(updatedMember.firstName).toBe(updateData.firstName);
      expect(updatedMember.lastName).toBe(updateData.lastName);
      expect(updatedMember.isActive).toBe(updateData.isActive);
      expect(updatedMember.updatedAt.getTime()).toBeGreaterThan(createdMember.updatedAt.getTime());
    });
  });

  describe('softDelete', () => {
    it('should soft delete a member', async () => {
      const memberData = createTestMember();
      const createdMember = await repository.create(memberData);
      
      await repository.softDelete(createdMember.id);
      
      const deletedMember = await repository.findById(createdMember.id);
      expect(deletedMember!.deletedAt).toBeDefined();
      expect(deletedMember!.isActive).toBe(false);
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      // Create test members
      await repository.create(createTestMember({
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
      }));
      
      await repository.create(createTestMember({
        email: 'jane@example.com',
        username: 'jane',
        firstName: 'Jane',
        lastName: 'Smith',
      }));
      
      await repository.create(createTestMember({
        email: 'inactive@example.com',
        username: 'inactive',
        firstName: 'Inactive',
        lastName: 'User',
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

    it('should filter by email', async () => {
      const result = await repository.findMany(
        { email: 'john' },
        { page: 1, limit: 10 }
      );
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.email).toBe('john@example.com');
    });

    it('should filter by isActive', async () => {
      const result = await repository.findMany(
        { isActive: false },
        { page: 1, limit: 10 }
      );
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.isActive).toBe(false);
    });

    it('should search across multiple fields', async () => {
      const result = await repository.findMany(
        { search: 'Jane' },
        { page: 1, limit: 10 }
      );
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.firstName).toBe('Jane');
    });
  });

  describe('existsByEmail', () => {
    it('should return true for existing email', async () => {
      const memberData = createTestMember();
      await repository.create(memberData);
      
      const exists = await repository.existsByEmail(memberData.email);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing email', async () => {
      const exists = await repository.existsByEmail('nonexistent@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('existsByUsername', () => {
    it('should return true for existing username', async () => {
      const memberData = createTestMember();
      await repository.create(memberData);
      
      const exists = await repository.existsByUsername(memberData.username);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing username', async () => {
      const exists = await repository.existsByUsername('nonexistentuser');
      expect(exists).toBe(false);
    });
  });

  describe('findActiveById', () => {
    it('should find active member by id', async () => {
      const memberData = createTestMember();
      const createdMember = await repository.create(memberData);
      
      const foundMember = await repository.findActiveById(createdMember.id);
      
      expect(foundMember).toBeDefined();
      expect(foundMember!.id).toBe(createdMember.id);
      expect(foundMember!.isActive).toBe(true);
    });

    it('should return null for inactive member', async () => {
      const memberData = createTestMember({ isActive: false });
      const createdMember = await repository.create(memberData);
      
      const foundMember = await repository.findActiveById(createdMember.id);
      expect(foundMember).toBeNull();
    });

    it('should return null for soft deleted member', async () => {
      const memberData = createTestMember();
      const createdMember = await repository.create(memberData);
      await repository.softDelete(createdMember.id);
      
      const foundMember = await repository.findActiveById(createdMember.id);
      expect(foundMember).toBeNull();
    });
  });
});