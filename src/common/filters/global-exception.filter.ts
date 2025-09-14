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
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

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
      message = this.sanitizeErrorMessage(exception.message);
      
      if ('details' in exception) {
        details = this.sanitizeErrorDetails((exception as any).details);
      }
      
      // Log domain exceptions with appropriate level
      const logLevel = this.getDomainExceptionLogLevel(exception);
      this.logException(logLevel, exception, request, traceId, 'domain_exception');
      
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma database errors
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      errorCode = prismaError.code;
      message = prismaError.message;
      details = prismaError.details;
      
      this.logger.error(
        `Database error: ${exception.code} - ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
        {
          traceId,
          operation: 'database_error',
          metadata: {
            url: request.url,
            method: request.method,
            prismaCode: exception.code,
            prismaMessage: exception.message,
          },
        }
      );
      
    } else if (exception instanceof PrismaClientValidationError) {
      // Handle Prisma validation errors
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'DATABASE_VALIDATION_ERROR';
      message = 'Invalid data provided';
      
      this.logger.error(
        `Database validation error: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
        {
          traceId,
          operation: 'database_validation_error',
          metadata: {
            url: request.url,
            method: request.method,
          },
        }
      );
      
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        errorCode = responseObj.error || 'HTTP_EXCEPTION';
        message = this.sanitizeErrorMessage(responseObj.message || exception.message);
        details = this.sanitizeErrorDetails(responseObj.details);
      } else {
        errorCode = 'HTTP_EXCEPTION';
        message = this.sanitizeErrorMessage(exception.message);
      }
      
      this.logException('warn', exception, request, traceId, 'http_exception');
      
    } else if (exception instanceof Error) {
      // Handle generic errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred';
      
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
        {
          traceId,
          operation: 'unexpected_error',
          metadata: {
            url: request.url,
            method: request.method,
            errorName: exception.name,
            errorMessage: exception.message,
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
          operation: 'unknown_error',
          metadata: {
            url: request.url,
            method: request.method,
            exceptionType: typeof exception,
            exceptionValue: String(exception),
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
      // Generic domain exceptions
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
        
      // Member domain exceptions
      case 'MEMBER_ALREADY_EXISTS':
        return HttpStatus.CONFLICT;
      case 'MEMBER_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'MEMBER_INACTIVE':
        return HttpStatus.FORBIDDEN;
      case 'INVALID_CREDENTIALS':
        return HttpStatus.UNAUTHORIZED;
      case 'WEAK_PASSWORD':
        return HttpStatus.BAD_REQUEST;
      case 'PASSWORD_MISMATCH':
        return HttpStatus.UNAUTHORIZED;
      case 'MEMBER_PROFILE_UPDATE_FAILED':
        return HttpStatus.UNPROCESSABLE_ENTITY;
        
      // Point domain exceptions
      case 'INSUFFICIENT_POINTS':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'INVALID_POINT_AMOUNT':
        return HttpStatus.BAD_REQUEST;
      case 'POINT_TRANSACTION_FAILED':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'POINT_EXPIRATION_ERROR':
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case 'INVALID_EXPIRATION_DATE':
        return HttpStatus.BAD_REQUEST;
      case 'POINT_HISTORY_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
        
      // Privilege domain exceptions
      case 'PRIVILEGE_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'PRIVILEGE_ALREADY_EXISTS':
        return HttpStatus.CONFLICT;
      case 'PRIVILEGE_NOT_AVAILABLE':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'PRIVILEGE_ALREADY_OWNED':
        return HttpStatus.CONFLICT;
      case 'PRIVILEGE_EXCHANGE_FAILED':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'INVALID_PRIVILEGE_COST':
        return HttpStatus.BAD_REQUEST;
      case 'MEMBER_PRIVILEGE_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'MEMBER_PRIVILEGE_ALREADY_INACTIVE':
        return HttpStatus.CONFLICT;
      case 'PRIVILEGE_EXPIRATION_ERROR':
        return HttpStatus.INTERNAL_SERVER_ERROR;
        
      // Admin domain exceptions
      case 'ADMIN_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'ADMIN_ALREADY_EXISTS':
        return HttpStatus.CONFLICT;
      case 'ADMIN_INACTIVE':
        return HttpStatus.FORBIDDEN;
      case 'INVALID_ADMIN_CREDENTIALS':
        return HttpStatus.UNAUTHORIZED;
      case 'INSUFFICIENT_ADMIN_PRIVILEGES':
        return HttpStatus.FORBIDDEN;
        
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): {
    status: number;
    code: string;
    message: string;
    details?: any;
  } {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A record with this information already exists',
          details: { fields: error.meta?.target },
        };
      case 'P2025':
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
        };
      case 'P2003':
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Invalid reference to related record',
          details: { field: error.meta?.field_name },
        };
      case 'P2014':
        // Required relation violation
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'REQUIRED_RELATION_VIOLATION',
          message: 'Required relation is missing',
          details: { relation: error.meta?.relation_name },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
        };
    }
  }

  private getDomainExceptionLogLevel(exception: DomainException): 'error' | 'warn' | 'info' {
    // Business rule violations and validation errors are warnings
    const warningCodes = [
      'VALIDATION_ERROR',
      'BUSINESS_RULE_VIOLATION',
      'INSUFFICIENT_POINTS',
      'PRIVILEGE_NOT_AVAILABLE',
      'PRIVILEGE_ALREADY_OWNED',
      'MEMBER_ALREADY_EXISTS',
      'PRIVILEGE_ALREADY_EXISTS',
      'ADMIN_ALREADY_EXISTS',
      'WEAK_PASSWORD',
      'INVALID_POINT_AMOUNT',
      'INVALID_PRIVILEGE_COST',
      'INVALID_EXPIRATION_DATE',
    ];
    
    // Authentication and authorization errors are info level (expected in normal operation)
    const infoCodes = [
      'INVALID_CREDENTIALS',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'PASSWORD_MISMATCH',
      'INVALID_ADMIN_CREDENTIALS',
      'INSUFFICIENT_ADMIN_PRIVILEGES',
      'MEMBER_INACTIVE',
      'ADMIN_INACTIVE',
    ];
    
    if (infoCodes.includes(exception.code)) {
      return 'info';
    } else if (warningCodes.includes(exception.code)) {
      return 'warn';
    } else {
      return 'error';
    }
  }

  private logException(
    level: 'error' | 'warn' | 'info',
    exception: Error,
    request: Request,
    traceId: string,
    operation: string
  ): void {
    const logMessage = `${request.method} ${request.url} - ${exception.name}: ${exception.message}`;
    const context = 'GlobalExceptionFilter';
    const metadata = {
      traceId,
      operation,
      metadata: {
        url: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        exceptionName: exception.name,
        exceptionMessage: exception.message,
      },
    };

    switch (level) {
      case 'error':
        this.logger.error(logMessage, exception.stack, context, metadata);
        break;
      case 'warn':
        this.logger.warn(logMessage, context, metadata);
        break;
      case 'info':
        this.logger.log(logMessage, context, metadata);
        break;
    }
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    return message
      .replace(/password/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/secret/gi, '[REDACTED]')
      .replace(/key/gi, '[REDACTED]');
  }

  private sanitizeErrorDetails(details: any): any {
    if (!details || typeof details !== 'object') {
      return details;
    }

    const sanitized = { ...details };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}