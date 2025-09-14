import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppConfigType } from '../config/app.config';

@Injectable()
export class SecurityService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get helmet configuration for security headers
   */
  getHelmetConfig(): any {
    const appConfig = this.configService.get<AppConfigType>('app')!;
    const isDevelopment = appConfig.nodeEnv === 'development';

    if (!appConfig.securityHeadersEnabled) {
      return {
        hidePoweredBy: true,
      };
    }

    return {
      // Content Security Policy
      contentSecurityPolicy: appConfig.cspEnabled ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: isDevelopment 
            ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'] 
            : ["'self'", 'https://cdnjs.cloudflare.com'],
          connectSrc: ["'self'", 'https://api.github.com'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          childSrc: ["'none'"],
          workerSrc: ["'self'"],
          manifestSrc: ["'self'"],
          prefetchSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          ...(isDevelopment ? {} : { upgradeInsecureRequests: [] }),
        },
        reportOnly: isDevelopment,
      } : false,
      
      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
      
      // Cross-Origin Opener Policy
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      
      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      
      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },
      
      // Expect Certificate Transparency
      expectCt: {
        maxAge: 86400,
        enforce: !isDevelopment,
        reportUri: isDevelopment ? undefined : '/api/security/ct-report',
      },
      
      // Frame Options
      frameguard: { action: 'deny' },
      
      // Hide Powered-By header
      hidePoweredBy: true,
      
      // HTTP Strict Transport Security
      hsts: appConfig.hstsEnabled ? {
        maxAge: appConfig.hstsMaxAge,
        includeSubDomains: true,
        preload: true,
      } : false,
      
      // IE No Open
      ieNoOpen: true,
      
      // No Sniff
      noSniff: true,
      
      // Origin Agent Cluster
      originAgentCluster: true,
      
      // Permitted Cross-Domain Policies
      permittedCrossDomainPolicies: false,
      
      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      
      // X-Content-Type-Options
      xssFilter: true,
    };
  }

  /**
   * Sanitize input string to prevent XSS attacks
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .trim();
  }

  /**
   * Validate and sanitize object properties
   */
  sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeInput(item) : 
          typeof item === 'object' && item !== null ? this.sanitizeObject(item) : 
          item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if request contains potentially malicious patterns
   */
  containsMaliciousPatterns(input: string): boolean {
    const appConfig = this.configService.get<AppConfigType>('app')!;
    const isDevelopment = appConfig.nodeEnv === 'development';
    
    // In development, be less strict to avoid blocking legitimate API calls
    if (isDevelopment) {
      const developmentPatterns = [
        // Only check for obvious XSS attempts
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        
        // Protocol handlers (but allow data: for legitimate use)
        /javascript:/gi,
        /vbscript:/gi,
        
        // Obvious event handlers
        /onclick\s*=/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        
        // Clear SQL injection attempts
        /(\bUNION\s+SELECT\b)/gi,
        /(\bDROP\s+TABLE\b)/gi,
        /(\bDELETE\s+FROM\b)/gi,
      ];
      
      return developmentPatterns.some(pattern => pattern.test(input));
    }
    
    // Production patterns (more strict)
    const maliciousPatterns = [
      // XSS patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
      /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
      
      // Protocol handlers
      /javascript:/gi,
      /vbscript:/gi,
      /data:/gi,
      /file:/gi,
      
      // Event handlers
      /on\w+\s*=/gi,
      /onclick/gi,
      /onload/gi,
      /onerror/gi,
      /onmouseover/gi,
      
      // CSS expressions
      /expression\s*\(/gi,
      /url\s*\(/gi,
      /@import/gi,
      /binding\s*:/gi,
      /behavior\s*:/gi,
      
      // SQL injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;|'|"|\||&|\$)/g,
      
      // Path traversal
      /\.\.\//gi,
      /\.\.\\/gi,
      
      // Command injection
      /(\||&|;|\$\(|\`)/g,
      
      // LDAP injection
      /(\*|\(|\)|\\|\/)/g,
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate request size limits
   */
  validateRequestSize(contentLength: number, maxSize: number): boolean {
    return contentLength <= maxSize;
  }

  /**
   * Generate secure random string for CSRF tokens
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Validate IP address format
   */
  isValidIpAddress(ip: string): boolean {
    const appConfig = this.configService.get<AppConfigType>('app')!;
    const isDevelopment = appConfig.nodeEnv === 'development';
    
    // In development, allow localhost variations
    if (isDevelopment) {
      const localhostPatterns = [
        '127.0.0.1',
        '::1',
        'localhost',
        '0.0.0.0',
      ];
      
      if (localhostPatterns.includes(ip)) {
        return true;
      }
    }
    
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Check if IP address is in private range
   */
  isPrivateIpAddress(ip: string): boolean {
    if (!this.isValidIpAddress(ip)) {
      return false;
    }

    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Validate User-Agent header
   */
  isValidUserAgent(userAgent: string): boolean {
    const appConfig = this.configService.get<AppConfigType>('app')!;
    const isDevelopment = appConfig.nodeEnv === 'development';
    
    if (!userAgent || userAgent.length < 10 || userAgent.length > 512) {
      return false;
    }

    // In development, be more lenient with User-Agent validation
    if (isDevelopment) {
      // Only block obviously malicious patterns
      const maliciousPatterns = [
        /sqlmap/gi,
        /nikto/gi,
        /nessus/gi,
        /masscan/gi,
        /nmap/gi,
      ];
      
      return !maliciousPatterns.some(pattern => pattern.test(userAgent));
    }

    // Production patterns (more strict)
    const suspiciousPatterns = [
      /bot/gi,
      /crawler/gi,
      /spider/gi,
      /scraper/gi,
      /curl/gi,
      /wget/gi,
      /python/gi,
      /java/gi,
      /perl/gi,
      /php/gi,
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Rate limit key generator for different contexts
   */
  generateRateLimitKey(context: string, identifier: string): string {
    return `rate_limit:${context}:${identifier}`;
  }
}