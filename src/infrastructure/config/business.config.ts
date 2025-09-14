import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const businessConfigSchema = z.object({
  pointExpirationDays: z.number().positive().default(365),
  maxPointsPerTransaction: z.number().positive().default(10000),
  minPointsPerTransaction: z.number().positive().default(1),
  privilegeExpirationDays: z.number().positive().default(30),
  maxPrivilegesPerMember: z.number().positive().default(10),
  pointExpirationJobCron: z.string().default('0 0 * * *'), // Daily at midnight
  enablePointExpiration: z.boolean().default(true),
  enablePrivilegeExpiration: z.boolean().default(true),
  defaultPointExpirationDays: z.number().positive().default(365),
  maxMemberRegistrationsPerDay: z.number().positive().default(1000),
  enableMemberRegistration: z.boolean().default(true),
});

export type BusinessConfigType = z.infer<typeof businessConfigSchema>;

export default registerAs('business', (): BusinessConfigType => {
  const config = {
    pointExpirationDays: parseInt(process.env.POINT_EXPIRATION_DAYS || '365', 10),
    maxPointsPerTransaction: parseInt(process.env.MAX_POINTS_PER_TRANSACTION || '10000', 10),
    minPointsPerTransaction: parseInt(process.env.MIN_POINTS_PER_TRANSACTION || '1', 10),
    privilegeExpirationDays: parseInt(process.env.PRIVILEGE_EXPIRATION_DAYS || '30', 10),
    maxPrivilegesPerMember: parseInt(process.env.MAX_PRIVILEGES_PER_MEMBER || '10', 10),
    pointExpirationJobCron: process.env.POINT_EXPIRATION_JOB_CRON || '0 0 * * *',
    enablePointExpiration: process.env.ENABLE_POINT_EXPIRATION !== 'false',
    enablePrivilegeExpiration: process.env.ENABLE_PRIVILEGE_EXPIRATION !== 'false',
    defaultPointExpirationDays: parseInt(process.env.DEFAULT_POINT_EXPIRATION_DAYS || '365', 10),
    maxMemberRegistrationsPerDay: parseInt(process.env.MAX_MEMBER_REGISTRATIONS_PER_DAY || '1000', 10),
    enableMemberRegistration: process.env.ENABLE_MEMBER_REGISTRATION !== 'false',
  };

  return businessConfigSchema.parse(config);
});