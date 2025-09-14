import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  clientIp?: string;
  userAgent?: string;
  userId?: string;
  endpoint?: string;
}

export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MALICIOUS_REQUEST = 'malicious_request',
  INVALID_TOKEN = 'invalid_token',
  SUSPICIOUS_USER_AGENT = 'suspicious_user_agent',
  INVALID_IP = 'invalid_ip',
  CORS_VIOLATION = 'cors_violation',
  CSP_VIOLATION = 'csp_violation',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  PAYLOAD_TOO_LARGE = 'payload_too_large',
  URL_TOO_LONG = 'url_too_long',
  SUSPICIOUS_HEADER = 'suspicious_header',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Injectable()
export class SecurityAuditService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Log a security event
   */
  logSecurityEvent(event: SecurityEvent): void {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    // Log based on severity
    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
        this.logger.error(
          `SECURITY CRITICAL: ${event.message}`,
          event.source,
          JSON.stringify(enrichedEvent),
        );
        break;
      case SecuritySeverity.HIGH:
        this.logger.error(
          `SECURITY HIGH: ${event.message}`,
          event.source,
          JSON.stringify(enrichedEvent),
        );
        break;
      case SecuritySeverity.MEDIUM:
        this.logger.warn(
          `SECURITY MEDIUM: ${event.message}`,
          event.source,
          {
            operation: event.type,
            metadata: enrichedEvent,
          },
        );
        break;
      case SecuritySeverity.LOW:
        this.logger.log(
          `SECURITY LOW: ${event.message}`,
          event.source,
          {
            operation: event.type,
            metadata: enrichedEvent,
          },
        );
        break;
    }

    // Additional processing for critical events
    if (event.severity === SecuritySeverity.CRITICAL) {
      this.handleCriticalSecurityEvent(enrichedEvent);
    }
  }

  /**
   * Log rate limit exceeded event
   */
  logRateLimitExceeded(
    clientIp: string,
    endpoint: string,
    userAgent?: string,
    userId?: string,
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecuritySeverity.MEDIUM,
      source: 'SecurityAuditService',
      message: `Rate limit exceeded for client ${clientIp}`,
      clientIp,
      endpoint,
      userAgent,
      userId,
      metadata: {
        action: 'rate_limit_exceeded',
        clientIdentifier: clientIp,
      },
    });
  }

  /**
   * Log malicious request event
   */
  logMaliciousRequest(
    clientIp: string,
    endpoint: string,
    pattern: string,
    userAgent?: string,
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.MALICIOUS_REQUEST,
      severity: SecuritySeverity.HIGH,
      source: 'SecurityAuditService',
      message: `Malicious request pattern detected: ${pattern}`,
      clientIp,
      endpoint,
      userAgent,
      metadata: {
        action: 'malicious_request_blocked',
        detectedPattern: pattern,
      },
    });
  }

  /**
   * Log authentication failure event
   */
  logAuthenticationFailure(
    identifier: string,
    clientIp: string,
    reason: string,
    userAgent?: string,
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.AUTHENTICATION_FAILURE,
      severity: SecuritySeverity.MEDIUM,
      source: 'SecurityAuditService',
      message: `Authentication failure for ${identifier}: ${reason}`,
      clientIp,
      userAgent,
      metadata: {
        action: 'authentication_failure',
        identifier,
        failureReason: reason,
      },
    });
  }

  /**
   * Log brute force attempt
   */
  logBruteForceAttempt(
    identifier: string,
    clientIp: string,
    attemptCount: number,
    userAgent?: string,
  ): void {
    const severity = attemptCount > 10 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM;
    
    this.logSecurityEvent({
      type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
      severity,
      source: 'SecurityAuditService',
      message: `Potential brute force attack detected for ${identifier} (${attemptCount} attempts)`,
      clientIp,
      userAgent,
      metadata: {
        action: 'brute_force_detection',
        identifier,
        attemptCount,
      },
    });
  }

  /**
   * Log suspicious user agent
   */
  logSuspiciousUserAgent(
    userAgent: string,
    clientIp: string,
    endpoint: string,
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_USER_AGENT,
      severity: SecuritySeverity.LOW,
      source: 'SecurityAuditService',
      message: `Suspicious user agent detected: ${userAgent.substring(0, 100)}`,
      clientIp,
      endpoint,
      userAgent,
      metadata: {
        action: 'suspicious_user_agent_detected',
      },
    });
  }

  /**
   * Log CORS violation
   */
  logCorsViolation(
    origin: string,
    clientIp: string,
    endpoint: string,
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.CORS_VIOLATION,
      severity: SecuritySeverity.MEDIUM,
      source: 'SecurityAuditService',
      message: `CORS violation from unauthorized origin: ${origin}`,
      clientIp,
      endpoint,
      metadata: {
        action: 'cors_violation',
        unauthorizedOrigin: origin,
      },
    });
  }

  /**
   * Log payload too large event
   */
  logPayloadTooLarge(
    clientIp: string,
    endpoint: string,
    size: number,
    limit: number,
    userAgent?: string,
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.PAYLOAD_TOO_LARGE,
      severity: SecuritySeverity.MEDIUM,
      source: 'SecurityAuditService',
      message: `Request payload too large: ${size} bytes (limit: ${limit} bytes)`,
      clientIp,
      endpoint,
      userAgent,
      metadata: {
        action: 'payload_too_large',
        payloadSize: size,
        sizeLimit: limit,
      },
    });
  }

  /**
   * Handle critical security events
   */
  private handleCriticalSecurityEvent(event: SecurityEvent): void {
    // In a real application, you might want to:
    // 1. Send alerts to security team
    // 2. Temporarily block the IP address
    // 3. Trigger additional security measures
    // 4. Store in a security incident database

    this.logger.error(
      'CRITICAL SECURITY EVENT DETECTED - IMMEDIATE ATTENTION REQUIRED',
      'SecurityAuditService',
      JSON.stringify(event),
    );

    // For now, just log additional context
    this.logger.error(
      'Security team should be notified immediately',
      'SecurityAuditService',
      JSON.stringify({
        operation: 'critical_security_alert',
        eventType: event.type,
        clientIp: event.clientIp,
        endpoint: event.endpoint,
        timestamp: event.timestamp,
      }),
    );
  }

  /**
   * Get security event summary for monitoring
   */
  getSecurityEventSummary(): Record<string, any> {
    // In a real application, this would query a database or cache
    // For now, return a placeholder structure
    return {
      message: 'Security event summary would be implemented with persistent storage',
      recommendation: 'Implement database storage for security events to enable proper monitoring',
    };
  }
}