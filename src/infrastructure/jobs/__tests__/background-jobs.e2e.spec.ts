import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsModule } from '../jobs.module';
import { JobsService } from '../jobs.service';
import { PointExpirationJob } from '../../../domains/point/services/point-expiration.job';
import { PointService } from '../../../domains/point/services/point.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { validateConfig } from '../../../infrastructure/config/config.interface';

describe('Background Jobs E2E', () => {
  let app: INestApplication;
  let jobsService: JobsService;
  let pointService: PointService;
  let pointExpirationJob: PointExpirationJob;
  let prismaService: PrismaService;

  // Mock implementations for testing
  const mockPointService = {
    processExpiredPoints: jest.fn(),
    getExpiringPoints: jest.fn(),
  };

  const mockPrismaService = {
    member: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    point: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateConfig,
        }),
        ScheduleModule.forRoot(),
        JobsModule,
      ],
    })
      .overrideProvider(PointService)
      .useValue(mockPointService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jobsService = moduleFixture.get<JobsService>(JobsService);
    pointService = moduleFixture.get<PointService>(PointService);
    pointExpirationJob = moduleFixture.get<PointExpirationJob>(PointExpirationJob);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Point Expiration Job Integration', () => {
    it('should execute point expiration job end-to-end', async () => {
      // Mock successful point expiration
      const mockResult = {
        totalPointsExpired: 15,
        membersAffected: 5,
        pointsProcessed: ['p1', 'p2', 'p3', 'p4', 'p5'],
        errors: [],
      };
      mockPointService.processExpiredPoints.mockResolvedValue(mockResult);

      // Execute the job
      const result = await jobsService.executePointExpirationJob();

      // Verify job execution
      expect(result.status).toBe('completed');
      expect(result.result).toEqual(mockResult);
      expect(result.duration).toBeGreaterThan(0);
      expect(mockPointService.processExpiredPoints).toHaveBeenCalledTimes(1);

      // Verify monitoring data is updated
      const monitoring = jobsService.getJobMonitoringData('point-expiration');
      expect(monitoring.totalExecutions).toBe(1);
      expect(monitoring.successfulExecutions).toBe(1);
      expect(monitoring.failedExecutions).toBe(0);
    });

    it('should handle job failures and retry logic', async () => {
      // Mock initial failures followed by success
      mockPointService.processExpiredPoints
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockRejectedValueOnce(new Error('Temporary service unavailable'))
        .mockResolvedValueOnce({
          totalPointsExpired: 3,
          membersAffected: 1,
          pointsProcessed: ['p1', 'p2', 'p3'],
          errors: [],
        });

      // Execute with retry
      const result = await jobsService.executePointExpirationJobWithRetry(3);

      // Verify successful execution after retries
      expect(result.status).toBe('completed');
      expect(result.retryCount).toBe(2);
      expect(mockPointService.processExpiredPoints).toHaveBeenCalledTimes(3);

      // Verify monitoring includes retry information
      const monitoring = jobsService.getJobMonitoringData('point-expiration');
      expect(monitoring.totalExecutions).toBe(3); // All attempts are recorded
      expect(monitoring.successfulExecutions).toBe(1);
      expect(monitoring.failedExecutions).toBe(2);
    });

    it('should handle persistent failures after max retries', async () => {
      const persistentError = new Error('Persistent database error');
      mockPointService.processExpiredPoints.mockRejectedValue(persistentError);

      // Execute with retry
      const result = await jobsService.executePointExpirationJobWithRetry(2);

      // Verify failure after max retries
      expect(result.status).toBe('failed');
      expect(result.retryCount).toBe(1);
      expect(result.error).toBe('Persistent database error');
      expect(mockPointService.processExpiredPoints).toHaveBeenCalledTimes(2);
    });
  });

  describe('Job Monitoring and Status', () => {
    it('should track job execution history correctly', async () => {
      const results = [
        { totalPointsExpired: 5, membersAffected: 2, pointsProcessed: ['p1'], errors: [] },
        { totalPointsExpired: 0, membersAffected: 0, pointsProcessed: [], errors: [] },
        { totalPointsExpired: 10, membersAffected: 3, pointsProcessed: ['p2', 'p3'], errors: ['Minor error'] },
      ];

      // Execute multiple jobs
      for (const mockResult of results) {
        mockPointService.processExpiredPoints.mockResolvedValueOnce(mockResult);
        await jobsService.executePointExpirationJob();
      }

      // Verify monitoring data
      const monitoring = jobsService.getJobMonitoringData('point-expiration');
      expect(monitoring.totalExecutions).toBe(3);
      expect(monitoring.successfulExecutions).toBe(3);
      expect(monitoring.failedExecutions).toBe(0);
      expect(monitoring.averageDuration).toBeGreaterThan(0);

      // Verify recent executions
      const recent = jobsService.getRecentJobExecutions('point-expiration', 2);
      expect(recent).toHaveLength(2);
      expect(recent[0].startTime.getTime()).toBeGreaterThan(recent[1].startTime.getTime());
    });

    it('should provide job status information', async () => {
      // Mock job status
      jest.spyOn(pointExpirationJob, 'getJobStatus').mockReturnValue({
        isProcessing: false,
        lastRun: new Date('2023-01-01T12:00:00Z'),
      });

      const status = jobsService.getPointExpirationJobStatus();

      expect(status.isProcessing).toBe(false);
      expect(status.lastRun).toEqual(new Date('2023-01-01T12:00:00Z'));
    });
  });

  describe('Expiring Points Check', () => {
    it('should check for expiring points', async () => {
      const mockExpiringPoints = [
        {
          id: 'point1',
          memberId: 'member1',
          amount: 100,
          signedAmount: 100,
          type: 'EARNED' as const,
          description: 'Test points',
          expiresAt: new Date('2023-01-08T00:00:00Z'),
          isExpired: false,
          createdAt: new Date('2023-01-01T00:00:00Z'),
        },
      ];

      mockPointService.getExpiringPoints.mockResolvedValue(mockExpiringPoints);
      jest.spyOn(pointExpirationJob, 'checkExpiringPoints').mockResolvedValue();

      await jobsService.checkExpiringPoints(7);

      expect(pointExpirationJob.checkExpiringPoints).toHaveBeenCalledWith(7);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection errors gracefully', async () => {
      const dbError = new Error('Database connection timeout');
      mockPointService.processExpiredPoints.mockRejectedValue(dbError);

      const result = await jobsService.executePointExpirationJob();

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Database connection timeout');
    });

    it('should handle partial processing errors', async () => {
      const partialResult = {
        totalPointsExpired: 5,
        membersAffected: 2,
        pointsProcessed: ['p1', 'p2', 'p3'],
        errors: [
          'Failed to process points for member member1',
          'Failed to send notification to member member2',
        ],
      };
      mockPointService.processExpiredPoints.mockResolvedValue(partialResult);

      const result = await jobsService.executePointExpirationJob();

      expect(result.status).toBe('completed');
      expect(result.result.errors).toHaveLength(2);
      expect(result.result.totalPointsExpired).toBe(5);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of expired points efficiently', async () => {
      // Mock processing of large dataset
      const largeResult = {
        totalPointsExpired: 10000,
        membersAffected: 1000,
        pointsProcessed: Array.from({ length: 10000 }, (_, i) => `point${i}`),
        errors: [],
      };
      mockPointService.processExpiredPoints.mockResolvedValue(largeResult);

      const startTime = Date.now();
      const result = await jobsService.executePointExpirationJob();
      const endTime = Date.now();

      expect(result.status).toBe('completed');
      expect(result.result.totalPointsExpired).toBe(10000);
      expect(result.duration).toBe(endTime - result.startTime.getTime());
    });

    it('should maintain execution history within limits', async () => {
      mockPointService.processExpiredPoints.mockResolvedValue({
        totalPointsExpired: 1,
        membersAffected: 1,
        pointsProcessed: ['p1'],
        errors: [],
      });

      // Execute more jobs than the history limit
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(jobsService.executePointExpirationJob());
      }
      await Promise.all(promises);

      const monitoring = jobsService.getJobMonitoringData('point-expiration');
      expect(monitoring.totalExecutions).toBeLessThanOrEqual(100);
    });
  });

  describe('Concurrent Job Execution', () => {
    it('should handle concurrent job execution attempts', async () => {
      // Mock a slow-running job
      mockPointService.processExpiredPoints.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          totalPointsExpired: 1,
          membersAffected: 1,
          pointsProcessed: ['p1'],
          errors: [],
        }), 100))
      );

      // Start multiple jobs concurrently
      const promises = [
        jobsService.executePointExpirationJob(),
        jobsService.executePointExpirationJob(),
        jobsService.executePointExpirationJob(),
      ];

      const results = await Promise.all(promises);

      // All jobs should complete (the point expiration job handles concurrency internally)
      results.forEach(result => {
        expect(['completed', 'failed']).toContain(result.status);
      });
    });
  });
});