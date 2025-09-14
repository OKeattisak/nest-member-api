import { Injectable, Logger } from '@nestjs/common';
import { PointExpirationJob } from '../../domains/point/services/point-expiration.job';
import { ExpirationProcessingResult } from '../../domains/point/services/point.service';

export interface JobExecutionResult {
  jobName: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  retryCount?: number;
}

export interface JobMonitoringData {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecution?: JobExecutionResult;
  averageDuration?: number;
}

export interface JobStatus {
  isProcessing: boolean;
  lastRun?: Date;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly jobExecutions = new Map<string, JobExecutionResult[]>();
  private readonly maxExecutionHistory = 100; // Keep last 100 executions per job

  constructor(private readonly pointExpirationJob: PointExpirationJob) {}

  /**
   * Execute point expiration job manually
   */
  async executePointExpirationJob(): Promise<JobExecutionResult> {
    const executionId = this.generateExecutionId();
    const jobName = 'point-expiration';
    
    const execution: JobExecutionResult = {
      jobName,
      executionId,
      startTime: new Date(),
      status: 'running',
    };

    this.logger.log(`Starting manual execution of ${jobName} job (${executionId})`);

    try {
      const result = await this.pointExpirationJob.triggerManualExpiration();
      
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.status = 'completed';
      execution.result = result;

      this.logger.log(`Manual ${jobName} job completed successfully (${executionId}). Duration: ${execution.duration}ms`);
      
      // Log summary of results
      if (result.totalPointsExpired > 0) {
        this.logger.log(`Point expiration summary: ${result.totalPointsExpired} points expired for ${result.membersAffected} members`);
      }
      
      if (result.errors.length > 0) {
        this.logger.warn(`Point expiration completed with ${result.errors.length} errors:`, result.errors);
      }

    } catch (error) {
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Manual ${jobName} job failed (${executionId}):`, error);
    }

    this.recordJobExecution(execution);
    return execution;
  }

  /**
   * Execute point expiration job with retry logic
   */
  async executePointExpirationJobWithRetry(maxRetries: number = 3): Promise<JobExecutionResult> {
    let lastExecution: JobExecutionResult;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastExecution = await this.executePointExpirationJob();
      lastExecution.retryCount = attempt - 1;
      
      if (lastExecution.status === 'completed') {
        if (attempt > 1) {
          this.logger.log(`Point expiration job succeeded on attempt ${attempt}`);
        }
        return lastExecution;
      }
      
      if (attempt < maxRetries) {
        const delay = this.calculateRetryDelay(attempt);
        this.logger.warn(`Point expiration job failed on attempt ${attempt}, retrying in ${delay}ms`);
        await this.sleep(delay);
      }
    }
    
    this.logger.error(`Point expiration job failed after ${maxRetries} attempts`);
    return lastExecution!;
  }

  /**
   * Get job monitoring data
   */
  getJobMonitoringData(jobName: string): JobMonitoringData {
    const executions = this.jobExecutions.get(jobName) || [];
    
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const lastExecution = executions[executions.length - 1];
    
    const completedExecutions = executions.filter(e => e.duration !== undefined);
    const averageDuration = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
      : undefined;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      lastExecution,
      averageDuration,
    };
  }

  /**
   * Get recent job executions
   */
  getRecentJobExecutions(jobName: string, limit: number = 10): JobExecutionResult[] {
    const executions = this.jobExecutions.get(jobName) || [];
    return executions.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get all job names with monitoring data
   */
  getAllJobsMonitoringData(): Record<string, JobMonitoringData> {
    const result: Record<string, JobMonitoringData> = {};
    
    for (const jobName of this.jobExecutions.keys()) {
      result[jobName] = this.getJobMonitoringData(jobName);
    }
    
    return result;
  }

  /**
   * Get point expiration job status
   */
  getPointExpirationJobStatus(): JobStatus {
    return this.pointExpirationJob.getJobStatus();
  }

  /**
   * Check for points expiring soon
   */
  async checkExpiringPoints(days: number = 7): Promise<void> {
    this.logger.log(`Checking for points expiring within ${days} days`);
    await this.pointExpirationJob.checkExpiringPoints(days);
  }

  // Private helper methods

  private recordJobExecution(execution: JobExecutionResult): void {
    const jobName = execution.jobName;
    
    if (!this.jobExecutions.has(jobName)) {
      this.jobExecutions.set(jobName, []);
    }
    
    const executions = this.jobExecutions.get(jobName)!;
    executions.push(execution);
    
    // Keep only the most recent executions
    if (executions.length > this.maxExecutionHistory) {
      executions.splice(0, executions.length - this.maxExecutionHistory);
    }
  }

  private generateExecutionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}