import { z } from 'zod';

export const configValidationSchema = z.object({
  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  GLOBAL_PREFIX: z
    .string()
    .default('api'),
  
  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'PostgreSQL database connection string is required'),
  
  DB_MAX_CONNECTIONS: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  DB_CONNECTION_TIMEOUT: z
    .string()
    .default('20000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  DB_IDLE_TIMEOUT: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  DB_MAX_LIFETIME: z
    .string()
    .default('1800000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  DB_LOG_QUERIES: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  DB_LOG_SLOW_QUERIES: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  DB_SLOW_QUERY_THRESHOLD: z
    .string()
    .default('1000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  DB_RETRY_ATTEMPTS: z
    .string()
    .default('3')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0)),
  
  DB_RETRY_DELAY: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  // Authentication
  JWT_SECRET: z
    .string()
    .min(32, 'JWT secret key for member authentication must be at least 32 characters'),
  
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, 'JWT secret key for admin authentication must be at least 32 characters'),
  
  JWT_EXPIRES_IN: z
    .string()
    .default('24h'),
  
  ADMIN_JWT_EXPIRES_IN: z
    .string()
    .default('8h'),
  
  BCRYPT_ROUNDS: z
    .string()
    .default('12')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(4).max(15)),
  
  MAX_LOGIN_ATTEMPTS: z
    .string()
    .default('5')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  LOCKOUT_DURATION: z
    .string()
    .default('900000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  PASSWORD_MIN_LENGTH: z
    .string()
    .default('8')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  PASSWORD_REQUIRE_UPPERCASE: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  PASSWORD_REQUIRE_LOWERCASE: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  PASSWORD_REQUIRE_NUMBERS: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  PASSWORD_REQUIRE_SYMBOLS: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  // CORS
  CORS_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((val) => val.split(',')),
  
  // Rate Limiting
  RATE_LIMIT_TTL: z
    .string()
    .default('60')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  RATE_LIMIT_LIMIT: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  // Request Configuration
  REQUEST_TIMEOUT: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  BODY_LIMIT: z
    .string()
    .default('10mb'),
  
  URL_LIMIT: z
    .string()
    .default('1mb'),
  
  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info'),
  
  ENABLE_CONSOLE_LOGGING: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  ENABLE_FILE_LOGGING: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  ENABLE_DB_LOGGING: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  ENABLE_PERFORMANCE_LOGGING: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  SLOW_QUERY_THRESHOLD: z
    .string()
    .default('1000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  SLOW_REQUEST_THRESHOLD: z
    .string()
    .default('2000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  LOG_DIRECTORY: z
    .string()
    .default('./logs'),
  
  LOG_MAX_FILES: z
    .string()
    .default('14d'),
  
  LOG_MAX_SIZE: z
    .string()
    .default('20m'),
  
  LOG_DATE_PATTERN: z
    .string()
    .default('YYYY-MM-DD'),
  
  LOG_AUDIT_FILE: z
    .string()
    .default('audit.json'),
  
  ENABLE_REQUEST_LOGGING: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  ENABLE_RESPONSE_LOGGING: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  ENABLE_ERROR_STACK_TRACE: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  // Business Logic
  POINT_EXPIRATION_DAYS: z
    .string()
    .default('365')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  
  MAX_POINTS_PER_TRANSACTION: z
    .string()
    .default('10000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  MIN_POINTS_PER_TRANSACTION: z
    .string()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  PRIVILEGE_EXPIRATION_DAYS: z
    .string()
    .default('30')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  MAX_PRIVILEGES_PER_MEMBER: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  POINT_EXPIRATION_JOB_CRON: z
    .string()
    .default('0 0 * * *'),
  
  ENABLE_POINT_EXPIRATION: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  ENABLE_PRIVILEGE_EXPIRATION: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  DEFAULT_POINT_EXPIRATION_DAYS: z
    .string()
    .default('365')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  MAX_MEMBER_REGISTRATIONS_PER_DAY: z
    .string()
    .default('1000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  ENABLE_MEMBER_REGISTRATION: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  // Health Check
  HEALTH_CHECK_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  HEALTH_CHECK_DATABASE_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  
  HEALTH_CHECK_MEMORY_HEAP_THRESHOLD: z
    .string()
    .default('150')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  HEALTH_CHECK_MEMORY_RSS_THRESHOLD: z
    .string()
    .default('150')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
});

export type ConfigSchema = z.infer<typeof configValidationSchema>;