import { ConfigSchema } from './config.validation';

export type AppConfig = ConfigSchema;

export const validateConfig = (config: Record<string, unknown>): AppConfig => {
  const { configValidationSchema } = require('./config.validation');
  return configValidationSchema.parse(config);
};