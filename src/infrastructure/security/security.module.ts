import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityMiddleware } from './security.middleware';
import { SecurityAuditService } from './security-audit.service';
import { SanitizationPipe } from './pipes/sanitization.pipe';
import { AuthThrottlerGuard } from './auth-throttler.guard';
import { SecurityConfigValidator } from './security-config.validator';
import { AppConfigType } from '../config/app.config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get<AppConfigType>('app')!;
        return [
          {
            name: 'short',
            ttl: appConfig.rateLimitTtl * 1000, // Convert to milliseconds
            limit: appConfig.rateLimitLimit,
          },
          {
            name: 'medium',
            ttl: 60 * 60 * 1000, // 1 hour
            limit: 1000,
          },
          {
            name: 'long',
            ttl: 24 * 60 * 60 * 1000, // 24 hours
            limit: 10000,
          },
          {
            name: 'auth',
            ttl: appConfig.authRateLimitTtl * 1000, // Convert to milliseconds
            limit: appConfig.authRateLimitLimit,
          },
        ];
      },
    }),
  ],
  providers: [
    SecurityService,
    SecurityMiddleware,
    SecurityAuditService,
    SanitizationPipe,
    AuthThrottlerGuard,
    SecurityConfigValidator,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [
    SecurityService, 
    SecurityMiddleware, 
    SecurityAuditService,
    SanitizationPipe, 
    AuthThrottlerGuard,
    SecurityConfigValidator,
  ],
})
export class SecurityModule implements OnModuleInit {
  constructor(private readonly securityConfigValidator: SecurityConfigValidator) {}

  async onModuleInit() {
    // Validate security configuration on module initialization
    this.securityConfigValidator.validateSecurityConfig();
  }
}