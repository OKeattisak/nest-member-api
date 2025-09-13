import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { LoggingModule } from '../logging.module';
import { LoggerService } from '../logger.service';
import { ConfigModule } from '@nestjs/config';

describe('Logging Integration', () => {
  let app: INestApplication;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        LoggingModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create logger service', () => {
    expect(loggerService).toBeDefined();
  });

  it('should log messages without throwing errors', () => {
    expect(() => {
      loggerService.log('Test log message', 'TestContext');
      loggerService.warn('Test warning message', 'TestContext');
      loggerService.error('Test error message', 'Error stack', 'TestContext');
      loggerService.debug('Test debug message', 'TestContext');
    }).not.toThrow();
  });

  it('should log business events without throwing errors', () => {
    expect(() => {
      loggerService.logAuthenticationAttempt('test@example.com', true, '127.0.0.1');
      loggerService.logPointTransaction('member-123', 100, 'EARNED', 'Test points');
      loggerService.logPrivilegeExchange('member-123', 'privilege-456', 50);
      loggerService.logDatabaseQuery('SELECT * FROM members', 150);
      loggerService.logApiPerformance('GET', '/api/test', 200, 200);
      loggerService.logSystemStartup('TestComponent', 1000);
      loggerService.logBackgroundJob('test-job', 'completed', 500);
    }).not.toThrow();
  });
});