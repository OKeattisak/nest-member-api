import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { SecurityService } from './security.service';
import { SecurityAuditService } from './security-audit.service';
import { LoggerService } from '../logging/logger.service';
import { AppConfigType } from '../config/app.config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly helmetMiddleware: any;

  constructor(
    private readonly securityService: SecurityService,
    private readonly securityAuditService: SecurityAuditService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    // Initialize helmet with security configuration
    this.helmetMiddleware = helmet(this.securityService.getHelmetConfig());
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const appConfig = this.configService.get<AppConfigType>('app')!;

    // Get client information early
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    // Apply helmet security headers
    this.helmetMiddleware(req, res, (err: any) => {
      if (err) {
        this.logger.error('Helmet middleware error', 'SecurityMiddleware', err.message);
        return next(err);
      }

      // Validate request size
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      const maxBodySize = this.parseSize(appConfig.bodyLimit);
      
      if (contentLength > maxBodySize) {
        this.securityAuditService.logPayloadTooLarge(
          clientIp,
          req.url,
          contentLength,
          maxBodySize,
          userAgent,
        );
        
        return res.status(413).json({
          success: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Request payload too large',
          },
          meta: {
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown',
          },
        });
      }

      // Validate URL length
      const maxUrlSize = this.parseSize(appConfig.urlLimit);
      if (req.url.length > maxUrlSize) {
        this.logger.warn('URL length exceeds limit', 'SecurityMiddleware', {
          operation: 'url_length_validation',
        });
        
        return res.status(414).json({
          success: false,
          error: {
            code: 'URI_TOO_LONG',
            message: 'Request URI too long',
          },
          meta: {
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown',
          },
        });
      }

      // Validate IP address
      if (clientIp !== 'unknown' && !this.securityService.isValidIpAddress(clientIp)) {
        this.logger.warn('Invalid IP address detected', 'SecurityMiddleware', {
          operation: 'invalid_ip_detection',
          metadata: { ip: clientIp },
        });
      }

      // Validate User-Agent
      if (!this.securityService.isValidUserAgent(userAgent)) {
        this.securityAuditService.logSuspiciousUserAgent(userAgent, clientIp, req.url);
      }

      // Check for malicious patterns in URL and query parameters
      const fullUrl = req.url + JSON.stringify(req.query);
      if (this.securityService.containsMaliciousPatterns(fullUrl)) {
        this.securityAuditService.logMaliciousRequest(
          clientIp,
          req.url,
          'URL/Query parameters',
          userAgent,
        );
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'MALICIOUS_REQUEST',
            message: 'Request contains potentially malicious content',
          },
          meta: {
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown',
          },
        });
      }

      // Check for suspicious headers
      const suspiciousHeaders = [
        'x-forwarded-for',
        'x-real-ip',
        'x-cluster-client-ip',
        'x-forwarded',
        'forwarded-for',
        'forwarded',
      ];

      for (const header of suspiciousHeaders) {
        const headerValue = req.headers[header];
        if (headerValue && typeof headerValue === 'string') {
          if (this.securityService.containsMaliciousPatterns(headerValue)) {
            this.securityAuditService.logMaliciousRequest(
              clientIp,
              req.url,
              `Header: ${header}`,
              userAgent,
            );
            
            return res.status(400).json({
              success: false,
              error: {
                code: 'MALICIOUS_REQUEST',
                message: 'Request contains potentially malicious content',
              },
              meta: {
                timestamp: new Date().toISOString(),
                traceId: req.headers['x-trace-id'] || 'unknown',
              },
            });
          }
        }
      }

      // Sanitize request body if present
      if (req.body && typeof req.body === 'object') {
        try {
          req.body = this.securityService.sanitizeObject(req.body);
        } catch (error) {
          this.logger.error('Error sanitizing request body', 'SecurityMiddleware', error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Add security-related headers
      res.setHeader('X-Request-ID', req.headers['x-trace-id'] || 'unknown');
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      
      // Remove server information
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');

      // Log security middleware execution
      const duration = Date.now() - startTime;
      this.logger.debug('Security middleware executed', 'SecurityMiddleware', {
        operation: 'security_middleware_execution',
        duration,
      });

      next();
    });
  }

  /**
   * Parse size string (e.g., "10mb", "1gb") to bytes
   */
  private parseSize(size: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
    if (!match) {
      return parseInt(size, 10) || 0;
    }

    const value = parseFloat(match[1] || '0');
    const unit = match[2] || 'b';
    
    return Math.floor(value * (units[unit] || 1));
  }
}