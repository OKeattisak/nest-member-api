import { ErrorContextUtil } from '../utils/error-context.util';
import { DomainException } from '../exceptions/domain.exception';

// Simple logger interface for decorator use
interface SimpleLogger {
  warn(message: string, context?: string, logContext?: any): void;
  error(message: string, trace?: string, context?: string, logContext?: any): void;
  log(message: string, context?: string, logContext?: any): void;
}

// Create a simple console-based logger for decorator use
const createSimpleLogger = (): SimpleLogger => ({
  warn: (message: string, context?: string, logContext?: any) => {
    console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, logContext ? JSON.stringify(logContext) : '');
  },
  error: (message: string, trace?: string, context?: string, logContext?: any) => {
    console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, trace || '', logContext ? JSON.stringify(logContext) : '');
  },
  log: (message: string, context?: string, logContext?: any) => {
    console.log(`[INFO] ${context ? `[${context}] ` : ''}${message}`, logContext ? JSON.stringify(logContext) : '');
  },
});

/**
 * Decorator for automatic error handling and logging in service methods
 */
export function HandleErrors(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = createSimpleLogger();
      const operationName = operation || `${target.constructor.name}.${propertyName}`;
      
      try {
        const result = await method.apply(this, args);
        return result;
      } catch (error) {
        // Create error context
        const context = ErrorContextUtil.createContext(operationName, undefined, undefined, {
          className: target.constructor.name,
          methodName: propertyName,
          arguments: args.map((arg, index) => ({
            index,
            type: typeof arg,
            value: typeof arg === 'object' ? '[Object]' : String(arg).substring(0, 100),
          })),
        });

        // Enhance error with context
        const enhancedError = ErrorContextUtil.enhanceError(error as Error, context);

        // Log error based on type
        if (error instanceof DomainException) {
          logger.warn(
            `Domain exception in ${operationName}: ${error.message}`,
            target.constructor.name,
            context
          );
        } else {
          logger.error(
            `Unexpected error in ${operationName}: ${(error as Error).message}`,
            (error as Error).stack,
            target.constructor.name,
            context
          );
        }

        throw enhancedError;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for handling async operations with automatic retry logic
 */
export function RetryOnFailure(maxRetries = 3, delayMs = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = createSimpleLogger();
      const operationName = `${target.constructor.name}.${propertyName}`;
      
      let lastError: Error | undefined;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await method.apply(this, args);
          
          if (attempt > 1) {
            logger.log(
              `Operation ${operationName} succeeded on attempt ${attempt}`,
              target.constructor.name
            );
          }
          
          return result;
        } catch (error) {
          lastError = error as Error;
          
          // Don't retry domain exceptions (business logic errors)
          if (error instanceof DomainException) {
            throw error;
          }
          
          if (attempt < maxRetries) {
            logger.warn(
              `Operation ${operationName} failed on attempt ${attempt}, retrying in ${delayMs}ms`,
              target.constructor.name,
              {
                operation: operationName,
                metadata: {
                  attempt,
                  maxRetries,
                  error: (error as Error).message,
                }
              }
            );
            
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
      
      if (lastError) {
        logger.error(
          `Operation ${operationName} failed after ${maxRetries} attempts`,
          lastError.stack,
          target.constructor.name,
          {
            operation: operationName,
            metadata: {
              maxRetries,
              finalError: lastError.message,
            }
          }
        );
        
        throw lastError;
      }
    };

    return descriptor;
  };
}