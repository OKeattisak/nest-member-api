import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceInterceptor } from '../performance.interceptor';
import { LoggerService } from '@/infrastructure/logging/logger.service';

describe('PerformanceInterceptor', () => {
  let interceptor: PerformanceInterceptor;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(async () => {
    mockLoggerService = {
      logApiPerformance: jest.fn(),
      warn: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceInterceptor,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    interceptor = module.get<PerformanceInterceptor>(PerformanceInterceptor);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          url: '/api/test',
        }),
        getResponse: jest.fn().mockReturnValue({
          statusCode: 200,
        }),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log API performance on successful request', (done) => {
    mockCallHandler.handle.mockReturnValue(of('test response'));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe('test response');
        expect(mockLoggerService.logApiPerformance).toHaveBeenCalledWith(
          'GET',
          '/api/test',
          expect.any(Number),
          200,
        );
        done();
      },
    });
  });

  it('should handle requests when performance logging is enabled', (done) => {
    mockCallHandler.handle.mockReturnValue(of('test response'));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe('test response');
        expect(mockLoggerService.logApiPerformance).toHaveBeenCalledWith(
          'GET',
          '/api/test',
          expect.any(Number),
          200,
        );
        done();
      },
    });
  });

  it('should log memory usage for slow requests', (done) => {
    // Create a delayed observable to simulate slow request
    const delayedObservable = of('slow response').pipe(
      tap(() => {
        // Simulate delay by mocking Date.now to return a time 2100ms later
        const originalDateNow = Date.now;
        Date.now = jest.fn().mockReturnValue(originalDateNow() + 2100);
      })
    );
    
    mockCallHandler.handle.mockReturnValue(delayedObservable);

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe('slow response');
        expect(mockLoggerService.logApiPerformance).toHaveBeenCalled();
        expect(mockLoggerService.warn).toHaveBeenCalledWith(
          'High memory usage detected',
          'PerformanceMonitor',
          expect.objectContaining({
            operation: 'memory_monitoring',
            duration: expect.any(Number),
            metadata: expect.objectContaining({
              method: 'GET',
              url: '/api/test',
              memoryUsage: expect.any(Object),
            }),
          }),
        );
        done();
      },
    });
  });
});