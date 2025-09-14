import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { JobsService } from '@/infrastructure/jobs/jobs.service';
import { PointExpirationJob } from '@/domains/point/services/point-expiration.job';
import { ExpirationProcessingResult } from '@/domains/point/services/point.service';

describe('JobsService', () => {
  let service: JobsService;
  let pointExpirationJob: jest.Mocked<PointExpirationJob>;

  const mockExpirationResult: ExpirationProcessingResult = {
    totalPointsExpired: 5,
    membersAffected: 2,
    pointsProcessed: ['point1', 'point2', 'point3', 'point4', 'point5'],
    errors: [],
  };

  beforeEach(async () => {
    const mockPointExpirationJob = {
      triggerManualExpiration: jest.fn(),
      getJobStatus: jest.fn(),
      checkExpiringPoints: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PointExpirationJob,
          useValue: mockPointExpirationJob,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    pointExpirationJob = module.get(PointExpirationJob);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executePointExpirationJob', () => {
    it('should execute point expiration job successfully', async () => {
      pointExpirationJob.triggerManualExpiration.mockResolvedValue(mockExpirationResult);

      const result = await service.executePointExpirationJob();

      expect(result.jobName).toBe('point-expiration');
      expect(result.status).toBe('completed');
      expect(result.result).toEqual(mockExpirationResult);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.executionId).toBeDefined();
      expect(pointExpirationJob.triggerManualExpiration).toHaveBeenCalledTimes(1);
    });

    it('should handle job execution failure', async () => {
      const error = new Error('Job execution failed');
      pointExpirationJob.triggerManualExpiration.mockRejectedValue(error);

      const result = await service.executePointExpirationJob();

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Job execution failed');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should record job execution in history', async () => {
      pointExpirationJob.triggerManualExpiration.mockResolvedValue(mockExpirationResult);

      await service.executePointExpirationJob();

      const monitoring = service.getJobMonitoringData('point-expiration');
      expect(monitoring.totalExecutions).toBe(1);
      expect(monitoring.successfulExecutions).toBe(1);
      expect(monitoring.failedExecutions).toBe(0);
    });
  });

  describe('executePointExpirationJobWithRetry', () => {
    it('should succeed on first attempt', async () => {
      pointExpirationJob.triggerManualExpiration.mockResolvedValue(mockExpirationResult);

      const result = await service.executePointExpirationJobWithRetry(3);

      expect(result.status).toBe('completed');
      expect(result.retryCount).toBe(0);
      expect(pointExpirationJob.triggerManualExpiration).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      pointExpirationJob.triggerManualExpiration
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mockExpirationResult);

      const result = await service.executePointExpirationJobWithRetry(3);

      expect(result.status).toBe('completed');
      expect(result.retryCount).toBe(1);
      expect(pointExpirationJob.triggerManualExpiration).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const error = new Error('Persistent failure');
      pointExpirationJob.triggerManualExpiration.mockRejectedValue(error);

      const result = await service.executePointExpirationJobWithRetry(2);

      expect(result.status).toBe('failed');
      expect(result.retryCount).toBe(1);
      expect(pointExpirationJob.triggerManualExpiration).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for retries', async () => {
      const startTime = Date.now();
      pointExpirationJob.triggerManualExpiration
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce(mockExpirationResult);

      await service.executePointExpirationJobWithRetry(3);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take at least 1000ms (first retry) + 2000ms (second retry) = 3000ms
      // Adding some tolerance for test execution time
      expect(duration).toBeGreaterThan(2500);
    });
  });

  describe('getJobMonitoringData', () => {
    it('should return empty monitoring data for non-existent job', () => {
      const monitoring = service.getJobMonitoringData('non-existent-job');

      expect(monitoring.totalExecutions).toBe(0);
      expect(monitoring.successfulExecutions).toBe(0);
      expect(monitoring.failedExecutions).toBe(0);
      expect(monitoring.lastExecution).toBeUndefined();
      expect(monitoring.averageDuration).toBeUndefined();
    });

    it('should calculate monitoring data correctly', async () => {
      // Execute successful job
      pointExpirationJob.triggerManualExpiration.mockResolvedValue(mockExpirationResult);
      await service.executePointExpirationJob();

      // Execute failed job
      pointExpirationJob.triggerManualExpiration.mockRejectedValue(new Error('Test error'));
      await service.executePointExpirationJob();

      const monitoring = service.getJobMonitoringData('point-expiration');

      expect(monitoring.totalExecutions).toBe(2);
      expect(monitoring.successfulExecutions).toBe(1);
      expect(monitoring.failedExecutions).toBe(1);
      expect(monitoring.lastExecution).toBeDefined();
      expect(monitoring.lastExecution!.status).toBe('failed');
      expect(monitoring.averageDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRecentJobExecutions', () => {
    it('should return recent executions in reverse chronological order', async () => {
      pointExpirationJob.triggerManualExpiration.mockResolvedValue(mockExpirationResult);

      // Execute multiple jobs with small delays to ensure different timestamps
      await service.executePointExpirationJob();
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.executePointExpirationJob();
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.executePointExpirationJob();

      const recent = service.getRecentJobExecutions('point-expiration', 2);

      expect(recent).toHaveLength(2);
      expect(recent[0]!.startTime.getTime()).toBeGreaterThanOrEqual(recent[1]!.startTime.getTime());
    });

    it('should return empty array for non-existent job', () => {
      const recent = service.getRecentJobExecutions('non-existent-job');
      expect(recent).toEqual([]);
    });
  });

  describe('getPointExpirationJobStatus', () => {
    it('should return job status from point expiration job', () => {
      const mockStatus = { isProcessing: false, lastRun: new Date() };
      pointExpirationJob.getJobStatus.mockReturnValue(mockStatus);

      const status = service.getPointExpirationJobStatus();

      expect(status).toEqual(mockStatus);
      expect(pointExpirationJob.getJobStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkExpiringPoints', () => {
    it('should check expiring points with default days', async () => {
      await service.checkExpiringPoints();

      expect(pointExpirationJob.checkExpiringPoints).toHaveBeenCalledWith(7);
    });

    it('should check expiring points with custom days', async () => {
      await service.checkExpiringPoints(14);

      expect(pointExpirationJob.checkExpiringPoints).toHaveBeenCalledWith(14);
    });
  });

  describe('getAllJobsMonitoringData', () => {
    it('should return monitoring data for all jobs', async () => {
      pointExpirationJob.triggerManualExpiration.mockResolvedValue(mockExpirationResult);
      await service.executePointExpirationJob();

      const allMonitoring = service.getAllJobsMonitoringData();

      expect(allMonitoring).toHaveProperty('point-expiration');
      expect(allMonitoring['point-expiration']!.totalExecutions).toBe(1);
    });

    it('should return empty object when no jobs have been executed', () => {
      const allMonitoring = service.getAllJobsMonitoringData();
      expect(allMonitoring).toEqual({});
    });
  });

  describe('job execution history management', () => {
    it('should limit execution history to maximum entries', async () => {
      pointExpirationJob.triggerManualExpiration.mockResolvedValue(mockExpirationResult);

      // Execute more jobs than the history limit (100)
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(service.executePointExpirationJob());
      }
      await Promise.all(promises);

      const monitoring = service.getJobMonitoringData('point-expiration');
      expect(monitoring.totalExecutions).toBe(100); // Should be capped at maxExecutionHistory
    });
  });
});