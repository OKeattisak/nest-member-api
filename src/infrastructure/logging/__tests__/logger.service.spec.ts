import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

describe('LoggerService', () => {
    let service: LoggerService;
    let mockWinstonLogger: jest.Mocked<Logger>;

    beforeEach(async () => {
        mockWinstonLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoggerService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockWinstonLogger,
                },
            ],
        }).compile();

        service = module.get<LoggerService>(LoggerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('log', () => {
        it('should log info message with context', () => {
            const message = 'Test message';
            const context = 'TestContext';
            const logContext = { operation: 'test', metadata: { key: 'value' } };

            service.log(message, context, logContext);

            expect(mockWinstonLogger.info).toHaveBeenCalledWith({
                message,
                context,
                traceId: expect.any(String),
                operation: 'test',
                metadata: { key: 'value' },
            });
        });
    });

    describe('error', () => {
        it('should log error message with stack trace', () => {
            const message = 'Error message';
            const stack = 'Error stack trace';
            const context = 'ErrorContext';

            service.error(message, stack, context);

            expect(mockWinstonLogger.error).toHaveBeenCalledWith({
                message,
                context,
                traceId: expect.any(String),
                stack,
            });
        });
    });

    describe('logAuthenticationAttempt', () => {
        it('should log authentication attempt', () => {
            const email = 'test@example.com';
            const success = true;
            const ip = '127.0.0.1';

            service.logAuthenticationAttempt(email, success, ip);

            expect(mockWinstonLogger.info).toHaveBeenCalledWith({
                message: 'Authentication attempt',
                context: 'AuthService',
                traceId: expect.any(String),
                operation: 'authentication',
                metadata: {
                    email,
                    success,
                    ip,
                },
            });
        });
    });

    describe('logPointTransaction', () => {
        it('should log point transaction', () => {
            const memberId = 'member-123';
            const amount = 100;
            const type = 'EARNED';
            const description = 'Points earned';

            service.logPointTransaction(memberId, amount, type, description);

            expect(mockWinstonLogger.info).toHaveBeenCalledWith({
                message: 'Point transaction',
                context: 'PointService',
                traceId: expect.any(String),
                operation: 'point_transaction',
                userId: memberId,
                metadata: {
                    amount,
                    type,
                    description,
                },
            });
        });
    });

    describe('logDatabaseQuery', () => {
        it('should log database query', () => {
            const query = 'SELECT * FROM members WHERE id = ?';
            const duration = 150;
            const params = ['member-123'];

            service.logDatabaseQuery(query, duration, params);

            expect(mockWinstonLogger.debug).toHaveBeenCalledWith({
                message: 'Database query executed',
                context: 'DatabaseService',
                traceId: expect.any(String),
                operation: 'database_query',
                duration,
                metadata: {
                    query,
                    params: '1 parameters',
                },
            });
        });
    });

    describe('logSlowQuery', () => {
        it('should log slow query warning', () => {
            const query = 'SELECT * FROM members';
            const duration = 2000;
            const threshold = 1000;

            service.logSlowQuery(query, duration, threshold);

            expect(mockWinstonLogger.warn).toHaveBeenCalledWith({
                message: 'Slow database query detected',
                context: 'DatabaseService',
                traceId: expect.any(String),
                operation: 'slow_query',
                duration,
                metadata: {
                    query,
                    threshold,
                    performance_issue: true,
                },
            });
        });
    });

    describe('logApiPerformance', () => {
        it('should log API performance', () => {
            const method = 'GET';
            const url = '/api/members';
            const duration = 500;
            const statusCode = 200;

            service.logApiPerformance(method, url, duration, statusCode);

            expect(mockWinstonLogger.debug).toHaveBeenCalledWith({
                message: 'API endpoint performance',
                context: 'ApiPerformance',
                traceId: expect.any(String),
                operation: 'api_performance',
                duration,
                metadata: {
                    method,
                    url,
                    statusCode,
                    performance_issue: false,
                },
            });
        });

        it('should log slow API performance as warning', () => {
            const method = 'POST';
            const url = '/api/members';
            const duration = 3000;
            const statusCode = 201;

            service.logApiPerformance(method, url, duration, statusCode);

            expect(mockWinstonLogger.warn).toHaveBeenCalledWith({
                message: 'Slow API endpoint detected',
                context: 'ApiPerformance',
                traceId: expect.any(String),
                operation: 'api_performance',
                duration,
                metadata: {
                    method,
                    url,
                    statusCode,
                    performance_issue: true,
                },
            });
        });
    });

    describe('logBackgroundJob', () => {
        it('should log background job completion', () => {
            const jobName = 'point-expiration';
            const status = 'completed';
            const duration = 1500;

            service.logBackgroundJob(jobName, status, duration);

            expect(mockWinstonLogger.info).toHaveBeenCalledWith({
                message: 'Background job completed: point-expiration',
                context: 'BackgroundJob',
                traceId: expect.any(String),
                operation: 'background_job',
                duration,
                metadata: {
                    jobName,
                    status,
                    error: undefined,
                },
            });
        });

        it('should log background job failure as error', () => {
            const jobName = 'point-expiration';
            const status = 'failed';
            const duration = 500;
            const error = 'Database connection failed';

            service.logBackgroundJob(jobName, status, duration, error);

            expect(mockWinstonLogger.error).toHaveBeenCalledWith({
                message: 'Background job failed: point-expiration',
                context: 'BackgroundJob',
                traceId: expect.any(String),
                operation: 'background_job',
                duration,
                metadata: {
                    jobName,
                    status,
                    error,
                },
            });
        });
    });
});