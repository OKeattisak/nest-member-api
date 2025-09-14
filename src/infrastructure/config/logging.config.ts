import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const loggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  enableConsole: z.boolean().default(true),
  enableFile: z.boolean().default(true),
  enableDbLogging: z.boolean().default(false),
  enablePerformanceLogging: z.boolean().default(true),
  slowQueryThreshold: z.number().positive().default(1000), // milliseconds
  slowRequestThreshold: z.number().positive().default(2000), // milliseconds
  logDirectory: z.string().default('./logs'),
  maxFiles: z.string().default('14d'), // Keep logs for 14 days
  maxSize: z.string().default('20m'), // Max file size 20MB
  datePattern: z.string().default('YYYY-MM-DD'),
  auditFile: z.string().default('audit.json'),
  enableRequestLogging: z.boolean().default(true),
  enableResponseLogging: z.boolean().default(true),
  enableErrorStackTrace: z.boolean().default(true),
});

export type LoggingConfigType = z.infer<typeof loggingConfigSchema>;

export default registerAs('logging', (): LoggingConfigType => {
  const config = {
    level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING !== 'false',
    enableDbLogging: process.env.ENABLE_DB_LOGGING === 'true',
    enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING !== 'false',
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10),
    slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '2000', 10),
    logDirectory: process.env.LOG_DIRECTORY || './logs',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    auditFile: process.env.LOG_AUDIT_FILE || 'audit.json',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enableResponseLogging: process.env.ENABLE_RESPONSE_LOGGING !== 'false',
    enableErrorStackTrace: process.env.ENABLE_ERROR_STACK_TRACE !== 'false',
  };

  return loggingConfigSchema.parse(config);
});