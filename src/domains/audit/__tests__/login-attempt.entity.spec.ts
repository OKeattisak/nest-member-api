import { LoginAttempt } from '../entities/login-attempt.entity';
import { ActorType } from '@prisma/client';

describe('LoginAttempt Entity', () => {
  const mockLoginAttemptData = {
    id: 'login-1',
    emailOrUsername: 'test@example.com',
    actorType: ActorType.MEMBER,
    success: true,
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    traceId: 'trace-123',
    createdAt: new Date(),
  };

  it('should create a login attempt instance', () => {
    const loginAttempt = new LoginAttempt(mockLoginAttemptData);

    expect(loginAttempt.id).toBe(mockLoginAttemptData.id);
    expect(loginAttempt.emailOrUsername).toBe(mockLoginAttemptData.emailOrUsername);
    expect(loginAttempt.actorType).toBe(mockLoginAttemptData.actorType);
    expect(loginAttempt.success).toBe(mockLoginAttemptData.success);
    expect(loginAttempt.ipAddress).toBe(mockLoginAttemptData.ipAddress);
    expect(loginAttempt.userAgent).toBe(mockLoginAttemptData.userAgent);
    expect(loginAttempt.traceId).toBe(mockLoginAttemptData.traceId);
    expect(loginAttempt.createdAt).toBe(mockLoginAttemptData.createdAt);
  });

  describe('isFailedAttempt', () => {
    it('should return true for failed attempts', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        success: false,
      });
      expect(loginAttempt.isFailedAttempt()).toBe(true);
    });

    it('should return false for successful attempts', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        success: true,
      });
      expect(loginAttempt.isFailedAttempt()).toBe(false);
    });
  });

  describe('isSuspicious', () => {
    it('should return true for suspicious failed attempts', () => {
      const suspiciousReasons = [
        'multiple_failed_attempts',
        'account_locked',
        'suspicious_ip',
      ];

      suspiciousReasons.forEach(reason => {
        const loginAttempt = new LoginAttempt({
          ...mockLoginAttemptData,
          success: false,
          failureReason: reason,
        });
        expect(loginAttempt.isSuspicious()).toBe(true);
      });
    });

    it('should return false for non-suspicious failed attempts', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        success: false,
        failureReason: 'invalid_credentials',
      });
      expect(loginAttempt.isSuspicious()).toBe(false);
    });

    it('should return false for successful attempts', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        success: true,
        failureReason: undefined,
      });
      expect(loginAttempt.isSuspicious()).toBe(false);
    });

    it('should return false when no failure reason is provided', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        success: false,
        failureReason: undefined,
      });
      expect(loginAttempt.isSuspicious()).toBe(false);
    });
  });

  describe('getDescription', () => {
    it('should return correct description for successful member login', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        actorType: ActorType.MEMBER,
        success: true,
      });
      expect(loginAttempt.getDescription()).toBe(
        'member login attempt successful for test@example.com'
      );
    });

    it('should return correct description for failed admin login', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        actorType: ActorType.ADMIN,
        success: false,
        failureReason: 'invalid_credentials',
      });
      expect(loginAttempt.getDescription()).toBe(
        'admin login attempt failed for test@example.com (invalid_credentials)'
      );
    });

    it('should return correct description for failed login without reason', () => {
      const loginAttempt = new LoginAttempt({
        ...mockLoginAttemptData,
        success: false,
        failureReason: undefined,
      });
      expect(loginAttempt.getDescription()).toBe(
        'member login attempt failed for test@example.com'
      );
    });
  });
});