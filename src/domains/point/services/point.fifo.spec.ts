import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PointService } from './point.service';
import { IPointRepository } from '../repositories/point.repository.interface';

describe('PointService FIFO Logic', () => {
  let service: PointService;
  let mockPointRepository: jest.Mocked<IPointRepository>;

  const mockMemberId = 'member-123';

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

  describe('FIFO Point Exchange Logic', () => {
    it('should exchange points in FIFO order (oldest first)', async () => {
      // Setup: Member has points from different dates
      const availablePoints = [
        { id: 'point-1', amount: 50, createdAt: new Date('2023-01-01'), expiresAt: null },
        { id: 'point-2', amount: 30, createdAt: new Date('2023-01-02'), expiresAt: null },
        { id: 'point-3', amount: 40, createdAt: new Date('2023-01-03'), expiresAt: null },
      ];

      mockPointRepository.getAvailableBalance.mockResolvedValue(120);
      mockPointRepository.getAvailablePoints.mockResolvedValue(availablePoints);
      mockPointRepository.createMany.mockResolvedValue([]);

      // Test: Exchange 75 points for privilege
      await service.exchangePoints(mockMemberId, 75, 'Premium Access');

      // Verify: Should create exchange records in FIFO order
      expect(mockPointRepository.createMany).toHaveBeenCalledWith([
        {
          memberId: mockMemberId,
          amount: 50, // Full amount from first point (oldest)
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-1)',
        },
        {
          memberId: mockMemberId,
          amount: 25, // Partial amount from second point
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-2)',
        },
      ]);
    });

    it('should handle exact point amount exchange', async () => {
      const availablePoints = [
        { id: 'point-1', amount: 100, createdAt: new Date('2023-01-01'), expiresAt: null },
      ];

      mockPointRepository.getAvailableBalance.mockResolvedValue(100);
      mockPointRepository.getAvailablePoints.mockResolvedValue(availablePoints);
      mockPointRepository.createMany.mockResolvedValue([]);

      await service.exchangePoints(mockMemberId, 100, 'Premium Access');

      expect(mockPointRepository.createMany).toHaveBeenCalledWith([
        {
          memberId: mockMemberId,
          amount: 100,
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-1)',
        },
      ]);
    });

    it('should handle multiple small point entries in FIFO order', async () => {
      const availablePoints = [
        { id: 'point-1', amount: 10, createdAt: new Date('2023-01-01'), expiresAt: null },
        { id: 'point-2', amount: 15, createdAt: new Date('2023-01-02'), expiresAt: null },
        { id: 'point-3', amount: 20, createdAt: new Date('2023-01-03'), expiresAt: null },
        { id: 'point-4', amount: 25, createdAt: new Date('2023-01-04'), expiresAt: null },
      ];

      mockPointRepository.getAvailableBalance.mockResolvedValue(70);
      mockPointRepository.getAvailablePoints.mockResolvedValue(availablePoints);
      mockPointRepository.createMany.mockResolvedValue([]);

      await service.exchangePoints(mockMemberId, 42, 'Premium Access');

      expect(mockPointRepository.createMany).toHaveBeenCalledWith([
        {
          memberId: mockMemberId,
          amount: 10, // First point (oldest)
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-1)',
        },
        {
          memberId: mockMemberId,
          amount: 15, // Second point
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-2)',
        },
        {
          memberId: mockMemberId,
          amount: 17, // Partial from third point (42 - 10 - 15 = 17)
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-3)',
        },
      ]);
    });

    it('should throw error when insufficient balance for exchange', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(50);

      await expect(
        service.exchangePoints(mockMemberId, 100, 'Premium Access')
      ).rejects.toThrow('Insufficient points for privilege exchange. Required: 100, Available: 50');

      expect(mockPointRepository.getAvailablePoints).not.toHaveBeenCalled();
      expect(mockPointRepository.createMany).not.toHaveBeenCalled();
    });

    it('should handle edge case where available points exactly match required amount', async () => {
      const availablePoints = [
        { id: 'point-1', amount: 25, createdAt: new Date('2023-01-01'), expiresAt: null },
        { id: 'point-2', amount: 25, createdAt: new Date('2023-01-02'), expiresAt: null },
      ];

      mockPointRepository.getAvailableBalance.mockResolvedValue(50);
      mockPointRepository.getAvailablePoints.mockResolvedValue(availablePoints);
      mockPointRepository.createMany.mockResolvedValue([]);

      await service.exchangePoints(mockMemberId, 50, 'Premium Access');

      expect(mockPointRepository.createMany).toHaveBeenCalledWith([
        {
          memberId: mockMemberId,
          amount: 25,
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-1)',
        },
        {
          memberId: mockMemberId,
          amount: 25,
          type: 'EXCHANGED',
          description: 'Exchanged for privilege: Premium Access (FIFO from point point-2)',
        },
      ]);
    });
  });

  describe('FIFO Point Deduction Logic', () => {
    it('should validate sufficient balance before attempting deduction', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(50);

      await expect(
        service.deductPoints({
          memberId: mockMemberId,
          amount: 100,
          description: 'Test deduction',
        })
      ).rejects.toThrow('Insufficient points. Required: 100, Available: 50');

      expect(mockPointRepository.deductPoints).not.toHaveBeenCalled();
    });

    it('should call repository deductPoints when sufficient balance exists', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(100);
      mockPointRepository.deductPoints.mockResolvedValue([]);

      await service.deductPoints({
        memberId: mockMemberId,
        amount: 75,
        description: 'Test deduction',
      });

      expect(mockPointRepository.getAvailableBalance).toHaveBeenCalledWith(mockMemberId);
      expect(mockPointRepository.deductPoints).toHaveBeenCalledWith(
        mockMemberId,
        75,
        'Test deduction'
      );
    });
  });

  describe('Point Balance Calculation', () => {
    it('should return available balance from repository', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(150);

      const balance = await service.getAvailableBalance(mockMemberId);

      expect(balance).toBe(150);
      expect(mockPointRepository.getAvailableBalance).toHaveBeenCalledWith(mockMemberId);
    });

    it('should validate sufficient points correctly', async () => {
      mockPointRepository.getAvailableBalance.mockResolvedValue(100);

      const hasSufficient = await service.validateSufficientPoints(mockMemberId, 75);
      const hasInsufficient = await service.validateSufficientPoints(mockMemberId, 150);

      expect(hasSufficient).toBe(true);
      expect(hasInsufficient).toBe(false);
    });

    it('should return false for validation when repository throws error', async () => {
      mockPointRepository.getAvailableBalance.mockRejectedValue(new Error('Database error'));

      const result = await service.validateSufficientPoints(mockMemberId, 75);

      expect(result).toBe(false);
    });
  });
});