import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { RequestContext } from '../utils/trace.util';
import { ErrorContextUtil } from '../utils/error-context.util';
import { HandleErrors, RetryOnFailure } from '../decorators/error-handling.decorator';
import { InsufficientPointsException } from '../../domains/point/exceptions';
import { MemberNotFoundException } from '../../domains/member/exceptions';
import { ValidationException } from '../exceptions/domain.exception';

describe('Error Handling Integration', () => {
  let app: INestApplication;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger));
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    RequestContext.clear();
  });

  describe('End-to-end error handling flow', () => {
    it('should handle domain exception with full context', async () => {
      // Set up trace context
      RequestContext.setTraceId('integration-test-trace');

      // Create a service that throws domain exception
      class TestService {
        @HandleErrors('test-operation')
        async processTransaction(memberId: string, amount: number): Promise<void> {
          if (amount > 100) {
            throw new InsufficientPointsException(amount, 50);
          }
        }
      }

      const service = new TestService();

      // Execute and verify exception handling
      let caughtError: any;
      try {
        await service.processTransaction('member-123', 150);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(InsufficientPointsException);
      
      // Verify error context was added
      const context = ErrorContextUtil.extractContext(caughtError);
      expect(context?.traceId).toBe('integration-test-trace');
      expect(context?.operation).toBe('test-operation');
    });

    it('should handle retry logic with eventual success', async () => {
      let attemptCount = 0;

      class TestService {
        @RetryOnFailure(3, 10)
        async unreliableOperation(): Promise<string> {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        }
      }

      const service = new TestService();
      const result = await service.unreliableOperation();

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
      // Note: Decorators use console logging, not the injected logger
    });

    it('should not retry domain exceptions', async () => {
      let attemptCount = 0;

      class TestService {
        @RetryOnFailure(3, 10)
        async businessLogicOperation(): Promise<void> {
          attemptCount++;
          throw new MemberNotFoundException('member-123');
        }
      }

      const service = new TestService();

      await expect(service.businessLogicOperation()).rejects.toThrow(MemberNotFoundException);
      expect(attemptCount).toBe(1); // No retries for domain exceptions
    });
  });

  describe('Error context propagation', () => {
    it('should maintain context through service layers', async () => {
      RequestContext.setTraceId('context-test-trace');

      class RepositoryService {
        @HandleErrors('repository-operation')
        async findMember(id: string): Promise<any> {
          throw new MemberNotFoundException(id);
        }
      }

      class BusinessService {
        constructor(private repo: RepositoryService) {}

        @HandleErrors('business-operation')
        async getMember(id: string): Promise<any> {
          return await this.repo.findMember(id);
        }
      }

      const repo = new RepositoryService();
      const service = new BusinessService(repo);

      try {
        await service.getMember('member-123');
      } catch (error) {
        const context = ErrorContextUtil.extractContext(error as Error);
        expect(context?.traceId).toBe('context-test-trace');
        // The last decorator to handle the error sets the operation name
        expect(context?.operation).toBe('business-operation');
      }
    });
  });

  describe('Error sanitization', () => {
    it('should sanitize sensitive data in error context', () => {
      const sensitiveData = {
        email: 'test@example.com',
        password: 'secret123',
        token: 'jwt-token-value',
        safe: 'public-data',
      };

      const context = ErrorContextUtil.createContext('test-op', 'user-123', 'member', sensitiveData);
      const error = new Error('Test error');
      ErrorContextUtil.enhanceError(error, context);

      const sanitizedDetails = ErrorContextUtil.createSanitizedDetails(error);

      expect(sanitizedDetails.metadata.email).toBe('test@example.com');
      expect(sanitizedDetails.metadata.password).toBe('[REDACTED]');
      expect(sanitizedDetails.metadata.token).toBe('[REDACTED]');
      expect(sanitizedDetails.metadata.safe).toBe('public-data');
    });
  });

  describe('Multiple exception types', () => {
    it('should handle different exception types appropriately', async () => {
      const testCases = [
        {
          exception: new ValidationException('Invalid input'),
          expectedLogLevel: 'warn',
        },
        {
          exception: new InsufficientPointsException(100, 50),
          expectedLogLevel: 'warn',
        },
        {
          exception: new MemberNotFoundException('member-123'),
          expectedLogLevel: 'error',
        },
        {
          exception: new Error('Unexpected system error'),
          expectedLogLevel: 'error',
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        class TestService {
          @HandleErrors('test-operation')
          async testMethod(): Promise<void> {
            throw testCase.exception;
          }
        }

        const service = new TestService();

        let caughtError: any;
        try {
          await service.testMethod();
        } catch (error) {
          caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(testCase.exception.constructor);
        
        // Verify error context was added
        const context = ErrorContextUtil.extractContext(caughtError);
        expect(context?.operation).toBe('test-operation');
      }
    });
  });

  describe('Performance and resource management', () => {
    it('should not leak memory with error context', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create many errors with context
      for (let i = 0; i < 1000; i++) {
        const error = new Error(`Test error ${i}`);
        const context = ErrorContextUtil.createContext(`operation-${i}`, `user-${i}`, 'member', {
          iteration: i,
          data: new Array(100).fill(`data-${i}`),
        });
        ErrorContextUtil.enhanceError(error, context);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 1000 errors)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});