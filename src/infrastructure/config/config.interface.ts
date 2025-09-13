export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  adminJwtSecret: string;
  jwtExpiresIn: string;
  adminJwtExpiresIn: string;
  bcryptRounds: number;
  pointExpirationDays: number;
}

export const getAppConfig = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  pointExpirationDays: parseInt(process.env.POINT_EXPIRATION_DAYS || '365', 10),
});