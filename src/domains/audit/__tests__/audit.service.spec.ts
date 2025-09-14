import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../services/audit.service';
import { IAuditLogRepository } from '../repositories/audit-log.repository.interface';
import { ILoginAttemptRepository } from '../repositories/login-attempt.repository.interface';
import { ITransactionHistoryRepository } from '../repositories/transaction-history.repository.interface';
import { LoggerService } from '../../../infrastructure/logging/logger.service';
import { AuditAction, ActorType, TransactionType } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let auditLogRepository: jest.Mocked<IAuditLogRepository>;
  let loginAttemptRepository: jest.Mocked<ILoginAttemptRepository>;
  let transactionHistoryRepository: jest.Mocked<ITransactionHistoryRepository>;
  let logger: any;

  beforeEach(async () => {
    const mockAuditLogRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findByEntity: jest.fn(),
      findByActor: jest.fn(),
      findWithFilters: jest.fn(),
      findByTraceId: jest.fn(),
      findSensitiveActions: jest.fn(),
      getStatistics: jest.fn(),
    };

    const mockLoginAttemptRepository = {
      create: jest.fn(),
      findByEmailOrUsername: jest.fn(),
      findRecentFailedAttempts: jest.fn(),
      findByIpAddress: jest.fn(),
      findWithFilters: jest.fn(),
      getStatistics: jest.fn(),
      checkSuspiciousActivity: jest.fn(),
      getFailedAttemptsCount: jest.fn(),
    };

    const mockTransactionHistoryRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findByMemberId: jest.fn(),
      findByTransactionType: jest.fn(),
      findWithFilters: jest.fn(),
      findByEntity: jest.fn(),
      getMemberTransactionSummary: jest.fn(),
      getStatistics: jest.fn(),
      findLargeTransactions: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logAuthenticationAttempt: jest.fn(),
      logPointTransaction: jest.fn(),
      logPrivilegeExchange: jest.fn(),
      logDatabaseQuery: jest.fn(),
      logSlowQuery: jest.fn(),
      logApiPerformance: jest.fn(),
      logSystemStartup: jest.fn(),
      logBackgroundJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: 'IAuditLogRepository',
          useValue: mockAuditLogRepository,
        },
        {
          provide: 'ILoginAttemptRepository',
          useValue: mockLoginAttemptRepository,
        },
        {
          provide: 'ITransactionHistoryRepository',
          useValue: mockTransactionHistoryRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditLogRepository = module.get('IAuditLogRepository');
    loginAttemptRepository = module.get('ILoginAttemptRepository');
    transactionHistoryRepository = module.get('ITransactionHistoryRepository');
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logEntityCreation', () => {
    it('should log entity creation successfully', async () => {
      const mockAuditLog = {
        id: 'audit-1',
        entityType: 'Member',
        entityId: 'member-1',
        action: AuditAction.CREATE,
        actorType: ActorType.MEMBER,
        actorId: 'member-1',
        newValues: { email: 'test@example.com' },
        createdAt: new Date(),
      };

      auditLogRepository.create.mockResolvedValue(mockAuditLog as any);

      await service.logEntityCreation(
        {
          entityType: 'Member',
          entityId: 'member-1',
          newValues: { email: 'test@example.com' },
        },
        {
          actorType: ActorType.MEMBER,
          actorId: 'member-1',
        },
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        entityType: 'Member',
        entityId: 'member-1',
        action: AuditAction.CREATE,
        actorType: ActorType.MEMBER,
        actorId: 'member-1',
        newValues: { email: 'test@example.com' },
        metadata: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        traceId: expect.any(String),
      });

      expect(logger.log).toHaveBeenCalledWith(
        'Entity created: Member:member-1',
        'AuditService',
        expect.any(Object),
      );
    });

    it('should handle errors gracefully', async () => {
      auditLogRepository.create.mockRejectedValue(new Error('Database error'));

      await service.logEntityCreation(
        {
          entityType: 'Member',
          entityId: 'member-1',
          newValues: { email: 'test@example.com' },
        },
        {
          actorType: ActorType.MEMBER,
          actorId: 'member-1',
        },
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to log entity creation: Database error',
        undefined,
        'AuditService',
        expect.any(Object),
      );
    });
  });

  describe('logPointTransaction', () => {
    it('should log point transaction with audit log and transaction history', async () => {
      const mockAuditLog = {
        id: 'audit-1',
        entityType: 'Point',
        entityId: 'point-1',
        action: AuditAction.POINT_ADD,
        actorType: ActorType.SYSTEM,
        createdAt: new Date(),
      };

      const mockTransactionHistory = {
        id: 'transaction-1',
        memberId: 'member-1',
        transactionType: TransactionType.POINT_EARNED,
        entityType: 'Point',
        entityId: 'point-1',
        amount: 100,
        description: 'Points earned',
        createdAt: new Date(),
      };

      auditLogRepository.create.mockResolvedValue(mockAuditLog as any);
      transactionHistoryRepository.create.mockResolvedValue(mockTransactionHistory as any);

      await service.logPointTransaction(
        {
          memberId: 'member-1',
          pointId: 'point-1',
          amount: 100,
          description: 'Points earned',
          balanceBefore: 0,
          balanceAfter: 100,
        },
        TransactionType.POINT_EARNED,
        {
          actorType: ActorType.SYSTEM,
        },
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        entityType: 'Point',
        entityId: 'point-1',
        action: AuditAction.POINT_ADD,
        actorType: ActorType.SYSTEM,
        actorId: undefined,
        metadata: {
          memberId: 'member-1',
          amount: 100,
          description: 'Points earned',
          balanceBefore: 0,
          balanceAfter: 100,
        },
        ipAddress: undefined,
        userAgent: undefined,
        traceId: expect.any(String),
      });

      expect(transactionHistoryRepository.create).toHaveBeenCalledWith({
        memberId: 'member-1',
        transactionType: TransactionType.POINT_EARNED,
        entityType: 'Point',
        entityId: 'point-1',
        amount: 100,
        description: 'Points earned',
        metadata: undefined,
        balanceBefore: 0,
        balanceAfter: 100,
        traceId: expect.any(String),
      });
    });
  });

  describe('logLoginAttempt', () => {
    it('should log successful login attempt', async () => {
      const mockLoginAttempt = {
        id: 'login-1',
        emailOrUsername: 'test@example.com',
        actorType: ActorType.MEMBER,
        success: true,
        createdAt: new Date(),
      };

      loginAttemptRepository.create.mockResolvedValue(mockLoginAttempt as any);

      await service.logLoginAttempt({
        emailOrUsername: 'test@example.com',
        actorType: ActorType.MEMBER,
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });

      expect(loginAttemptRepository.create).toHaveBeenCalledWith({
        emailOrUsername: 'test@example.com',
        actorType: ActorType.MEMBER,
        success: true,
        failureReason: undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        traceId: expect.any(String),
      });

      expect(logger.log).toHaveBeenCalledWith(
        'Login attempt logged: successful for test@example.com',
        'AuditService',
        expect.any(Object),
      );
    });

    it('should log failed login attempt with reason', async () => {
      const mockLoginAttempt = {
        id: 'login-1',
        emailOrUsername: 'test@example.com',
        actorType: ActorType.MEMBER,
        success: false,
        failureReason: 'invalid_credentials',
        createdAt: new Date(),
      };

      loginAttemptRepository.create.mockResolvedValue(mockLoginAttempt as any);

      await service.logLoginAttempt({
        emailOrUsername: 'test@example.com',
        actorType: ActorType.MEMBER,
        success: false,
        failureReason: 'invalid_credentials',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });

      expect(loginAttemptRepository.create).toHaveBeenCalledWith({
        emailOrUsername: 'test@example.com',
        actorType: ActorType.MEMBER,
        success: false,
        failureReason: 'invalid_credentials',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        traceId: expect.any(String),
      });
    });
  });

  describe('checkSuspiciousLoginActivity', () => {
    it('should detect suspicious activity based on failed attempts', async () => {
      loginAttemptRepository.getFailedAttemptsCount.mockResolvedValue(6);
      loginAttemptRepository.checkSuspiciousActivity.mockResolvedValue({
        isSuspicious: false,
        failedAttempts: 2,
        uniqueAccounts: 1,
        lastAttempt: new Date(),
      });

      const result = await service.checkSuspiciousLoginActivity(
        'test@example.com',
        '127.0.0.1',
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain('6 failed attempts in last 15 minutes');
      expect(result.recommendedAction).toBe('REQUIRE_ADDITIONAL_VERIFICATION');
    });

    it('should recommend blocking account for excessive failed attempts', async () => {
      loginAttemptRepository.getFailedAttemptsCount.mockResolvedValue(12);
      loginAttemptRepository.checkSuspiciousActivity.mockResolvedValue({
        isSuspicious: false,
        failedAttempts: 2,
        uniqueAccounts: 1,
        lastAttempt: new Date(),
      });

      const result = await service.checkSuspiciousLoginActivity(
        'test@example.com',
        '127.0.0.1',
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.recommendedAction).toBe('BLOCK_ACCOUNT');
    });

    it('should detect suspicious IP activity', async () => {
      loginAttemptRepository.getFailedAttemptsCount.mockResolvedValue(2);
      loginAttemptRepository.checkSuspiciousActivity.mockResolvedValue({
        isSuspicious: true,
        failedAttempts: 15,
        uniqueAccounts: 8,
        lastAttempt: new Date(),
      });

      const result = await service.checkSuspiciousLoginActivity(
        'test@example.com',
        '127.0.0.1',
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain(
        'Suspicious IP activity: 15 failed attempts, 8 unique accounts',
      );
    });

    it('should handle errors gracefully', async () => {
      loginAttemptRepository.getFailedAttemptsCount.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.checkSuspiciousLoginActivity(
        'test@example.com',
        '127.0.0.1',
      );

      expect(result.isSuspicious).toBe(false);
      expect(result.reasons).toContain('Error checking suspicious activity');
      expect(result.recommendedAction).toBe('ALLOW');
    });
  });
});