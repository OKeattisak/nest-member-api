import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Returns the overall health status of the application including database, memory, and disk checks'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Health check failed - service unavailable' 
  })
  async check() {
    return this.healthService.checkHealth();
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness check endpoint',
    description: 'Returns whether the application is ready to serve requests (database connectivity, etc.)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is ready' 
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Application is not ready' 
  })
  async ready() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness check endpoint',
    description: 'Returns whether the application is alive and running'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            uptime: { type: 'number', example: 123.456 },
            timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            pid: { type: 'number', example: 12345 },
            version: { type: 'string', example: '1.0.0' },
          },
        },
      },
    },
  })
  async live() {
    return this.healthService.checkLiveness();
  }

  @Get('info')
  @ApiOperation({ 
    summary: 'System information endpoint',
    description: 'Returns detailed system information including memory usage, CPU usage, and database configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        system: { type: 'object' },
        memory: { type: 'object' },
        cpu: { type: 'object' },
        database: { type: 'object' },
      },
    },
  })
  async info() {
    return this.healthService.getSystemInfo();
  }
}