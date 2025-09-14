import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService, PrismaMockPatterns } from './index';

/**
 * Example test demonstrating how to use the Prisma mock factory
 * This file serves as documentation and can be deleted after implementation
 */
describe('Prisma Mock Factory Example', () => {
  let mockPrismaService: MockPrismaService;

  beforeEach(async () => {
    // Create a mock PrismaService using the factory
    mockPrismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    // Get the mocked service (it will be properly typed)
    const prismaService = module.get<MockPrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  afterEach(() => {
    // Clear all mocks after each test
    PrismaMockPatterns.clearAllMocks(mockPrismaService);
  });

  describe('Basic Mock Usage', () => {
    it('should mock findUnique method', async () => {
      // Create mock data using patterns
      const mockMember = PrismaMockPatterns.createMockMember({
        id: 'test-id',
        email: 'test@example.com',
      });

      // Set up the mock
      PrismaMockPatterns.mockFindUnique(mockPrismaService, 'member', mockMember);

      // The mock is now ready to use
      const result = await mockPrismaService.member.findUnique({
        where: { id: 'test-id' },
      });

      expect(result).toEqual(mockMember);
      expect(mockPrismaService.member.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should mock findMany method', async () => {
      // Create mock data array
      const mockMembers = [
        PrismaMockPatterns.createMockMember({ id: '1', email: 'user1@example.com' }),
        PrismaMockPatterns.createMockMember({ id: '2', email: 'user2@example.com' }),
      ];

      // Set up the mock
      PrismaMockPatterns.mockFindMany(mockPrismaService, 'member', mockMembers);

      // Use the mock
      const result = await mockPrismaService.member.findMany();

      expect(result).toEqual(mockMembers);
      expect(result).toHaveLength(2);
    });

    it('should mock create method', async () => {
      const createData = {
        email: 'new@example.com',
        username: 'newuser',
        passwordHash: 'hash',
        firstName: 'New',
        lastName: 'User',
      };

      const mockCreatedMember = PrismaMockPatterns.createMockMember({
        id: 'new-id',
        ...createData,
      });

      // Set up the mock
      PrismaMockPatterns.mockCreate(mockPrismaService, 'member', mockCreatedMember);

      // Use the mock
      const result = await mockPrismaService.member.create({
        data: createData,
      });

      expect(result).toEqual(mockCreatedMember);
      expect(mockPrismaService.member.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('Advanced Mock Patterns', () => {
    it('should set up complete CRUD mocks', () => {
      // Set up all CRUD mocks at once
      const { mockMember, mockMembers } = PrismaMockPatterns.setupMemberCrudMocks(mockPrismaService);

      expect(mockMember).toBeDefined();
      expect(mockMembers).toHaveLength(1);

      // All CRUD operations are now mocked and ready to use
      expect(mockPrismaService.member.findUnique).toBeDefined();
      expect(mockPrismaService.member.findMany).toBeDefined();
      expect(mockPrismaService.member.create).toBeDefined();
      expect(mockPrismaService.member.update).toBeDefined();
      expect(mockPrismaService.member.delete).toBeDefined();
      expect(mockPrismaService.member.count).toBeDefined();
    });

    it('should mock error scenarios', async () => {
      const error = new Error('Database connection failed');

      // Mock an error
      PrismaMockPatterns.mockError(mockPrismaService, 'member', 'findUnique', error);

      // Test the error
      await expect(
        mockPrismaService.member.findUnique({ where: { id: 'test-id' } })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Mock Management', () => {
    it('should reset mocks', () => {
      // Set up some mocks
      PrismaMockPatterns.mockFindUnique(mockPrismaService, 'member', null);
      
      // Call the mock
      mockPrismaService.member.findUnique({ where: { id: 'test' } });
      
      expect(mockPrismaService.member.findUnique).toHaveBeenCalledTimes(1);

      // Reset all mocks
      PrismaMockPatterns.resetAllMocks(mockPrismaService);

      // Mock should be reset (no implementation, no call history)
      expect(mockPrismaService.member.findUnique).not.toHaveBeenCalled();
    });

    it('should clear mock call history', () => {
      // Set up and call mock
      PrismaMockPatterns.mockFindUnique(mockPrismaService, 'member', null);
      mockPrismaService.member.findUnique({ where: { id: 'test' } });
      
      expect(mockPrismaService.member.findUnique).toHaveBeenCalledTimes(1);

      // Clear call history (but keep implementation)
      PrismaMockPatterns.clearAllMocks(mockPrismaService);

      expect(mockPrismaService.member.findUnique).not.toHaveBeenCalled();
      
      // Implementation should still be there
      const result = mockPrismaService.member.findUnique({ where: { id: 'test' } });
      expect(result).resolves.toBeNull();
    });
  });
});