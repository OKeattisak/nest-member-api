import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PointExpirationJob } from './point-expiration.job';
import { PointService, ExpirationProcessingResult } from './point.service';

describe('PointExpirationJob', () => {
  let job: PointExpirationJob;
  let mockPointService: jest.Mocked<PointService>;

  beforeEach(async () => {
    const mockService = {
      processExpiredPoints: jest.fn(),
      getExpiringPoints: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointExpirationJob,
        {
          provide: PointService,
          useValue: mockService,
        },
      ],
    }).compile();

    job = module.get<PointExpirationJob>(PointExpirationJob);
    mockPointService = module.get(PointService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset processing state
    (job as any).isProcessing = false;
  });

  describe('handlePointExpiration', () => {
    it('should successfully process expired points', async () => {
      const mockResult: ExpirationProcessingResult = {
        totalPointsExpired: 5,
        membersAffected: 3,
        pointsProcessed: ['point-1', 'point-2', 'point-3', 'point-4', 'point-5'],
        errors: [],
      };

      mockPointService.processExpiredPoints.mockResolvedValue(mockResult);

      await job.handlePointExpiration();

      expect(mockPointService.processExpiredPoints).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.log).toHaveBeenCalledWith('Starting scheduled point expiration job');
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Point expiration job completed successfully')
      );
    });

    it('should handle processing errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockPointService.processExpiredPoints.mockRejectedValue(error);

      await job.handlePointExpiration();

      expect(mockPointService.processExpiredPoints).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Point expiration job failed'),
        error
      );
    });

    it('should skip execution if already processing', async () => {
      // Set processing state to true
      (job as any).isProcessing = true;

      await job.handlePointExpiration();

      expect(mockPointService.processExpiredPoints).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Point expiration job is already running, skipping this execution'
      );
    });

    it('should log warnings when processing completes with errors', async () => {
      const mockResult: ExpirationProcessingResult = {
        totalPointsExpired: 3,
        membersAffected: 2,
        pointsProcessed: ['point-1', 'point-2', 'point-3'],
        errors: ['Failed to process member-123', 'Database timeout for member-456'],
      };

      mockPointService.processExpiredPoints.mockResolvedValue(mockResult);

      await job.handlePointExpiration();

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Point expiration job completed with errors:',
        mockResult.errors
      );
    });

    it('should reset processing state even if an error occurs', async () => {
      const error = new Error('Unexpected error');
      mockPointService.processExpiredPoints.mockRejectedValue(error);

      await job.handlePointExpiration();

      // Verify processing state is reset
      expect((job as any).isProcessing).toBe(false);
    });
  });

  describe('triggerManualExpiration', () => {
    it('should successfully trigger manual expiration', async () => {
      const mockResult: ExpirationProcessingResult = {
        totalPointsExpired: 2,
        membersAffected: 1,
        pointsProcessed: ['point-1', 'point-2'],
        errors: [],
      };

      mockPointService.processExpiredPoints.mockResolvedValue(mockResult);

      const result = await job.triggerManualExpiration();

      expect(result).toEqual(mockResult);
      expect(mockPointService.processExpiredPoints).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.log).toHaveBeenCalledWith('Manual point expiration triggered');
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Manual point expiration completed')
      );
    });

    it('should throw error if already processing', async () => {
      // Set processing state to true
      (job as any).isProcessing = true;

      await expect(job.triggerManualExpiration()).rejects.toThrow(
        'Point expiration job is already running'
      );

      expect(mockPointService.processExpiredPoints).not.toHaveBeenCalled();
    });

    it('should handle processing errors and reset state', async () => {
      const error = new Error('Processing failed');
      mockPointService.processExpiredPoints.mockRejectedValue(error);

      await expect(job.triggerManualExpiration()).rejects.toThrow('Processing failed');

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Manual point expiration failed'),
        error
      );
      expect((job as any).isProcessing).toBe(false);
    });
  });

  describe('getJobStatus', () => {
    it('should return correct job status when not processing', () => {
      const status = job.getJobStatus();

      expect(status.isProcessing).toBe(false);
    });

    it('should return correct job status when processing', () => {
      (job as any).isProcessing = true;

      const status = job.getJobStatus();

      expect(status.isProcessing).toBe(true);
    });
  });

  describe('checkExpiringPoints', () => {
    it('should check and log expiring points', async () => {
      const mockExpiringPoints = [
        {
          id: 'point-1',
          memberId: 'member-1',
          amount: 50,
          signedAmount: 50,
          type: 'EARNED' as any,
          description: 'Expiring points',
          expiresAt: new Date(),
          isExpired: false,
          createdAt: new Date(),
        },
        {
          id: 'point-2',
          memberId: 'member-1',
          amount: 30,
          signedAmount: 30,
          type: 'EARNED' as any,
          description: 'More expiring points',
          expiresAt: new Date(),
          isExpired: false,
          createdAt: new Date(),
        },
        {
          id: 'point-3',
          memberId: 'member-2',
          amount: 25,
          signedAmount: 25,
          type: 'EARNED' as any,
          description: 'Another member expiring points',
          expiresAt: new Date(),
          isExpired: false,
          createdAt: new Date(),
        },
      ];

      mockPointService.getExpiringPoints.mockResolvedValue(mockExpiringPoints);

      await job.checkExpiringPoints(7);

      expect(mockPointService.getExpiringPoints).toHaveBeenCalledWith(7);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Found 3 points expiring within 7 days'
      );
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        'Member member-1 has 2 points (80 total) expiring within 7 days'
      );
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        'Member member-2 has 1 points (25 total) expiring within 7 days'
      );
    });

    it('should handle case when no points are expiring', async () => {
      mockPointService.getExpiringPoints.mockResolvedValue([]);

      await job.checkExpiringPoints(7);

      expect(mockPointService.getExpiringPoints).toHaveBeenCalledWith(7);
      expect(Logger.prototype.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Found')
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      mockPointService.getExpiringPoints.mockRejectedValue(error);

      await job.checkExpiringPoints(7);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to check expiring points:',
        error
      );
    });
  });

  describe('handleExpiringPointsCheck', () => {
    it('should run weekly expiring points check', async () => {
      const mockExpiringPoints: any[] = [];
      mockPointService.getExpiringPoints.mockResolvedValue(mockExpiringPoints);

      await job.handleExpiringPointsCheck();

      expect(Logger.prototype.log).toHaveBeenCalledWith('Running weekly expiring points check');
      expect(mockPointService.getExpiringPoints).toHaveBeenCalledWith(7);
    });
  });
});