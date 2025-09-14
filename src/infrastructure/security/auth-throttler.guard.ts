import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../logging/logger.service';
import { SecurityService } from './security.service';
import { SecurityAuditService } from './security-audit.service';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
    constructor(
        private readonly logger: LoggerService,
        private readonly securityService: SecurityService,
        private readonly securityAuditService: SecurityAuditService,
        protected readonly reflector: Reflector,
    ) {
        super(
            {
                throttlers: [
                    {
                        name: 'auth',
                        ttl: 300000, // 5 minutes
                        limit: 5, // 5 attempts per 5 minutes
                    },
                    {
                        name: 'auth-strict',
                        ttl: 900000, // 15 minutes
                        limit: 10, // 10 attempts per 15 minutes
                    },
                ],
            },
            {} as any,
            reflector,
        );
    }

    protected async getTracker(req: Record<string, any>): Promise<string> {
        // Get client information
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';
        const forwardedFor = req.headers?.['x-forwarded-for'] || '';

        // Use the most specific IP available
        let clientIp = ip;
        if (forwardedFor && typeof forwardedFor === 'string') {
            const ips = forwardedFor.split(',').map(ip => ip.trim());
            clientIp = ips[0] || ip;
        }

        // Validate IP address
        if (!this.securityService.isValidIpAddress(clientIp)) {
            this.logger.warn('Invalid IP address in rate limiting', 'AuthThrottlerGuard', {
                operation: 'invalid_ip_rate_limit',
                metadata: { ip: clientIp },
            });
            clientIp = 'invalid';
        }

        // Create a more sophisticated identifier
        const userAgentHash = Buffer.from(userAgent).toString('base64').substring(0, 10);
        return `${clientIp}-${userAgentHash}`;
    }

    protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        
        // Skip rate limiting for health checks
        if (request.url?.includes('/health')) {
            return true;
        }

        // Skip for internal requests (if from private IP)
        const ip = request.ip || request.connection?.remoteAddress;
        if (ip && this.securityService.isPrivateIpAddress(ip)) {
            return true;
        }

        return super.shouldSkip(context);
    }

    protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Get client identifier for logging
        const clientId = await this.getTracker(request);
        const ip = request.ip || request.connection?.remoteAddress || 'unknown';
        const userAgent = request.headers?.['user-agent'] || 'unknown';
        const endpoint = request.url || 'unknown';

        // Log detailed rate limit information using audit service
        this.securityAuditService.logRateLimitExceeded(
            ip,
            endpoint,
            userAgent,
        );

        // Add comprehensive rate limit headers
        const resetTime = new Date(Date.now() + 300 * 1000);
        response.setHeader('X-RateLimit-Limit', 5);
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('X-RateLimit-Reset', resetTime.toISOString());
        response.setHeader('X-RateLimit-Reset-After', '300');
        response.setHeader('Retry-After', '300');

        // Add security headers
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');

        throw new ThrottlerException('Too many authentication attempts. Please try again later.');
    }

    protected async handleRequest(requestProps: any): Promise<boolean> {
        // Enhanced logging for authentication attempts
        if (requestProps.context) {
            const request = requestProps.context.switchToHttp().getRequest();
            const ip = request.ip || request.connection?.remoteAddress || 'unknown';
            const userAgent = request.headers?.['user-agent'] || 'unknown';
            
            this.logger.debug('Processing authentication request', 'AuthThrottlerGuard', {
                operation: 'auth_request_processing',
                metadata: {
                    ip,
                    userAgent: userAgent.substring(0, 50),
                    endpoint: request.url,
                    method: request.method,
                },
            });
        }

        return super.handleRequest(requestProps);
    }
}