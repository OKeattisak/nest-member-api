import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';
import { DomainException } from '../exceptions/domain.exception';
import { RequestContext } from '../utils/trace.util';
import { LoggerService } from '../../infrastructure/logging/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const traceId = RequestContext.getTraceId();
    const timestamp = new Date().toISOString();
    
    let status: number;
    let errorCode: string;
    let message: string;
    let details: any;

    if (exception instanceof DomainException) {
      // Handle domain exceptions
      status = this.mapDomainExceptionToHttpStatus(exception);
      errorCode = exception.code;
      message = exception.message;
      
      if ('details' in exception) {
        details = (exception as any).details;
      }
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        errorCode = responseObj.error || 'HTTP_EXCEPTION';
        message = responseObj.message || exception.message;
        details = responseObj.details;
      } else {
        errorCode = 'HTTP_EXCEPTION';
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Handle generic errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred';
      
      // Log the actual error for debugging
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
        {
          traceId,
          operation: 'error_handling',
          metadata: {
            url: request.url,
            method: request.method,
          },
        }
      );
    } else {
      // Handle unknown exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'UNKNOWN_ERROR';
      message = 'An unknown error occurred';
      
      this.logger.error(
        `Unknown exception type: ${typeof exception}`,
        JSON.stringify(exception),
        'GlobalExceptionFilter',
        {
          traceId,
          operation: 'unknown_error_handling',
          metadata: {
            url: request.url,
            method: request.method,
          },
        }
      );
    }

    // Log the error with context
    this.logger.error(
      `${request.method} ${request.url} - ${status} ${errorCode}: ${message}`,
      undefined,
      'GlobalExceptionFilter',
      {
        traceId,
        operation: 'exception_handling',
        metadata: {
          status,
          errorCode,
          message,
          details,
          userAgent: request.get('User-Agent'),
          ip: request.ip,
          url: request.url,
          method: request.method,
        },
      }
    );

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp,
        traceId,
      },
    };

    response.status(status).json(errorResponse);
  }

  private mapDomainExceptionToHttpStatus(exception: DomainException): number {
    switch (exception.code) {
      case 'VALIDATION_ERROR':
        return HttpStatus.BAD_REQUEST;
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'UNAUTHORIZED':
        return HttpStatus.UNAUTHORIZED;
      case 'FORBIDDEN':
        return HttpStatus.FORBIDDEN;
      case 'CONFLICT':
        return HttpStatus.CONFLICT;
      case 'BUSINESS_RULE_VIOLATION':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}