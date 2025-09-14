import { AdminJobsController } from '../admin-jobs.controller';
import { JobsService, JobExecutionResult, JobMonitoringData } from '@/infrastructure/jobs/jobs.service';

describe('AdminJobsController', () => {
  let controller: AdminJobsController;
  let jobsService: jest.Mocked<JobsService>;

  const mockJobExecutionResult: JobExecutionResult = {
    jobName: 'point-expiration',
    executionId: 'test-execution-id',
    startTime: new Date('2023-01-01T00:00:00Z'),
    endTime: new Date('2023-01-01T00:01:00Z'),
    duration: 60000,
    status: 'completed',
    result: {
      totalPointsExpired: 10,
      membersAffected: 3,
      pointsProcessed: ['p1', 'p2', 'p3'],
      errors: [],
    } as ExpirationProcessingResult,
  };

  const mockJobMonitoringData: JobMonitoringData = {
    totalExecutions: 5,
    successfulExecutions: 4,
    failedExecutions: 1,
    lastExecution: mockJobExecutionResult,
    averageDuration: 45000,
  };

  beforeEach(() => {
    const mockJobsService = {
      executePointExpirationJob: jest.fn(),
      executePointExpirationJobWithRetry: jest.fn(),
      getPointExpirationJobStatus: jest.fn(),
      getJobMonitoringData: jest.fn(),
      getRecentJobExecutions: jest.fn(),
      checkExpiringPoints: jest.fn(),
      getAllJobsMonitoringData: jest.fn(),
    };

    jobsService = mockJobsService as any;
    controller = new AdminJobsController(jobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerPointExpiration', () => {
    it('should trigger point expiration job successfully', async () => {
      jobsService.executePointExpirationJob.mockResolvedValue(mockJobExecutionResult);

      const result = await controller.triggerPointExpiration();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobExecutionResult);
      expect(result.message).toBe('Point expiration job completed successfully');
      expect(jobsService.executePointExpirationJob).toHaveBeenCalledTimes(1);
    });

    it('should handle failed job execution', async () => {
      const failedResult: JobExecutionResult = {
        ...mockJobExecutionResult,
        status: 'failed',
        error: 'Job execution failed',
      };
      jobsService.executePointExpirationJob.mockResolvedValue(failedResult);

      const result = await controller.triggerPointExpiration();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(failedResult);
      expect(result.message).toBe('Point expiration job failed');
    });
  });

  describe('triggerPointExpirationWithRetry', () => {
    it('should trigger point expiration job with default retry count', async () => {
      jobsService.executePointExpirationJobWithRetry.mockResolvedValue(mockJobExecutionResult);

      const result = await controller.triggerPointExpirationWithRetry();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobExecutionResult);
      expect(result.message).toBe('Point expiration job completed successfully');
      expect(jobsService.executePointExpirationJobWithRetry).toHaveBeenCalledWith(3);
    });

    it('should trigger point expiration job with custom retry count', async () => {
      jobsService.executePointExpirationJobWithRetry.mockResolvedValue(mockJobExecutionResult);

      const result = await controller.triggerPointExpirationWithRetry(5);

      expect(result.success).toBe(true);
      expect(jobsService.executePointExpirationJobWithRetry).toHaveBeenCalledWith(5);
    });

    it('should handle job with retries', async () => {
      const resultWithRetries: JobExecutionResult = {
        ...mockJobExecutionResult,
        retryCount: 2,
      };
      jobsService.executePointExpirationJobWithRetry.mockResolvedValue(resultWithRetries);

      const result = await controller.triggerPointExpirationWithRetry();

      expect(result.message).toBe('Point expiration job completed successfully after 2 retries');
    });

    it('should handle failed job after retries', async () => {
      const failedResult: JobExecutionResult = {
        ...mockJobExecutionResult,
        status: 'failed',
        error: 'All retries failed',
      };
      jobsService.executePointExpirationJobWithRetry.mockResolvedValue(failedResult);

      const result = await controller.triggerPointExpirationWithRetry(3);

      expect(result.message).toBe('Point expiration job failed after 3 attempts');
    });
  });

  describe('getPointExpirationJobStatus', () => {
    it('should return job status', async () => {
      const mockStatus = { isProcessing: false, lastRun: new Date() };
      jobsService.getPointExpirationJobStatus.mockReturnValue(mockStatus);

      const result = await controller.getPointExpirationJobStatus();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStatus);
      expect(result.message).toBe('Point expiration job status retrieved successfully');
    });

    it('should return processing status', async () => {
      const mockStatus = { isProcessing: true };
      jobsService.getPointExpirationJobStatus.mockReturnValue(mockStatus);

      const result = await controller.getPointExpirationJobStatus();

      expect(result.data.isProcessing).toBe(true);
    });
  });

  describe('getPointExpirationMonitoring', () => {
    it('should return monitoring data', async () => {
      jobsService.getJobMonitoringData.mockReturnValue(mockJobMonitoringData);

      const result = await controller.getPointExpirationMonitoring();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobMonitoringData);
      expect(result.message).toBe('Point expiration job monitoring data retrieved successfully');
      expect(jobsService.getJobMonitoringData).toHaveBeenCalledWith('point-expiration');
    });
  });

  describe('getRecentJobExecutions', () => {
    it('should return recent executions with default limit', async () => {
      const mockExecutions = [mockJobExecutionResult];
      jobsService.getRecentJobExecutions.mockReturnValue(mockExecutions);

      const result = await controller.getRecentJobExecutions();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockExecutions);
      expect(result.message).toBe('Recent job executions retrieved successfully');
      expect(jobsService.getRecentJobExecutions).toHaveBeenCalledWith('point-expiration', 10);
    });

    it('should return recent executions with custom limit', async () => {
      const mockExecutions = [mockJobExecutionResult];
      jobsService.getRecentJobExecutions.mockReturnValue(mockExecutions);

      const result = await controller.getRecentJobExecutions(5);

      expect(result.success).toBe(true);
      expect(jobsService.getRecentJobExecutions).toHaveBeenCalledWith('point-expiration', 5);
    });
  });

  describe('checkExpiringPoints', () => {
    it('should check expiring points with default days', async () => {
      jobsService.checkExpiringPoints.mockResolvedValue();

      const result = await controller.checkExpiringPoints();

      expect(result.success).toBe(true);
      expect(result.data.daysChecked).toBe(7);
      expect(result.data.message).toBe('Checked for points expiring within 7 days');
      expect(jobsService.checkExpiringPoints).toHaveBeenCalledWith(7);
    });

    it('should check expiring points with custom days', async () => {
      jobsService.checkExpiringPoints.mockResolvedValue();

      const result = await controller.checkExpiringPoints(14);

      expect(result.success).toBe(true);
      expect(result.data.daysChecked).toBe(14);
      expect(result.data.message).toBe('Checked for points expiring within 14 days');
      expect(jobsService.checkExpiringPoints).toHaveBeenCalledWith(14);
    });
  });

  describe('getAllJobsMonitoring', () => {
    it('should return all jobs monitoring data', async () => {
      const mockAllMonitoring = {
        'point-expiration': mockJobMonitoringData,
        'another-job': {
          totalExecutions: 2,
          successfulExecutions: 2,
          failedExecutions: 0,
          averageDuration: 30000,
        },
      };
      jobsService.getAllJobsMonitoringData.mockReturnValue(mockAllMonitoring);

      const result = await controller.getAllJobsMonitoring();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAllMonitoring);
      expect(result.message).toBe('All jobs monitoring data retrieved successfully');
    });

    it('should return empty object when no jobs exist', async () => {
      jobsService.getAllJobsMonitoringData.mockReturnValue({});

      const result = await controller.getAllJobsMonitoring();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe('error handling', () => {
    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      jobsService.executePointExpirationJob.mockRejectedValue(error);

      await expect(controller.triggerPointExpiration()).rejects.toThrow('Service error');
    });

    it('should propagate retry service errors', async () => {
      const error = new Error('Retry service error');
      jobsService.executePointExpirationJobWithRetry.mockRejectedValue(error);

      await expect(controller.triggerPointExpirationWithRetry()).rejects.toThrow('Retry service error');
    });

    it('should propagate expiring points check errors', async () => {
      const error = new Error('Check expiring points error');
      jobsService.checkExpiringPoints.mockRejectedValue(error);

      await expect(controller.checkExpiringPoints()).rejects.toThrow('Check expiring points error');
    });
  });
});