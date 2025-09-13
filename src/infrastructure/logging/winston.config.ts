import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, context, traceId, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      traceId,
      ...meta,
    };
    return JSON.stringify(logEntry);
  }),
);

const createDailyRotateTransport = (
  filename: string,
  level: string = 'info',
): DailyRotateFile => {
  return new DailyRotateFile({
    filename: `logs/${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: logFormat,
  });
};

export const winstonConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'member-service-system',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, context, traceId }) => {
          const contextStr = context ? `[${context}]` : '';
          const traceStr = traceId ? `[${traceId}]` : '';
          return `${timestamp} ${level} ${contextStr}${traceStr} ${message}`;
        }),
      ),
    }),

    // File transports with daily rotation
    createDailyRotateTransport('application', 'info'),
    createDailyRotateTransport('error', 'error'),
    createDailyRotateTransport('debug', 'debug'),
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
};

// Performance monitoring configuration
export const performanceConfig = {
  slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10), // ms
  slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '2000', 10), // ms
  enableDatabaseLogging: process.env.ENABLE_DB_LOGGING === 'true',
  enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING !== 'false',
};