import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { performanceConfig } from './winston.config';

@Injectable()
export class PrismaLoggingService {
  constructor(private readonly logger: LoggerService) {}

  createPrismaLogMiddleware() {
    return async (params: any, next: any) => {
      if (!performanceConfig.enableDatabaseLogging) {
        return next(params);
      }

      const startTime = Date.now();
      const { model, action } = params;
      
      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        
        // Log the query
        this.logger.logDatabaseQuery(
          `${model}.${action}`,
          duration,
          params.args ? Object.keys(params.args) : undefined,
        );
        
        // Log slow queries
        if (duration > performanceConfig.slowQueryThreshold) {
          this.logger.logSlowQuery(
            `${model}.${action}`,
            duration,
            performanceConfig.slowQueryThreshold,
          );
        }
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        this.logger.error(
          `Database query failed: ${model}.${action}`,
          error?.stack,
          'PrismaService',
          {
            operation: 'database_error',
            duration,
            metadata: {
              model,
              action,
              error: error?.message,
            },
          },
        );
        
        throw error;
      }
    };
  }
}