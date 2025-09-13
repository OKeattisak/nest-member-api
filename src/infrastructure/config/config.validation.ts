import { z } from 'zod';

export const configValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  
  DATABASE_URL: z
    .string()
    .min(1, 'PostgreSQL database connection string is required'),
  
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
    .pipe(z.number().int().min(10).max(15)),
  
  POINT_EXPIRATION_DAYS: z
    .string()
    .default('365')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
});

export type ConfigSchema = z.infer<typeof configValidationSchema>;