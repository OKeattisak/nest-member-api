import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { performanceConfig } from '@/infrastructure/logging/winston.config';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!performanceConfig.enablePerformanceLogging) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const { statusCode } = response;
        
        // Log API performance
        this.logger.logApiPerformance(method, url, duration, statusCode);
        
        // Log memory usage for long-running requests
        if (duration > performanceConfig.slowRequestThreshold) {
          const memoryUsage = process.memoryUsage();
          this.logger.warn('High memory usage detected', 'PerformanceMonitor', {
            operation: 'memory_monitoring',
            duration,
            metadata: {
              method,
              url,
              memoryUsage: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
              },
            },
          });
        }
      }),
    );
  }
}