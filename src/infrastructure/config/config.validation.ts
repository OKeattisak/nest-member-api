import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .default(3000),
  
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL database connection string'),
  
  JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .description('JWT secret key for member authentication'),
  
  ADMIN_JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .description('JWT secret key for admin authentication'),
  
  JWT_EXPIRES_IN: Joi.string()
    .default('24h')
    .description('JWT token expiration time for members'),
  
  ADMIN_JWT_EXPIRES_IN: Joi.string()
    .default('8h')
    .description('JWT token expiration time for admins'),
  
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)
    .description('Number of bcrypt hashing rounds'),
  
  POINT_EXPIRATION_DAYS: Joi.number()
    .integer()
    .min(1)
    .default(365)
    .description('Default point expiration in days'),
});