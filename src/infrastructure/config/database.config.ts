import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const databaseConfigSchema = z.object({
  url: z.string().min(1, 'Database URL is required'),
  maxConnections: z.number().positive().default(10),
  connectionTimeout: z.number().positive().default(20000), // milliseconds
  idleTimeout: z.number().positive().default(30000), // milliseconds
  maxLifetime: z.number().positive().default(1800000), // 30 minutes in milliseconds
  logQueries: z.boolean().default(false),
  logSlowQueries: z.boolean().default(true),
  slowQueryThreshold: z.number().positive().default(1000), // milliseconds
  retryAttempts: z.number().min(0).default(3),
  retryDelay: z.number().positive().default(3000), // milliseconds
});

export type DatabaseConfigType = z.infer<typeof databaseConfigSchema>;

export default registerAs('database', (): DatabaseConfigType => {
  const config = {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '20000', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || '1800000', 10),
    logQueries: process.env.DB_LOG_QUERIES === 'true',
    logSlowQueries: process.env.DB_LOG_SLOW_QUERIES !== 'false',
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000', 10),
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
  };

  return databaseConfigSchema.parse(config);
});