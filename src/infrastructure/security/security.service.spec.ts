import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue({
      nodeEnv: 'test',
      securityHeadersEnabled: true,
      cspEnabled: true,
      hstsEnabled: true,
      hstsMaxAge: 31536000,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      const input = '<script>alert("xss")</script>';
      const result = service.sanitizeInput(input);
      expect(result).toBe('scriptalert("xss")/script');
    });

    it('should remove javascript protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = service.sanitizeInput(input);
      expect(result).toBe(':alert("xss")');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = service.sanitizeInput(input);
      expect(result).toBe('alert("xss")');
    });

    it('should remove script tags', () => {
      const input = 'Hello script world';
      const result = service.sanitizeInput(input);
      expect(result).toBe('Hello  world');
    });

    it('should handle empty or non-string input', () => {
      expect(service.sanitizeInput('')).toBe('');
      expect(service.sanitizeInput(null as any)).toBe('');
      expect(service.sanitizeInput(undefined as any)).toBe('');
      expect(service.sanitizeInput(123 as any)).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = service.sanitizeInput(input);
      expect(result).toBe('hello world');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string properties', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
      };
      const result = service.sanitizeObject(input);
      expect(result.name).toBe('scriptalert("xss")/script');
      expect(result.email).toBe('test@example.com');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<script>alert("xss")</script>',
          profile: {
            bio: 'javascript:alert("xss")',
          },
        },
      };
      const result = service.sanitizeObject(input);
      expect(result.user.name).toBe('scriptalert("xss")/script');
      expect(result.user.profile.bio).toBe(':alert("xss")');
    });

    it('should sanitize arrays', () => {
      const input = {
        tags: ['<script>alert("xss")</script>', 'normal-tag'],
        nested: [
          { name: 'javascript:alert("xss")' },
          { name: 'normal-name' },
        ],
      };
      const result = service.sanitizeObject(input);
      expect(result.tags[0]).toBe('scriptalert("xss")/script');
      expect(result.tags[1]).toBe('normal-tag');
      expect(result.nested[0].name).toBe(':alert("xss")');
      expect(result.nested[1].name).toBe('normal-name');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'test',
        age: 25,
        active: true,
        data: null,
        items: [1, 2, 3],
      };
      const result = service.sanitizeObject(input);
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
      expect(result.items).toEqual([1, 2, 3]);
    });
  });

  describe('containsMaliciousPatterns', () => {
    it('should detect XSS patterns', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>',
        '<embed src="javascript:alert(1)">',
        'javascript:alert("xss")',
        'vbscript:alert("xss")',
        'onclick=alert("xss")',
        'onload=alert("xss")',
      ];

      maliciousInputs.forEach(input => {
        expect(service.containsMaliciousPatterns(input)).toBe(true);
      });
    });

    it('should detect SQL injection patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        'SELECT * FROM users',
        'UNION SELECT password FROM users',
        "admin'--",
        "admin' OR '1'='1",
      ];

      maliciousInputs.forEach(input => {
        expect(service.containsMaliciousPatterns(input)).toBe(true);
      });
    });

    it('should detect path traversal patterns', () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
      ];

      maliciousInputs.forEach(input => {
        expect(service.containsMaliciousPatterns(input)).toBe(true);
      });
    });

    it('should allow safe content', () => {
      const safeInputs = [
        'Hello world',
        'user@example.com',
        'This is a normal sentence.',
        'Product name with numbers 123',
        'https://example.com/path',
      ];

      safeInputs.forEach(input => {
        expect(service.containsMaliciousPatterns(input)).toBe(false);
      });
    });
  });

  describe('isValidIpAddress', () => {
    it('should validate IPv4 addresses', () => {
      const validIpv4 = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1',
        '8.8.8.8',
      ];

      validIpv4.forEach(ip => {
        expect(service.isValidIpAddress(ip)).toBe(true);
      });
    });

    it('should validate IPv6 addresses', () => {
      const validIpv6 = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '::1',
        'fe80::1',
      ];

      validIpv6.forEach(ip => {
        expect(service.isValidIpAddress(ip)).toBe(true);
      });
    });

    it('should reject invalid IP addresses', () => {
      const invalidIps = [
        '256.256.256.256',
        '192.168.1',
        'not-an-ip',
        '',
        '192.168.1.1.1',
      ];

      invalidIps.forEach(ip => {
        expect(service.isValidIpAddress(ip)).toBe(false);
      });
    });
  });

  describe('isPrivateIpAddress', () => {
    it('should identify private IPv4 addresses', () => {
      const privateIps = [
        '10.0.0.1',
        '172.16.0.1',
        '192.168.1.1',
        '127.0.0.1',
        '169.254.1.1',
      ];

      privateIps.forEach(ip => {
        expect(service.isPrivateIpAddress(ip)).toBe(true);
      });
    });

    it('should identify public IPv4 addresses', () => {
      const publicIps = [
        '8.8.8.8',
        '1.1.1.1',
        '208.67.222.222',
      ];

      publicIps.forEach(ip => {
        expect(service.isPrivateIpAddress(ip)).toBe(false);
      });
    });

    it('should handle invalid IP addresses', () => {
      expect(service.isPrivateIpAddress('invalid-ip')).toBe(false);
      expect(service.isPrivateIpAddress('')).toBe(false);
    });
  });

  describe('isValidUserAgent', () => {
    it('should validate normal user agents', () => {
      const validUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      ];

      validUserAgents.forEach(ua => {
        expect(service.isValidUserAgent(ua)).toBe(true);
      });
    });

    it('should reject suspicious user agents', () => {
      const suspiciousUserAgents = [
        'bot',
        'crawler',
        'spider',
        'scraper',
        'curl/7.68.0',
        'wget/1.20.3',
        'python-requests/2.25.1',
        'Java/1.8.0_281',
      ];

      suspiciousUserAgents.forEach(ua => {
        expect(service.isValidUserAgent(ua)).toBe(false);
      });
    });

    it('should reject invalid user agents', () => {
      expect(service.isValidUserAgent('')).toBe(false);
      expect(service.isValidUserAgent('short')).toBe(false);
      expect(service.isValidUserAgent('a'.repeat(600))).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = service.generateSecureToken(32);
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens', () => {
      const token1 = service.generateSecureToken();
      const token2 = service.generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should use default length', () => {
      const token = service.generateSecureToken();
      expect(token).toHaveLength(32);
    });
  });

  describe('generateRateLimitKey', () => {
    it('should generate consistent keys', () => {
      const key1 = service.generateRateLimitKey('auth', '192.168.1.1');
      const key2 = service.generateRateLimitKey('auth', '192.168.1.1');
      expect(key1).toBe(key2);
      expect(key1).toBe('rate_limit:auth:192.168.1.1');
    });

    it('should generate different keys for different contexts', () => {
      const key1 = service.generateRateLimitKey('auth', '192.168.1.1');
      const key2 = service.generateRateLimitKey('api', '192.168.1.1');
      expect(key1).not.toBe(key2);
    });
  });

  describe('getHelmetConfig', () => {
    it('should return helmet configuration', () => {
      const config = service.getHelmetConfig();
      expect(config).toBeDefined();
      expect(config.hidePoweredBy).toBe(true);
      expect(config.frameguard).toEqual({ action: 'deny' });
    });

    it('should disable CSP when configured', () => {
      mockConfigService.get.mockReturnValueOnce({
        nodeEnv: 'test',
        securityHeadersEnabled: true,
        cspEnabled: false,
        hstsEnabled: true,
        hstsMaxAge: 31536000,
      });

      const config = service.getHelmetConfig();
      expect(config.contentSecurityPolicy).toBe(false);
    });

    it('should disable HSTS when configured', () => {
      mockConfigService.get.mockReturnValueOnce({
        nodeEnv: 'test',
        securityHeadersEnabled: true,
        cspEnabled: true,
        hstsEnabled: false,
        hstsMaxAge: 31536000,
      });

      const config = service.getHelmetConfig();
      expect(config.hsts).toBe(false);
    });
  });
});