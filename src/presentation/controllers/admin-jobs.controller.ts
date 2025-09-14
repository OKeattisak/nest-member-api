import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { JobsService, JobExecutionResult, JobMonitoringData } from '../../infrastructure/jobs/jobs.service';
import { ApiSuccessResponse } from '../../common/interfaces/api-response.interface';
import { ExpirationProcessingResult } from '../../domains/point/services/point.service';
import { ApiTags } from '@nestjs/swagger';

export interface JobStatusResponse {
  isProcessing: boolean;
  lastRun?: Date;
}

export interface ExpiringPointsCheckResponse {
  message: string;
  daysChecked: number;
}

@ApiTags('Admin Jobs')
@Controller('admin/jobs')
@UseGuards(AdminJwtGuard)
export class AdminJobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Manually trigger point expiration job
   */
  @Post('point-expiration/trigger')
  @HttpCode(HttpStatus.OK)
  async triggerPointExpiration(): Promise<ApiSuccessResponse<JobExecutionResult>> {
    const result = await this.jobsService.executePointExpirationJob();
    
    return {
      success: true,
      data: result,
      message: result.status === 'completed' 
        ? 'Point expiration job completed successfully'
        : 'Point expiration job failed',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: `job-${result.executionId}`,
      },
    };
  }

  /**
   * Trigger point expiration job with retry logic
   */
  @Post('point-expiration/trigger-with-retry')
  @HttpCode(HttpStatus.OK)
  async triggerPointExpirationWithRetry(
    @Query('maxRetries', new ParseIntPipe({ optional: true })) maxRetries: number = 3
  ): Promise<ApiSuccessResponse<JobExecutionResult>> {
    const result = await this.jobsService.executePointExpirationJobWithRetry(maxRetries);
    
    return {
      success: true,
      data: result,
      message: result.status === 'completed' 
        ? `Point expiration job completed successfully${result.retryCount ? ` after ${result.retryCount} retries` : ''}`
        : `Point expiration job failed after ${maxRetries} attempts`,
      meta: {
        timestamp: new Date().toISOString(),
        traceId: `job-${result.executionId}`,
      },
    };
  }

  /**
   * Get point expiration job status
   */
  @Get('point-expiration/status')
  async getPointExpirationJobStatus(): Promise<ApiSuccessResponse<JobStatusResponse>> {
    const status = this.jobsService.getPointExpirationJobStatus();
    
    return {
      success: true,
      data: status,
      message: 'Point expiration job status retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: `status-${Date.now()}`,
      },
    };
  }

  /**
   * Get job monitoring data for point expiration
   */
  @Get('point-expiration/monitoring')
  async getPointExpirationMonitoring(): Promise<ApiSuccessResponse<JobMonitoringData>> {
    const monitoring = this.jobsService.getJobMonitoringData('point-expiration');
    
    return {
      success: true,
      data: monitoring,
      message: 'Point expiration job monitoring data retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: `monitoring-${Date.now()}`,
      },
    };
  }

  /**
   * Get recent job executions
   */
  @Get('point-expiration/executions')
  async getRecentJobExecutions(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10
  ): Promise<ApiSuccessResponse<JobExecutionResult[]>> {
    const executions = this.jobsService.getRecentJobExecutions('point-expiration', limit);
    
    return {
      success: true,
      data: executions,
      message: 'Recent job executions retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: `executions-${Date.now()}`,
      },
    };
  }

  /**
   * Check for points expiring soon
   */
  @Post('point-expiration/check-expiring')
  @HttpCode(HttpStatus.OK)
  async checkExpiringPoints(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 7
  ): Promise<ApiSuccessResponse<ExpiringPointsCheckResponse>> {
    await this.jobsService.checkExpiringPoints(days);
    
    return {
      success: true,
      data: {
        message: `Checked for points expiring within ${days} days`,
        daysChecked: days,
      },
      message: 'Expiring points check completed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: `expiring-check-${Date.now()}`,
      },
    };
  }

  /**
   * Get all jobs monitoring data
   */
  @Get('monitoring')
  async getAllJobsMonitoring(): Promise<ApiSuccessResponse<Record<string, JobMonitoringData>>> {
    const monitoring = this.jobsService.getAllJobsMonitoringData();
    
    return {
      success: true,
      data: monitoring,
      message: 'All jobs monitoring data retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: `all-monitoring-${Date.now()}`,
      },
    };
  }
}