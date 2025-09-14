import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityAuditService } from './security-audit.service';
import { SecurityConfigValidator } from './security-config.validator';
import { LoggerService } from '../logging/logger.service';

describe('Security Integration', () => {
  let securityService: SecurityService;
  let securityAuditService: SecurityAuditService;
  let securityConfigValidator: SecurityConfigValidator;

  const mockConfigService = {
    get: jest.fn().mockReturnValue({
      nodeEnv: 'test',
      corsEnabled: true,
      corsOrigins: ['http://localhost:3000'],
      rateLimitTtl: 60,
      rateLimitLimit: 100,
      authRateLimitTtl: 300,
      authRateLimitLimit: 5,
      requestTimeout: 30000,
      bodyLimit: '10mb',
      urlLimit: '1mb',
      securityHeadersEnabled: true,
      cspEnabled: true,
      hstsEnabled: true,
      hstsMaxAge: 31536000,
    }),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        SecurityAuditService,
        SecurityConfigValidator,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    securityService = module.get<SecurityService>(SecurityService);
    securityAuditService = module.get<SecurityAuditService>(SecurityAuditService);
    securityConfigValidator = module.get<SecurityConfigValidator>(SecurityConfigValidator);
  });

  it('should be defined', () => {
    expect(securityService).toBeDefined();
    expect(securityAuditService).toBeDefined();
    expect(securityConfigValidator).toBeDefined();
  });

  describe('Security Service', () => {
    it('should detect malicious patterns', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      expect(securityService.containsMaliciousPatterns(maliciousInput)).toBe(true);
    });

    it('should sanitize input', () => {
      const input = '<script>alert("xss")</script>';
      const result = securityService.sanitizeInput(input);
      expect(result).not.toContain('<script>');
    });

    it('should validate IP addresses', () => {
      expect(securityService.isValidIpAddress('192.168.1.1')).toBe(true);
      expect(securityService.isValidIpAddress('invalid-ip')).toBe(false);
    });

    it('should identify private IP addresses', () => {
      expect(securityService.isPrivateIpAddress('192.168.1.1')).toBe(true);
      expect(securityService.isPrivateIpAddress('8.8.8.8')).toBe(false);
    });

    it('should validate user agents', () => {
      const validUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const suspiciousUA = 'bot';
      
      expect(securityService.isValidUserAgent(validUA)).toBe(true);
      expect(securityService.isValidUserAgent(suspiciousUA)).toBe(false);
    });
  });

  describe('Security Audit Service', () => {
    it('should log security events', () => {
      securityAuditService.logRateLimitExceeded('192.168.1.1', '/api/auth/login');
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });

    it('should log malicious requests', () => {
      securityAuditService.logMaliciousRequest('192.168.1.1', '/api/test', 'XSS pattern');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should log authentication failures', () => {
      securityAuditService.logAuthenticationFailure('user@test.com', '192.168.1.1', 'invalid_credentials');
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });
  });

  describe('Security Config Validator', () => {
    it('should validate security configuration', () => {
      const result = securityConfigValidator.validateSecurityConfig();
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should detect insecure CORS configuration', () => {
      mockConfigService.get.mockReturnValueOnce({
        ...mockConfigService.get(),
        corsOrigins: ['*'],
      });

      const result = securityConfigValidator.validateSecurityConfig();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('wildcards'))).toBe(true);
    });
  });
});