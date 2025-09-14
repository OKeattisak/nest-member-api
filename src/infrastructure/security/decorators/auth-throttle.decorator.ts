import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Decorator for applying strict rate limiting to authentication endpoints
 * Uses more restrictive limits than general API endpoints
 */
export const AuthThrottle = (limit: number = 5, ttl: number = 60) => {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      // Apply throttling with custom limits for auth endpoints
      Throttle({ default: { limit, ttl } })(target, propertyKey, descriptor);
      
      // Mark as authentication endpoint for special handling
      SetMetadata('isAuthEndpoint', true)(target, propertyKey, descriptor);
    }
  };
};

/**
 * Decorator for login endpoints with very strict rate limiting
 */
export const LoginThrottle = () => AuthThrottle(5, 300); // 5 attempts per 5 minutes

/**
 * Decorator for registration endpoints with moderate rate limiting
 */
export const RegisterThrottle = () => AuthThrottle(3, 600); // 3 attempts per 10 minutes

/**
 * Decorator for password reset endpoints with strict rate limiting
 */
export const PasswordResetThrottle = () => AuthThrottle(3, 900); // 3 attempts per 15 minutes