import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  HealthCheckService, 
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaService: PrismaService,
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {}

  async checkHealth() {
    const healthCheckEnabled = this.configService.get<boolean>('HEALTH_CHECK_ENABLED', true);
    const databaseCheckEnabled = this.configService.get<boolean>('HEALTH_CHECK_DATABASE_ENABLED', true);
    const memoryHeapThreshold = this.configService.get<number>('HEALTH_CHECK_MEMORY_HEAP_THRESHOLD', 150);
    const memoryRssThreshold = this.configService.get<number>('HEALTH_CHECK_MEMORY_RSS_THRESHOLD', 150);

    if (!healthCheckEnabled) {
      return {
        status: 'ok',
        info: { message: 'Health checks are disabled' },
        error: {},
        details: {},
      };
    }

    const checks = [
      // Memory checks
      () => this.memory.checkHeap('memory_heap', memoryHeapThreshold * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', memoryRssThreshold * 1024 * 1024),
      
      // Disk check
      () => this.disk.checkStorage('storage', { 
        path: process.cwd(), 
        thresholdPercent: 0.9 
      }),
    ];

    // Add database check if enabled
    if (databaseCheckEnabled) {
      checks.push(() => this.checkDatabase());
    }

    try {
      const result = await this.health.check(checks);
      
      this.loggerService.debug('Health check completed successfully', 'HealthService', {
        operation: 'health_check',
        metadata: { 
          status: result.status,
          checks: Object.keys(result.info || {}),
        },
      });

      return result;
    } catch (error) {
      this.loggerService.error('Health check failed', undefined, 'HealthService', {
        operation: 'health_check_error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  async checkReadiness() {
    const databaseCheckEnabled = this.configService.get<boolean>('HEALTH_CHECK_DATABASE_ENABLED', true);
    
    const checks = [];

    // Add database check if enabled
    if (databaseCheckEnabled) {
      checks.push(() => this.checkDatabase());
    }

    if (checks.length === 0) {
      return {
        status: 'ok',
        info: { message: 'Application is ready' },
        error: {},
        details: {},
      };
    }

    try {
      const result = await this.health.check(checks);
      
      this.loggerService.debug('Readiness check completed successfully', 'HealthService', {
        operation: 'readiness_check',
        metadata: { status: result.status },
      });

      return result;
    } catch (error) {
      this.loggerService.error('Readiness check failed', undefined, 'HealthService', {
        operation: 'readiness_check_error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  async checkLiveness() {
    // Simple liveness check - just return ok if the service is running
    return {
      status: 'ok',
      info: { 
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        pid: process.pid,
        version: process.env.npm_package_version || '1.0.0',
      },
      error: {},
      details: {},
    };
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.prismaService.isHealthy();
      const duration = Date.now() - startTime;
      
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }

      return {
        database: {
          status: 'up',
          responseTime: `${duration}ms`,
          connection: this.prismaService.getConnectionInfo(),
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      
      this.loggerService.error('Database health check failed', undefined, 'HealthService', {
        operation: 'database_health_check',
        duration,
        metadata: { error: errorMessage },
      });

      throw new Error(`Database check failed: ${errorMessage}`);
    }
  }

  // Get detailed system information
  async getSystemInfo() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      system: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        pid: process.pid,
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      database: this.prismaService.getConnectionInfo(),
    };
  }
}