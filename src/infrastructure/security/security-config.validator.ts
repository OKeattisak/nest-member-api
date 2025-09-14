import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigType } from '../config/app.config';

export interface SecurityValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

@Injectable()
export class SecurityConfigValidator {
  private readonly logger = new Logger(SecurityConfigValidator.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate security configuration and provide recommendations
   */
  validateSecurityConfig(): SecurityValidationResult {
    const appConfig = this.configService.get<AppConfigType>('app')!;
    const result: SecurityValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      recommendations: [],
    };

    // Validate CORS configuration
    this.validateCorsConfig(appConfig, result);

    // Validate rate limiting configuration
    this.validateRateLimitConfig(appConfig, result);

    // Validate security headers configuration
    this.validateSecurityHeadersConfig(appConfig, result);

    // Validate request limits
    this.validateRequestLimits(appConfig, result);

    // Environment-specific validations
    this.validateEnvironmentSpecificConfig(appConfig, result);

    // Log validation results
    this.logValidationResults(result);

    return result;
  }

  private validateCorsConfig(appConfig: AppConfigType, result: SecurityValidationResult): void {
    if (!appConfig.corsEnabled) {
      result.warnings.push('CORS is disabled - ensure this is intentional for your deployment');
    } else {
      // Check for overly permissive CORS origins
      const hasWildcard = appConfig.corsOrigins.some(origin => 
        origin === '*' || origin.includes('*')
      );
      
      if (hasWildcard) {
        result.errors.push('CORS origins contain wildcards - this is a security risk');
        result.isValid = false;
      }

      // Check for localhost in production
      if (appConfig.nodeEnv === 'production') {
        const hasLocalhost = appConfig.corsOrigins.some(origin => 
          origin.includes('localhost') || origin.includes('127.0.0.1')
        );
        
        if (hasLocalhost) {
          result.warnings.push('CORS origins contain localhost entries in production');
        }
      }

      // Check for HTTP origins in production
      if (appConfig.nodeEnv === 'production') {
        const hasHttp = appConfig.corsOrigins.some(origin => 
          origin.startsWith('http://') && !origin.includes('localhost')
        );
        
        if (hasHttp) {
          result.errors.push('CORS origins contain HTTP (non-HTTPS) entries in production');
          result.isValid = false;
        }
      }
    }
  }

  private validateRateLimitConfig(appConfig: AppConfigType, result: SecurityValidationResult): void {
    // Check general rate limiting
    if (appConfig.rateLimitLimit > 1000) {
      result.warnings.push('General rate limit is very high (>1000 requests per window)');
    }

    if (appConfig.rateLimitTtl < 60) {
      result.warnings.push('General rate limit TTL is very short (<60 seconds)');
    }

    // Check auth rate limiting
    if (appConfig.authRateLimitLimit > 10) {
      result.warnings.push('Auth rate limit is high (>10 attempts per window)');
    }

    if (appConfig.authRateLimitTtl < 300) {
      result.warnings.push('Auth rate limit TTL is short (<5 minutes)');
    }

    // Recommendations
    if (appConfig.authRateLimitLimit > 5) {
      result.recommendations.push('Consider reducing auth rate limit to 5 or fewer attempts');
    }

    if (appConfig.authRateLimitTtl < 900) {
      result.recommendations.push('Consider increasing auth rate limit TTL to 15 minutes or more');
    }
  }

  private validateSecurityHeadersConfig(appConfig: AppConfigType, result: SecurityValidationResult): void {
    if (!appConfig.securityHeadersEnabled) {
      result.errors.push('Security headers are disabled - this is a significant security risk');
      result.isValid = false;
    }

    if (!appConfig.cspEnabled && appConfig.securityHeadersEnabled) {
      result.warnings.push('Content Security Policy is disabled');
      result.recommendations.push('Enable CSP for better XSS protection');
    }

    if (!appConfig.hstsEnabled && appConfig.nodeEnv === 'production') {
      result.warnings.push('HSTS is disabled in production');
      result.recommendations.push('Enable HSTS for production deployments');
    }

    if (appConfig.hstsEnabled && appConfig.hstsMaxAge < 31536000) {
      result.recommendations.push('Consider increasing HSTS max age to 1 year (31536000 seconds)');
    }
  }

  private validateRequestLimits(appConfig: AppConfigType, result: SecurityValidationResult): void {
    // Parse body limit
    const bodyLimitBytes = this.parseSize(appConfig.bodyLimit);
    if (bodyLimitBytes > 50 * 1024 * 1024) { // 50MB
      result.warnings.push('Body limit is very high (>50MB)');
    }

    // Parse URL limit
    const urlLimitBytes = this.parseSize(appConfig.urlLimit);
    if (urlLimitBytes > 2 * 1024) { // 2KB
      result.warnings.push('URL limit is high (>2KB)');
    }

    // Request timeout
    if (appConfig.requestTimeout > 60000) { // 60 seconds
      result.warnings.push('Request timeout is very high (>60 seconds)');
    }

    if (appConfig.requestTimeout < 5000) { // 5 seconds
      result.warnings.push('Request timeout is very low (<5 seconds)');
    }
  }

  private validateEnvironmentSpecificConfig(appConfig: AppConfigType, result: SecurityValidationResult): void {
    if (appConfig.nodeEnv === 'production') {
      // Production-specific validations
      if (!appConfig.hstsEnabled) {
        result.errors.push('HSTS should be enabled in production');
        result.isValid = false;
      }

      if (!appConfig.cspEnabled) {
        result.warnings.push('CSP should be enabled in production');
      }

      // Check for development-like settings
      if (appConfig.rateLimitLimit > 500) {
        result.warnings.push('Rate limit seems high for production');
      }
    } else if (appConfig.nodeEnv === 'development') {
      // Development-specific recommendations
      result.recommendations.push('Ensure security settings are production-ready before deployment');
      
      if (appConfig.hstsEnabled) {
        result.recommendations.push('Consider disabling HSTS in development to avoid browser caching issues');
      }
    }
  }

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

  private logValidationResults(result: SecurityValidationResult): void {
    if (result.errors.length > 0) {
      this.logger.error('Security configuration errors found:', result.errors.join(', '));
    }

    if (result.warnings.length > 0) {
      this.logger.warn('Security configuration warnings:', result.warnings.join(', '));
    }

    if (result.recommendations.length > 0) {
      this.logger.log('Security configuration recommendations:', result.recommendations.join(', '));
    }

    if (result.isValid && result.warnings.length === 0) {
      this.logger.log('Security configuration validation passed');
    }
  }
}