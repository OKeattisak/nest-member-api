import { Test, TestingModule } from '@nestjs/testing';
import { PointRepository } from './point.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PointType, Prisma } from '@prisma/client';

describe('PointRepository Unit Tests', () => {
  let repository: PointRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      point: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PointRepository>(PointRepository);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should call prisma.point.create with correct data', async () => {
      const createData = {
        memberId: 'member-id',
        amount: 100,
        type: PointType.EARNED,
        description: 'Test points',
        expiresAt: new Date(),
      };
      const mockPoint = { id: 'point-id', ...createData };
      
      prismaService.point.create.mockResolvedValue(mockPoint as any);

      const result = await repository.create(createData);

      expect(prismaService.point.create).toHaveBeenCalledWith({
        data: {
          memberId: createData.memberId,
          amount: new Prisma.Decimal(createData.amount),
          type: createData.type,
          description: createData.description,
          expiresAt: createData.expiresAt,
        },
      });
      expect(result).toBe(mockPoint);
    });
  });

  describe('findByMemberId', () => {
    it('should call prisma.point.findMany with correct parameters', async () => {
      const memberId = 'member-id';
      const mockPoints = [{ id: 'point-1', memberId }];
      
      prismaService.point.findMany.mockResolvedValue(mockPoints as any);

      const result = await repository.findByMemberId(memberId);

      expect(prismaService.point.findMany).toHaveBeenCalledWith({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(mockPoints);
    });
  });

  describe('getAvailableBalance', () => {
    it('should calculate available balance correctly', async () => {
      const memberId = 'member-id';
      const mockAggregate = { _sum: { amount: new Prisma.Decimal(150) } };
      
      prismaService.point.aggregate.mockResolvedValue(mockAggregate as any);

      const result = await repository.getAvailableBalance(memberId);

      expect(prismaService.point.aggregate).toHaveBeenCalledWith({
        where: {
          memberId,
          isExpired: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } },
          ],
        },
        _sum: { amount: true },
      });
      expect(result).toBe(150);
    });

    it('should return 0 when no points available', async () => {
      const memberId = 'member-id';
      const mockAggregate = { _sum: { amount: null } };
      
      prismaService.point.aggregate.mockResolvedValue(mockAggregate as any);

      const result = await repository.getAvailableBalance(memberId);

      expect(result).toBe(0);
    });
  });

  describe('findExpiredPoints', () => {
    it('should find expired points with correct criteria', async () => {
      const mockExpiredPoints = [
        { id: 'point-1', amount: 100, expiresAt: new Date('2023-01-01') }
      ];
      
      prismaService.point.findMany.mockResolvedValue(mockExpiredPoints as any);

      const result = await repository.findExpiredPoints();

      expect(prismaService.point.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lte: expect.any(Date) },
          isExpired: false,
          type: PointType.EARNED,
        },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toBe(mockExpiredPoints);
    });
  });

  describe('expirePoints', () => {
    it('should mark points as expired', async () => {
      const pointIds = ['point-1', 'point-2'];
      
      prismaService.point.updateMany.mockResolvedValue({ count: 2 } as any);

      await repository.expirePoints(pointIds);

      expect(prismaService.point.updateMany).toHaveBeenCalledWith({
        where: { id: { in: pointIds } },
        data: { isExpired: true },
      });
    });
  });

  describe('getAvailablePoints', () => {
    it('should return available points in FIFO order', async () => {
      const memberId = 'member-id';
      const mockPoints = [
        {
          id: 'point-1',
          amount: new Prisma.Decimal(100),
          createdAt: new Date('2023-01-01'),
          expiresAt: new Date('2023-12-31'),
        },
        {
          id: 'point-2',
          amount: new Prisma.Decimal(50),
          createdAt: new Date('2023-01-02'),
          expiresAt: null,
        },
      ];
      
      prismaService.point.findMany.mockResolvedValue(mockPoints as any);

      const result = await repository.getAvailablePoints(memberId);

      expect(prismaService.point.findMany).toHaveBeenCalledWith({
        where: {
          memberId,
          isExpired: false,
          amount: { gt: 0 },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } },
          ],
        },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(result).toEqual([
        {
          id: 'point-1',
          amount: 100,
          createdAt: new Date('2023-01-01'),
          expiresAt: new Date('2023-12-31'),
        },
        {
          id: 'point-2',
          amount: 50,
          createdAt: new Date('2023-01-02'),
          expiresAt: null,
        },
      ]);
    });
  });

  describe('deductPoints', () => {
    it('should throw error for insufficient points', async () => {
      const memberId = 'member-id';
      const amount = 200;
      const description = 'Test deduction';
      
      // Mock getAvailablePoints to return insufficient points
      jest.spyOn(repository, 'getAvailablePoints').mockResolvedValue([
        {
          id: 'point-1',
          amount: 100,
          createdAt: new Date(),
          expiresAt: null,
        },
      ]);

      await expect(
        repository.deductPoints(memberId, amount, description)
      ).rejects.toThrow('Insufficient points. Required: 200, Available: 100');
    });

    it('should create deduction records for sufficient points', async () => {
      const memberId = 'member-id';
      const amount = 75;
      const description = 'Test deduction';
      
      // Mock getAvailablePoints
      jest.spyOn(repository, 'getAvailablePoints').mockResolvedValue([
        {
          id: 'point-1',
          amount: 100,
          createdAt: new Date(),
          expiresAt: null,
        },
        {
          id: 'point-2',
          amount: 50,
          createdAt: new Date(),
          expiresAt: null,
        },
      ]);

      // Mock createMany
      const mockDeductionRecords = [
        { id: 'deduction-1', amount: -75, type: PointType.DEDUCTED },
      ];
      jest.spyOn(repository, 'createMany').mockResolvedValue(mockDeductionRecords as any);

      const result = await repository.deductPoints(memberId, amount, description);

      expect(repository.createMany).toHaveBeenCalledWith([
        {
          memberId,
          amount: -75,
          type: PointType.DEDUCTED,
          description: `${description} (FIFO deduction from point point-1)`,
        },
      ]);
      expect(result).toBe(mockDeductionRecords);
    });
  });

  describe('findPointHistory', () => {
    it('should return paginated point history', async () => {
      const memberId = 'member-id';
      const pagination = { page: 1, limit: 10 };
      const mockPoints = [{ id: 'point-1', memberId }];
      const mockCount = 1;
      
      prismaService.point.findMany.mockResolvedValue(mockPoints as any);
      prismaService.point.count.mockResolvedValue(mockCount);

      const result = await repository.findPointHistory(memberId, pagination);

      expect(prismaService.point.findMany).toHaveBeenCalledWith({
        where: { memberId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockPoints,
        total: mockCount,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });
});