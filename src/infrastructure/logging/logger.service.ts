import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { RequestContext } from '../../common/utils/trace.util';

export interface LogContext {
  traceId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private formatMessage(message: string, context?: string, logContext?: LogContext): any {
    const traceId = logContext?.traceId || RequestContext.getTraceId();
    
    return {
      message,
      context,
      traceId,
      ...logContext,
    };
  }

  log(message: string, context?: string, logContext?: LogContext): void {
    this.logger.info(this.formatMessage(message, context, logContext));
  }

  error(message: string, trace?: string, context?: string, logContext?: LogContext): void {
    this.logger.error({
      ...this.formatMessage(message, context, logContext),
      stack: trace,
    });
  }

  warn(message: string, context?: string, logContext?: LogContext): void {
    this.logger.warn(this.formatMessage(message, context, logContext));
  }

  debug(message: string, context?: string, logContext?: LogContext): void {
    this.logger.debug(this.formatMessage(message, context, logContext));
  }

  verbose(message: string, context?: string, logContext?: LogContext): void {
    this.logger.verbose(this.formatMessage(message, context, logContext));
  }

  // Business event logging methods
  logAuthenticationAttempt(email: string, success: boolean, ip?: string): void {
    this.log('Authentication attempt', 'AuthService', {
      operation: 'authentication',
      metadata: {
        email,
        success,
        ip,
      },
    });
  }

  logPointTransaction(memberId: string, amount: number, type: string, description: string): void {
    this.log('Point transaction', 'PointService', {
      operation: 'point_transaction',
      userId: memberId,
      metadata: {
        amount,
        type,
        description,
      },
    });
  }

  logPrivilegeExchange(memberId: string, privilegeId: string, pointCost: number): void {
    this.log('Privilege exchange', 'PrivilegeService', {
      operation: 'privilege_exchange',
      userId: memberId,
      metadata: {
        privilegeId,
        pointCost,
      },
    });
  }

  logDatabaseQuery(query: string, duration: number, params?: any[]): void {
    this.debug('Database query executed', 'DatabaseService', {
      operation: 'database_query',
      duration,
      metadata: {
        query: query.substring(0, 200), // Truncate long queries
        params: params?.length ? `${params.length} parameters` : 'no parameters',
      },
    });
  }

  logSlowQuery(query: string, duration: number, threshold: number): void {
    this.warn('Slow database query detected', 'DatabaseService', {
      operation: 'slow_query',
      duration,
      metadata: {
        query: query.substring(0, 200),
        threshold,
        performance_issue: true,
      },
    });
  }

  logApiPerformance(method: string, url: string, duration: number, statusCode: number): void {
    const message = duration > 2000 ? 'Slow API endpoint detected' : 'API endpoint performance';
    const logContext = {
      operation: 'api_performance',
      duration,
      metadata: {
        method,
        url,
        statusCode,
        performance_issue: duration > 2000,
      },
    };
    
    if (duration > 2000) {
      this.warn(message, 'ApiPerformance', logContext);
    } else {
      this.debug(message, 'ApiPerformance', logContext);
    }
  }

  logSystemStartup(component: string, duration?: number): void {
    this.log(`System component started: ${component}`, 'SystemStartup', {
      operation: 'system_startup',
      duration,
      metadata: {
        component,
      },
    });
  }

  logBackgroundJob(jobName: string, status: 'started' | 'completed' | 'failed', duration?: number, error?: string): void {
    const message = `Background job ${status}: ${jobName}`;
    const logContext = {
      operation: 'background_job',
      duration,
      metadata: {
        jobName,
        status,
        error,
      },
    };
    
    if (status === 'failed') {
      this.error(message, undefined, 'BackgroundJob', logContext);
    } else {
      this.log(message, 'BackgroundJob', logContext);
    }
  }
}