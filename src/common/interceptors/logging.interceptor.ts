import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestContext } from '../utils/trace.util';
import { LoggerService } from '../../infrastructure/logging/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const traceId = RequestContext.getTraceId();
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      'RequestLogger',
      {
        traceId,
        operation: 'http_request',
        metadata: {
          method,
          url,
          ip,
          userAgent,
        },
      }
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const { statusCode } = response;
        
        // Log successful response
        this.logger.log(
          `Outgoing Response: ${method} ${url} ${statusCode} - ${duration}ms`,
          'ResponseLogger',
          {
            traceId,
            operation: 'http_response',
            duration,
            metadata: {
              method,
              url,
              statusCode,
            },
          }
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Log error response
        this.logger.error(
          `Error Response: ${method} ${url} - ${duration}ms`,
          error.stack,
          'ErrorLogger',
          {
            traceId,
            operation: 'http_error',
            duration,
            metadata: {
              method,
              url,
              error: error.message,
            },
          }
        );
        
        throw error;
      }),
    );
  }
}