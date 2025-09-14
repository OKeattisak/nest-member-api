import { RequestContext } from './trace.util';

export interface ErrorContext {
  traceId: string;
  timestamp: string;
  operation?: string;
  userId?: string;
  userType?: 'member' | 'admin';
  metadata?: Record<string, any>;
}

export class ErrorContextUtil {
  /**
   * Create error context for logging and debugging
   */
  static createContext(
    operation?: string,
    userId?: string,
    userType?: 'member' | 'admin',
    metadata?: Record<string, any>
  ): ErrorContext {
    return {
      traceId: RequestContext.getTraceId(),
      timestamp: new Date().toISOString(),
      operation,
      userId,
      userType,
      metadata,
    };
  }

  /**
   * Create error context from request
   */
  static createFromRequest(
    request: any,
    operation?: string,
    metadata?: Record<string, any>
  ): ErrorContext {
    const userId = request.user?.id || request.user?.sub;
    const userType = request.user?.type;
    
    return this.createContext(operation, userId, userType, {
      url: request.url,
      method: request.method,
      userAgent: request.get?.('User-Agent'),
      ip: request.ip,
      ...metadata,
    });
  }

  /**
   * Enhance error with context information
   */
  static enhanceError(error: Error, context: ErrorContext): Error {
    // Add context to error object for debugging
    (error as any).context = context;
    return error;
  }

  /**
   * Extract error context from enhanced error
   */
  static extractContext(error: Error): ErrorContext | undefined {
    return (error as any).context;
  }

  /**
   * Create sanitized error details for API responses
   */
  static createSanitizedDetails(error: Error, includeStack = false): any {
    const context = this.extractContext(error);
    const details: any = {
      timestamp: context?.timestamp || new Date().toISOString(),
      traceId: context?.traceId || RequestContext.getTraceId(),
    };

    if (context?.operation) {
      details.operation = context.operation;
    }

    if (includeStack && error.stack) {
      details.stack = error.stack;
    }

    // Include non-sensitive metadata
    if (context?.metadata) {
      const sanitizedMetadata = this.sanitizeMetadata(context.metadata);
      if (Object.keys(sanitizedMetadata).length > 0) {
        details.metadata = sanitizedMetadata;
      }
    }

    return details;
  }

  /**
   * Sanitize metadata by removing sensitive information
   */
  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'hash', 'authorization'];

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}