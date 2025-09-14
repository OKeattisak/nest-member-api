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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AdminJwtGuard } from '@/common/guards/admin-jwt.guard';
import { JobsService, JobExecutionResult, JobMonitoringData } from '@/infrastructure/jobs/jobs.service';
import { ApiSuccessResponse } from '@/common/interfaces/api-response.interface';
import { ApiDocumentationHelper } from '@/common/swagger/api-documentation.helper';

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
@ApiBearerAuth()
export class AdminJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('point-expiration/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger point expiration job',
    description: 'Manually trigger the point expiration job to process expired points immediately. This job identifies and marks expired points as expired using FIFO logic.'
  })
  @ApiResponse({
    status: 200,
    description: 'Point expiration job triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            executionId: { type: 'string', example: 'exec-123456789' },
            status: { type: 'string', example: 'completed', enum: ['completed', 'failed', 'running'] },
            startTime: { type: 'string', example: '2023-12-01T12:00:00.000Z' },
            endTime: { type: 'string', example: '2023-12-01T12:00:05.000Z' },
            duration: { type: 'number', example: 5000 },
            processedCount: { type: 'number', example: 150 },
            errorCount: { type: 'number', example: 0 },
            result: {
              type: 'object',
              properties: {
                expiredPointsCount: { type: 'number', example: 150 },
                totalPointsExpired: { type: 'number', example: 7500 },
                affectedMembersCount: { type: 'number', example: 45 }
              }
            }
          }
        },
        message: { type: 'string', example: 'Point expiration job completed successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T12:00:05.000Z' },
            traceId: { type: 'string', example: 'job-exec-123456789' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.INTERNAL_ERROR)
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

  @Post('point-expiration/trigger-with-retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger point expiration job with retry',
    description: 'Manually trigger the point expiration job with automatic retry logic in case of failures. Useful for handling transient errors.'
  })
  @ApiQuery({
    name: 'maxRetries',
    required: false,
    type: Number,
    description: 'Maximum number of retry attempts (default: 3)',
    example: 3
  })
  @ApiResponse({
    status: 200,
    description: 'Point expiration job with retry triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            executionId: { type: 'string', example: 'exec-retry-123456789' },
            status: { type: 'string', example: 'completed', enum: ['completed', 'failed', 'running'] },
            startTime: { type: 'string', example: '2023-12-01T12:05:00.000Z' },
            endTime: { type: 'string', example: '2023-12-01T12:05:08.000Z' },
            duration: { type: 'number', example: 8000 },
            retryCount: { type: 'number', example: 1 },
            maxRetries: { type: 'number', example: 3 },
            processedCount: { type: 'number', example: 150 },
            errorCount: { type: 'number', example: 0 }
          }
        },
        message: { type: 'string', example: 'Point expiration job completed successfully after 1 retries' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T12:05:08.000Z' },
            traceId: { type: 'string', example: 'job-exec-retry-123456789' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
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

  @Get('point-expiration/status')
  @ApiOperation({
    summary: 'Get point expiration job status',
    description: 'Get the current status of the point expiration job, including whether it is currently running and when it last executed.'
  })
  @ApiResponse({
    status: 200,
    description: 'Point expiration job status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            isProcessing: { type: 'boolean', example: false },
            lastRun: { type: 'string', example: '2023-12-01T12:00:00.000Z', nullable: true }
          }
        },
        message: { type: 'string', example: 'Point expiration job status retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T12:10:00.000Z' },
            traceId: { type: 'string', example: 'status-1701432600000' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
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

  @Get('point-expiration/monitoring')
  @ApiOperation({
    summary: 'Get point expiration job monitoring data',
    description: 'Retrieve comprehensive monitoring data for the point expiration job, including execution statistics and performance metrics.'
  })
  @ApiResponse({
    status: 200,
    description: 'Point expiration job monitoring data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            jobName: { type: 'string', example: 'point-expiration' },
            totalExecutions: { type: 'number', example: 45 },
            successfulExecutions: { type: 'number', example: 43 },
            failedExecutions: { type: 'number', example: 2 },
            averageDuration: { type: 'number', example: 4500 },
            lastExecution: {
              type: 'object',
              properties: {
                executionId: { type: 'string', example: 'exec-123456789' },
                status: { type: 'string', example: 'completed' },
                startTime: { type: 'string', example: '2023-12-01T12:00:00.000Z' },
                duration: { type: 'number', example: 5000 },
                processedCount: { type: 'number', example: 150 }
              }
            }
          }
        },
        message: { type: 'string', example: 'Point expiration job monitoring data retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T12:15:00.000Z' },
            traceId: { type: 'string', example: 'monitoring-1701433200000' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
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

  @Get('point-expiration/executions')
  @ApiOperation({
    summary: 'Get recent job executions',
    description: 'Retrieve a list of recent point expiration job executions with their results and performance data.'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of executions to return (default: 10)',
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Recent job executions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              executionId: { type: 'string', example: 'exec-123456789' },
              status: { type: 'string', example: 'completed', enum: ['completed', 'failed', 'running'] },
              startTime: { type: 'string', example: '2023-12-01T12:00:00.000Z' },
              endTime: { type: 'string', example: '2023-12-01T12:00:05.000Z' },
              duration: { type: 'number', example: 5000 },
              processedCount: { type: 'number', example: 150 },
              errorCount: { type: 'number', example: 0 },
              retryCount: { type: 'number', example: 0 }
            }
          }
        },
        message: { type: 'string', example: 'Recent job executions retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T12:20:00.000Z' },
            traceId: { type: 'string', example: 'executions-1701433500000' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
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

  @Post('point-expiration/check-expiring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for expiring points',
    description: 'Perform a check for points that will expire within the specified number of days. This is useful for generating member notifications.'
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead for expiring points (default: 7)',
    example: 7
  })
  @ApiResponse({
    status: 200,
    description: 'Expiring points check completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Checked for points expiring within 7 days' },
            daysChecked: { type: 'number', example: 7 }
          }
        },
        message: { type: 'string', example: 'Expiring points check completed successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T12:25:00.000Z' },
            traceId: { type: 'string', example: 'expiring-check-1701433800000' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
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

  @Get('monitoring')
  @ApiOperation({
    summary: 'Get all jobs monitoring data',
    description: 'Retrieve comprehensive monitoring data for all background jobs in the system.'
  })
  @ApiResponse({
    status: 200,
    description: 'All jobs monitoring data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              jobName: { type: 'string', example: 'point-expiration' },
              totalExecutions: { type: 'number', example: 45 },
              successfulExecutions: { type: 'number', example: 43 },
              failedExecutions: { type: 'number', example: 2 },
              averageDuration: { type: 'number', example: 4500 }
            }
          },
          example: {
            'point-expiration': {
              jobName: 'point-expiration',
              totalExecutions: 45,
              successfulExecutions: 43,
              failedExecutions: 2,
              averageDuration: 4500
            }
          }
        },
        message: { type: 'string', example: 'All jobs monitoring data retrieved successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T12:30:00.000Z' },
            traceId: { type: 'string', example: 'all-monitoring-1701434100000' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
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