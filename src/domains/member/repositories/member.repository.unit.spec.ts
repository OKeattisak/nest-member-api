import { Test, TestingModule } from '@nestjs/testing';
import { MemberRepository } from './member.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

describe('MemberRepository Unit Tests', () => {
  let repository: MemberRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      member: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MemberRepository>(MemberRepository);
    prismaService = module.get(PrismaService);
  });

  describe('findById', () => {
    it('should call prisma.member.findUnique with correct parameters', async () => {
      const testId = 'test-id';
      const mockMember = { id: testId, email: 'test@example.com' };
      
      prismaService.member.findUnique.mockResolvedValue(mockMember as any);

      const result = await repository.findById(testId);

      expect(prismaService.member.findUnique).toHaveBeenCalledWith({
        where: { id: testId },
      });
      expect(result).toBe(mockMember);
    });
  });

  describe('findByEmail', () => {
    it('should call prisma.member.findUnique with email parameter', async () => {
      const testEmail = 'test@example.com';
      const mockMember = { id: 'test-id', email: testEmail };
      
      prismaService.member.findUnique.mockResolvedValue(mockMember as any);

      const result = await repository.findByEmail(testEmail);

      expect(prismaService.member.findUnique).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(result).toBe(mockMember);
    });
  });

  describe('create', () => {
    it('should call prisma.member.create with correct data', async () => {
      const createData = {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockMember = { id: 'test-id', ...createData };
      
      prismaService.member.create.mockResolvedValue(mockMember as any);

      const result = await repository.create(createData);

      expect(prismaService.member.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toBe(mockMember);
    });
  });

  describe('update', () => {
    it('should call prisma.member.update with correct parameters', async () => {
      const testId = 'test-id';
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const mockMember = { id: testId, ...updateData };
      
      prismaService.member.update.mockResolvedValue(mockMember as any);

      const result = await repository.update(testId, updateData);

      expect(prismaService.member.update).toHaveBeenCalledWith({
        where: { id: testId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(mockMember);
    });
  });

  describe('softDelete', () => {
    it('should call prisma.member.update to set deletedAt and isActive', async () => {
      const testId = 'test-id';
      
      prismaService.member.update.mockResolvedValue({} as any);

      await repository.softDelete(testId);

      expect(prismaService.member.update).toHaveBeenCalledWith({
        where: { id: testId },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('findMany', () => {
    it('should call prisma.member.findMany and count with correct filters', async () => {
      const filters = { email: 'test', isActive: true };
      const pagination = { page: 1, limit: 10 };
      const mockMembers = [{ id: '1', email: 'test@example.com' }];
      const mockCount = 1;
      
      prismaService.member.findMany.mockResolvedValue(mockMembers as any);
      prismaService.member.count.mockResolvedValue(mockCount);

      const result = await repository.findMany(filters, pagination);

      expect(prismaService.member.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          email: { contains: 'test', mode: 'insensitive' },
          isActive: true,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(prismaService.member.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          email: { contains: 'test', mode: 'insensitive' },
          isActive: true,
        },
      });

      expect(result).toEqual({
        data: mockMembers,
        total: mockCount,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('existsByEmail', () => {
    it('should return true when member exists', async () => {
      prismaService.member.count.mockResolvedValue(1);

      const result = await repository.existsByEmail('test@example.com');

      expect(prismaService.member.count).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          deletedAt: null,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when member does not exist', async () => {
      prismaService.member.count.mockResolvedValue(0);

      const result = await repository.existsByEmail('test@example.com');

      expect(result).toBe(false);
    });
  });
});