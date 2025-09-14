import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logging/logger.service';
import { JobsService } from './infrastructure/jobs/jobs.service';
import { SecurityMiddleware } from './infrastructure/security/security.middleware';
import { SanitizationPipe } from './infrastructure/security/pipes/sanitization.pipe';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppConfigType } from './infrastructure/config/app.config';

async function bootstrap() {
  const startTime = Date.now();
  
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Get configuration service
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfigType>('app')!;
  
  // Use Winston logger
  const logger = app.get(LoggerService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  
  // Apply security middleware globally
  const securityMiddleware = app.get(SecurityMiddleware);
  app.use(securityMiddleware.use.bind(securityMiddleware));
  
  // Set global prefix
  app.setGlobalPrefix(appConfig.globalPrefix);
  
  // Enable validation pipes globally with sanitization
  app.useGlobalPipes(
    app.get(SanitizationPipe),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: appConfig.nodeEnv === 'production',
    }),
  );
  
  // Configure CORS with security enhancements
  if (appConfig.corsEnabled) {
    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (appConfig.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Log unauthorized CORS attempt
        logger.warn('CORS request from unauthorized origin', 'Bootstrap', {
          operation: 'cors_unauthorized_origin',
        });
        
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Trace-ID',
        'X-Request-ID',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
        'X-Per-Page',
        'X-Response-Time',
        'X-Request-ID',
      ],
      maxAge: 86400, // 24 hours
      optionsSuccessStatus: 200,
    });
  }

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Member Service System API')
    .setDescription('A comprehensive member service system with point management and privilege exchange functionality')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'admin-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'member-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Admin Auth', 'Administrator authentication endpoints')
    .addTag('Admin Members', 'Administrator member management endpoints')
    .addTag('Admin Points', 'Administrator point management endpoints')
    .addTag('Admin Privileges', 'Administrator privilege management endpoints')
    .addTag('Admin Jobs', 'Administrator background job management endpoints')
    .addTag('Member Auth', 'Member authentication endpoints')
    .addTag('Member Profile', 'Member profile management endpoints')
    .addTag('Member Points', 'Member point management endpoints')
    .addTag('Member Privileges', 'Member privilege management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${appConfig.globalPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  // Setup graceful shutdown
  setupGracefulShutdown(app, logger);
  
  const port = appConfig.port;
  await app.listen(port);
  
  const startupDuration = Date.now() - startTime;
  
  logger.logSystemStartup('Application', startupDuration);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap', {
    operation: 'application_startup',
    duration: startupDuration,
    metadata: {
      port,
      environment: appConfig.nodeEnv,
      globalPrefix: appConfig.globalPrefix,
      corsEnabled: appConfig.corsEnabled,
    },
  });
  logger.log(`API Documentation available at: http://localhost:${port}/${appConfig.globalPrefix}/docs`, 'Bootstrap');
  logger.log(`Health check available at: http://localhost:${port}/${appConfig.globalPrefix}/health`, 'Bootstrap');
}

function setupGracefulShutdown(app: any, logger: LoggerService) {
  const jobsService = app.get(JobsService);
  
  // Handle graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`, 'Bootstrap', {
      operation: 'graceful_shutdown_start',
    });

    try {
      // Stop accepting new requests
      logger.log('Stopping server from accepting new connections...', 'Bootstrap');
      
      // Wait for background jobs to complete
      logger.log('Waiting for background jobs to complete...', 'Bootstrap');
      await jobsService.waitForJobsToComplete(30000); // 30 second timeout
      
      // Close the application
      logger.log('Closing application...', 'Bootstrap');
      await app.close();
      
      logger.log('Graceful shutdown completed successfully', 'Bootstrap', {
        operation: 'graceful_shutdown_complete',
      });
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', 'Bootstrap', error instanceof Error ? error.message : 'Unknown error');
      
      process.exit(1);
    }
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', 'Bootstrap', error.message);
    
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', 'Bootstrap', reason instanceof Error ? reason.message : String(reason));
    
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});