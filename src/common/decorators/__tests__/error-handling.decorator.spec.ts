import { HandleErrors, RetryOnFailure } from '../error-handling.decorator';
import { DomainException } from '@/common/exceptions/domain.exception';

// Mock LoggerService
jest.mock('@/infrastructure/logging/logger.service', () => ({
  LoggerService: jest.fn().mockImplementation(() => ({
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  })),
}));

class TestDomainException extends DomainException {
  readonly code = 'TEST_DOMAIN_ERROR';
  
  constructor(message: string) {
    super(message);
  }
}

describe('Error Handling Decorators', () => {
  describe('HandleErrors', () => {
    it('should handle successful method execution', async () => {
      class TestService {
        @HandleErrors('test-operation')
        async testMethod(value: string): Promise<string> {
          return `processed: ${value}`;
        }
      }

      const service = new TestService();
      const result = await service.testMethod('test');
      
      expect(result).toBe('processed: test');
    });

    it('should enhance and re-throw domain exceptions', async () => {
      class TestService {
        @HandleErrors('test-operation')
        async testMethod(): Promise<void> {
          throw new TestDomainException('Test domain error');
        }
      }

      const service = new TestService();
      
      await expect(service.testMethod()).rejects.toThrow(TestDomainException);
      
      try {
        await service.testMethod();
      } catch (error) {
        expect((error as any).context).toBeDefined();
        expect((error as any).context.operation).toBe('test-operation');
      }
    });

    it('should enhance and re-throw generic errors', async () => {
      class TestService {
        @HandleErrors('test-operation')
        async testMethod(): Promise<void> {
          throw new Error('Generic error');
        }
      }

      const service = new TestService();
      
      await expect(service.testMethod()).rejects.toThrow('Generic error');
      
      try {
        await service.testMethod();
      } catch (error) {
        expect((error as any).context).toBeDefined();
        expect((error as any).context.operation).toBe('test-operation');
      }
    });

    it('should use default operation name when not provided', async () => {
      class TestService {
        @HandleErrors()
        async testMethod(): Promise<void> {
          throw new Error('Test error');
        }
      }

      const service = new TestService();
      
      try {
        await service.testMethod();
      } catch (error) {
        expect((error as any).context.operation).toBe('TestService.testMethod');
      }
    });
  });

  describe('RetryOnFailure', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should succeed on first attempt', async () => {
      class TestService {
        @RetryOnFailure(3, 100)
        async testMethod(value: string): Promise<string> {
          return `success: ${value}`;
        }
      }

      const service = new TestService();
      const result = await service.testMethod('test');
      
      expect(result).toBe('success: test');
    });

    it('should retry on generic errors and eventually succeed', async () => {
      let attemptCount = 0;
      
      class TestService {
        @RetryOnFailure(3, 10)
        async testMethod(): Promise<string> {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary error');
          }
          return 'success';
        }
      }

      const service = new TestService();
      const result = await service.testMethod();
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should not retry domain exceptions', async () => {
      let attemptCount = 0;
      
      class TestService {
        @RetryOnFailure(3, 10)
        async testMethod(): Promise<string> {
          attemptCount++;
          throw new TestDomainException('Domain error');
        }
      }

      const service = new TestService();
      
      await expect(service.testMethod()).rejects.toThrow(TestDomainException);
      expect(attemptCount).toBe(1);
    });

    it('should fail after max retries', async () => {
      let attemptCount = 0;
      
      class TestService {
        @RetryOnFailure(2, 10)
        async testMethod(): Promise<string> {
          attemptCount++;
          throw new Error('Persistent error');
        }
      }

      const service = new TestService();
      
      await expect(service.testMethod()).rejects.toThrow('Persistent error');
      expect(attemptCount).toBe(2);
    });

    it('should use custom retry parameters', async () => {
      let attemptCount = 0;
      const startTime = Date.now();
      
      class TestService {
        @RetryOnFailure(2, 50)
        async testMethod(): Promise<string> {
          attemptCount++;
          throw new Error('Error');
        }
      }

      const service = new TestService();
      
      await expect(service.testMethod()).rejects.toThrow('Error');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(attemptCount).toBe(2);
      expect(duration).toBeGreaterThanOrEqual(50); // At least one retry delay
    });
  });
});