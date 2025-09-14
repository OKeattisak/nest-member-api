import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const appConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().positive().default(3000),
  globalPrefix: z.string().default('api'),
  corsEnabled: z.boolean().default(true),
  corsOrigins: z.array(z.string()).default(['http://localhost:3000', 'http://localhost:3001']),
  rateLimitTtl: z.number().positive().default(60), // seconds
  rateLimitLimit: z.number().positive().default(100), // requests per ttl
  authRateLimitTtl: z.number().positive().default(300), // seconds
  authRateLimitLimit: z.number().positive().default(5), // requests per ttl
  requestTimeout: z.number().positive().default(30000), // milliseconds
  bodyLimit: z.string().default('10mb'),
  urlLimit: z.string().default('1mb'),
  securityHeadersEnabled: z.boolean().default(true),
  cspEnabled: z.boolean().default(true),
  hstsEnabled: z.boolean().default(true),
  hstsMaxAge: z.number().positive().default(31536000), // seconds
});

export type AppConfigType = z.infer<typeof appConfigSchema>;

export default registerAs('app', (): AppConfigType => {
  const config = {
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
    port: parseInt(process.env.PORT || '3000', 10),
    globalPrefix: process.env.GLOBAL_PREFIX || 'api',
    corsEnabled: process.env.CORS_ENABLED !== 'false',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
    authRateLimitTtl: parseInt(process.env.AUTH_RATE_LIMIT_TTL || '300', 10),
    authRateLimitLimit: parseInt(process.env.AUTH_RATE_LIMIT_LIMIT || '5', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    bodyLimit: process.env.BODY_LIMIT || '10mb',
    urlLimit: process.env.URL_LIMIT || '1mb',
    securityHeadersEnabled: process.env.SECURITY_HEADERS_ENABLED !== 'false',
    cspEnabled: process.env.CSP_ENABLED !== 'false',
    hstsEnabled: process.env.HSTS_ENABLED !== 'false',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10),
  };

  return appConfigSchema.parse(config);
});