import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PointType, Prisma } from '@prisma/client';
import { PointService, AddPointsData, DeductPointsData } from './point.service';
import { IPointRepository } from '../repositories/point.repository.interface';
import { PaginationOptions } from '../../member/repositories/member.repository.interface';

describe('PointService', () => {
  let service: PointService;
  let mockPointRepository: jest.Mocked<IPointRepository>;

  const mockMemberId = 'member-123';
  const mockPointId = 'point-123';

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByMemberId: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findExpiredPoints: jest.fn(),
      expirePoints: jest.fn(),
      getAvailableBalance: jest.fn(),
      getAvailablePoints: jest.fn(),
      deductPoints: jest.fn(),
      findPointHistory: jest.fn(),
      findPointsByType: jest.fn(),
      getTotalEarnedPoints: jest.fn(),
      findExpiringPoints: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: 'IPointRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    mockPointRepository = mockRepository as jest.Mocked<IPointRepository>;

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addPoints', () => {
    it('should successfully add points with expiration', async () => {
      const addPointsData: AddPointsData = {
        memberId: mockMemberId,
        amount: 100,
        description: 'Test points',
        expirationDays: 30,
      };

      const mockCreatedPoint = {
        id: mockPointId,
        memberId: mockMemberId,
        amount: new Prisma.Decimal(100),
        type: PointType.EARNED,
        description: 'Test points',
        expiresAt: new Date(),
        isExpired: false,
        createdAt: new Date(),
      };

      mockPointRepository.create.mockResolvedValue(mockCreatedPoint);

      await service.addPoints(addPointsData);

      expect(mockPointRepository.create).toHaveBeenCalledWith({
        memberId: mockMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Test points',
        expiresAt: expect.any(Date),
      });
    });

    it('should add points without expiration when expirationDays is not provided', async () => {
      const addPointsData: AddPointsData = {
        memberId: mockMemberId,
        amount: 50,
        description: 'Test points without expiration',
      };

      const mockCreatedPoint = {
        id: mockPointId,
        memberId: mockMemberId,
        amount: new Prisma.Decimal(50),
        type: PointType.EARNED,
        description: 'Test points without expiration',
        expiresAt: null,
        isExpired: false,
        createdAt: new Date(),
      };

      mockPointRepository.create.mockResolvedValue(mockCreatedPoint);

      await service.addPoints(addPointsData);

      expect(mockPointRepository.create).toHaveBeenCalledWith({
        memberId: mockMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Test points without expiration',
        expiresAt: undefined,
      });
    });

    it('should throw error when repository fails', async () => {
      const addPointsData: AddPointsData = {
        memberId: mockMemberId,
        amount: 100,
        description: 'Test points',
      };

      mockPointRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.addPoints(addPointsData)).rejects.toThrow('Failed to add points: Database error');
    });
  });

  describe('deductPoints', () => {
    it('should successfully deduct points when sufficient balance exists', async () => {
      const deductPointsData: DeductPointsData = {
        memberId: mockMemberId,
        amount: 50,
        description: 'Test deduction',
      };

      mockPointRepository.getAvailableBalance.mockResolvedValue(100);
      mockPointRepository.deductPoints.mockResolvedValue([]);

      await service.deductPoints(deductPointsData);

      expect(mockPointRepository.getAvailableBalance).toHaveBeenCalledWith(mockMemberId);
      expect(mockPointRepository.deductPoints).toHaveBeenCalledWith(
        mockMemberId,
        50,
        'Test deduction'
      );
    });

    it('should throw error when insufficient balance', async () => {
      const deductPointsData: DeductPointsData = {
        memberId: mockMemberId,
        amount: 150,
        description: 'Test deduction',
      };

      mockPointRepository.getAvailableBalance.mockResolvedValue(100);

      await expect(service.deductPoints(deductPointsData)).rejects.toThrow(
        'Insufficient points. Required: 150, Available: 100'
      );

      expect(mockPointRepository.deductPoints).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const deductPointsData: DeductPointsData = {
        memberId: mockMemberId,
        amount: 50,
        description: 'Test deduction',
      };

      mockPointRepository.getAvailableBalance.mockResolvedValue(100);
      mockPointRepository.deductPoints.mockRejectedValue(new Error('FIFO deduction failed'));

      await expect(service.deductPoints(deductPointsData)).rejects.toThrow('FIFO deduction failed');
    });
  });

  describe('exchangePoints', () => {
    it('should successfully exchange points for privilege', async () => {
      const privilegeName = 'Premium Access';
      const amount = 75;

      const mockAvailablePoints = [
        { id: 'point-1', amount: 50, createdAt: new Date('2023-01-01'), expiresAt: null },
        { id: 'point-2', amount: 30, createdAt: new Date('2023-01-02'), expiresAt: null },
      ];

      mockPointRepository.getAvailableBalance.mockResolvedValue(100);
      mockPointRepository.getAvailablePoints.mockResolvedValue(mockAvailablePoints);
      mockPointRepository.createMany.mockResolvedValue([]);

      await service.exchangePoints(mockMemberId, amount, privilegeName);

      expect(mockPointRepository.getAvailableBalance).toHaveBeenCalledWith(mockMemberId);
      expect(mockPointRepository.getAvailablePoints).toHaveBeenCalledWith(mockMemberId);
      expect(mockPointRepository.createMany).toHaveBeenCalledWith([
        {
          memberId: mockMemberId,
          amount: 50,
          type: PointType.EXCHANGED,
          description: `Exchanged for privilege: ${privilegeName} (FIFO from point point-1)`,
        },
        {
          memberId: mockMemberId,
          amount: 25,
          type: PointType.EXCHANGED,
          description: `Exchanged for privilege: ${privilegeName} (FIFO from point point-2)`,
        },
      ]);
    });

    it('should throw error when insufficient balance for exchange', async () => {
      const privilegeName = 'Premium Access';
      const amount = 150;

      mockPointRepository.getAvailableBalance.mockResolvedValue(100);

      await expect(service.exchangePoints(mockMemberId, amount, privilegeName)).rejects.toThrow(
        'Insufficient points for privilege exchange. Required: 150, Available: 100'
      );

      expect(mockPointRepository.getAvailablePoints).not.toHaveBeenCalled();
      expect(mockPointRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getPointHistory', () => {
    it('should return paginated point history', async () => {
      const pagination: PaginationOptions = { page: 1, limit: 10 };
      
      const mockPrismaPoints = [
        {
          id: 'point-1',
          memberId: mockMemberId,
          amount: new Prisma.Decimal(100),
          type: PointType.EARNED,
          description: 'Earned points',
          expiresAt: new Date(),
          isExpired: false,
          createdAt: new Date(),
        },
        {
          id: 'point-2',
          memberId: mockMemberId,
          amount: new Prisma.Decimal(50),
          type: PointType.DEDUCTED,
          description: 'Deducted points',
          expiresAt: null,
          isExpired: false,
          createdAt: new Date(),
        },
      ];

      const mockResult = {
        data: mockPrismaPoints,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockPointRepository.findPointHistory.mockResolvedValue(mockResult);

      const result = await service.getPointHistory(mockMemberId, pagination);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.signedAmount).toBe(100); // EARNED points are positive
      expect(result.data[1]?.signedAmount).toBe(-50); // DEDUCTED points are negative
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should throw error when repository fails', async () => {
      const pagination: PaginationOptions = { page: 1, limit: 10 };
      
      mockPointRepository.findPointHistory.mockRejectedValue(new Error('Database error'));

      await expect(service.getPointHistory(mockMemberId, pagination)).rejects.toThrow(
        'Failed to fetch point history: Database error'
      );
    });
  });

  describe('getAvailableBalance', () => {
    it('should return available balance', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(250);

      const balance = await service.getAvailableBalance(mockMemberId);

      expect(balance).toBe(250);
      expect(mockPointRepository.getAvailableBalance).toHaveBeenCalledWith(mockMemberId);
    });

    it('should throw error when repository fails', async () => {
      mockPointRepository.getAvailableBalance.mockRejectedValue(new Error('Database error'));

      await expect(service.getAvailableBalance(mockMemberId)).rejects.toThrow(
        'Failed to get available balance: Database error'
      );
    });
  });

  describe('getPointBalance', () => {
    it('should return comprehensive point balance information', async () => {
      const mockEarnedPoints = [
        { id: '1', amount: new Prisma.Decimal(100), type: PointType.EARNED },
        { id: '2', amount: new Prisma.Decimal(50), type: PointType.EARNED },
      ];
      const mockDeductedPoints = [
        { id: '3', amount: new Prisma.Decimal(25), type: PointType.DEDUCTED },
      ];
      const mockExpiredPoints = [
        { id: '4', amount: new Prisma.Decimal(10), type: PointType.EXPIRED },
      ];
      const mockExchangedPoints = [
        { id: '5', amount: new Prisma.Decimal(15), type: PointType.EXCHANGED },
      ];

      mockPointRepository.getTotalEarnedPoints.mockResolvedValue(150);
      mockPointRepository.findPointsByType
        .mockResolvedValueOnce(mockEarnedPoints as any)
        .mockResolvedValueOnce(mockDeductedPoints as any)
        .mockResolvedValueOnce(mockExpiredPoints as any)
        .mockResolvedValueOnce(mockExchangedPoints as any);
      mockPointRepository.getAvailableBalance.mockResolvedValue(100);

      const balance = await service.getPointBalance(mockMemberId);

      expect(balance).toEqual({
        memberId: mockMemberId,
        totalEarned: 150,
        totalDeducted: 25,
        totalExpired: 10,
        totalExchanged: 15,
        availableBalance: 100,
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('processExpiredPoints', () => {
    it('should process expired points successfully', async () => {
      const mockExpiredPoints = [
        {
          id: 'point-1',
          memberId: 'member-1',
          amount: new Prisma.Decimal(50),
          type: PointType.EARNED,
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'point-2',
          memberId: 'member-2',
          amount: new Prisma.Decimal(30),
          type: PointType.EARNED,
          createdAt: new Date('2023-01-02'),
        },
      ];

      mockPointRepository.findExpiredPoints.mockResolvedValue(mockExpiredPoints as any);
      mockPointRepository.expirePoints.mockResolvedValue();
      mockPointRepository.createMany.mockResolvedValue([]);

      const result = await service.processExpiredPoints();

      expect(result.totalPointsExpired).toBe(2);
      expect(result.membersAffected).toBe(2);
      expect(result.pointsProcessed).toEqual(['point-1', 'point-2']);
      expect(result.errors).toHaveLength(0);

      expect(mockPointRepository.expirePoints).toHaveBeenCalledTimes(2);
      expect(mockPointRepository.createMany).toHaveBeenCalledTimes(2);
    });

    it('should handle case when no expired points exist', async () => {
      mockPointRepository.findExpiredPoints.mockResolvedValue([]);

      const result = await service.processExpiredPoints();

      expect(result.totalPointsExpired).toBe(0);
      expect(result.membersAffected).toBe(0);
      expect(result.pointsProcessed).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors during processing and continue with other members', async () => {
      const mockExpiredPoints = [
        {
          id: 'point-1',
          memberId: 'member-1',
          amount: new Prisma.Decimal(50),
          type: PointType.EARNED,
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'point-2',
          memberId: 'member-2',
          amount: new Prisma.Decimal(30),
          type: PointType.EARNED,
          createdAt: new Date('2023-01-02'),
        },
      ];

      mockPointRepository.findExpiredPoints.mockResolvedValue(mockExpiredPoints as any);
      mockPointRepository.expirePoints
        .mockResolvedValueOnce() // First member succeeds
        .mockRejectedValueOnce(new Error('Database error')); // Second member fails
      mockPointRepository.createMany
        .mockResolvedValueOnce([]) // First member succeeds
        .mockResolvedValueOnce([]); // This won't be called due to expirePoints failure

      const result = await service.processExpiredPoints();

      expect(result.totalPointsExpired).toBe(1); // Only first member processed
      expect(result.membersAffected).toBe(1);
      expect(result.pointsProcessed).toEqual(['point-1']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to process expired points for member member-2');
    });
  });

  describe('validateSufficientPoints', () => {
    it('should return true when member has sufficient points', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(100);

      const result = await service.validateSufficientPoints(mockMemberId, 75);

      expect(result).toBe(true);
    });

    it('should return false when member has insufficient points', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(50);

      const result = await service.validateSufficientPoints(mockMemberId, 75);

      expect(result).toBe(false);
    });

    it('should return false when repository throws error', async () => {
      mockPointRepository.getAvailableBalance.mockRejectedValue(new Error('Database error'));

      const result = await service.validateSufficientPoints(mockMemberId, 75);

      expect(result).toBe(false);
    });
  });

  describe('getExpiringPoints', () => {
    it('should return points expiring within specified days', async () => {
      const mockExpiringPoints = [
        {
          id: 'point-1',
          memberId: mockMemberId,
          amount: new Prisma.Decimal(50),
          type: PointType.EARNED,
          description: 'Expiring points',
          expiresAt: new Date(),
          isExpired: false,
          createdAt: new Date(),
        },
      ];

      mockPointRepository.findExpiringPoints.mockResolvedValue(mockExpiringPoints as any);

      const result = await service.getExpiringPoints(7);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('point-1');
      expect(mockPointRepository.findExpiringPoints).toHaveBeenCalledWith(7);
    });
  });
});