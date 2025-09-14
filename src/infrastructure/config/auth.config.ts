import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const authConfigSchema = z.object({
  jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
  adminJwtSecret: z.string().min(32, 'Admin JWT secret must be at least 32 characters'),
  jwtExpiresIn: z.string().default('24h'),
  adminJwtExpiresIn: z.string().default('8h'),
  bcryptRounds: z.number().int().min(10).max(15).default(12),
  maxLoginAttempts: z.number().positive().default(5),
  lockoutDuration: z.number().positive().default(900000), // 15 minutes in milliseconds
  passwordMinLength: z.number().positive().default(8),
  passwordRequireUppercase: z.boolean().default(true),
  passwordRequireLowercase: z.boolean().default(true),
  passwordRequireNumbers: z.boolean().default(true),
  passwordRequireSymbols: z.boolean().default(false),
});

export type AuthConfigType = z.infer<typeof authConfigSchema>;

export default registerAs('auth', (): AuthConfigType => {
  const config = {
    jwtSecret: process.env.JWT_SECRET!,
    adminJwtSecret: process.env.ADMIN_JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    passwordRequireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
  };

  return authConfigSchema.parse(config);
});