import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DatabaseConfigType } from '@/infrastructure/config/database.config';
import { LoggingConfigType } from '@/infrastructure/config/logging.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly databaseConfig: DatabaseConfigType;
  private readonly loggingConfig: LoggingConfigType;
  private connectionRetries = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    const databaseConfig = configService.get<DatabaseConfigType>('database')!;
    const loggingConfig = configService.get<LoggingConfigType>('logging')!;

    super({
      datasources: {
        db: {
          url: databaseConfig.url,
        },
      },
      log: PrismaService.getLogConfig(loggingConfig),
      errorFormat: 'pretty',
    });

    this.databaseConfig = databaseConfig;
    this.loggingConfig = loggingConfig;

    // Set up query logging if enabled
    if (this.loggingConfig.enableDbLogging) {
      this.setupQueryLogging();
    }
  }

  private static getLogConfig(loggingConfig: LoggingConfigType) {
    const logConfig: any[] = [];
    
    if (loggingConfig.enableDbLogging) {
      logConfig.push(
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' }
      );
    } else {
      logConfig.push(
        { level: 'error', emit: 'event' }
      );
    }

    return logConfig;
  }

  private setupQueryLogging() {
    (this as any).$on('query', (e: any) => {
      const duration = e.duration;
      const query = e.query;
      const params = e.params;

      if (duration > this.loggingConfig.slowQueryThreshold) {
        this.loggerService.warn(`Slow query detected: ${duration}ms`, 'PrismaService', {
          operation: 'slow_query',
          duration,
          metadata: {
            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
            params,
          },
        });
      } else if (this.loggingConfig.enableDbLogging) {
        this.loggerService.debug(`Query executed: ${duration}ms`, 'PrismaService', {
          operation: 'query',
          duration,
          metadata: {
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
          },
        });
      }
    });

    (this as any).$on('info', (e: any) => {
      this.loggerService.log(e.message, 'PrismaService', {
        operation: 'database_info',
        metadata: e,
      });
    });

    (this as any).$on('warn', (e: any) => {
      this.loggerService.warn(e.message, 'PrismaService', {
        operation: 'database_warning',
        metadata: e,
      });
    });

    (this as any).$on('error', (e: any) => {
      this.loggerService.error(e.message, undefined, 'PrismaService', {
        operation: 'database_error',
        metadata: e,
      });
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
    this.loggerService.logSystemStartup('PrismaService');
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.loggerService.log('Database connection closed', 'PrismaService', {
        operation: 'database_disconnect',
      });
    } catch (error) {
      this.loggerService.error('Error closing database connection', undefined, 'PrismaService', {
        operation: 'database_disconnect_error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  private async connectWithRetry(): Promise<void> {
    const maxRetries = this.databaseConfig.retryAttempts;
    
    while (this.connectionRetries < maxRetries) {
      try {
        await this.$connect();
        this.loggerService.log('Database connected successfully', 'PrismaService', {
          operation: 'database_connect',
          metadata: { retries: this.connectionRetries },
        });
        return;
      } catch (error) {
        this.connectionRetries++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        this.loggerService.error(
          `Database connection attempt ${this.connectionRetries} failed: ${errorMessage}`,
          undefined,
          'PrismaService',
          {
            operation: 'database_connect_retry',
            metadata: {
              attempt: this.connectionRetries,
              maxRetries,
              error: errorMessage,
            },
          }
        );

        if (this.connectionRetries >= maxRetries) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${errorMessage}`);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.databaseConfig.retryDelay));
      }
    }
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      this.loggerService.log('Application shutting down, closing database connection', 'PrismaService', {
        operation: 'application_shutdown',
      });
      await app.close();
    });
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.loggerService.error('Database health check failed', undefined, 'PrismaService', {
        operation: 'health_check',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      return false;
    }
  }

  // Get connection info for monitoring
  getConnectionInfo() {
    return {
      maxConnections: this.databaseConfig.maxConnections,
      connectionTimeout: this.databaseConfig.connectionTimeout,
      idleTimeout: this.databaseConfig.idleTimeout,
      maxLifetime: this.databaseConfig.maxLifetime,
      retryAttempts: this.databaseConfig.retryAttempts,
      retryDelay: this.databaseConfig.retryDelay,
    };
  }
}