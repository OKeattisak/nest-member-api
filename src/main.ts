import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logging/logger.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const startTime = Date.now();
  
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Use Winston logger
  const logger = app.get(LoggerService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  
  // Enable validation pipes globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Enable CORS
  app.enableCors();

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
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  const startupDuration = Date.now() - startTime;
  
  logger.logSystemStartup('Application', startupDuration);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap', {
    operation: 'application_startup',
    duration: startupDuration,
    metadata: {
      port,
      environment: process.env.NODE_ENV || 'development',
    },
  });
  logger.log(`API Documentation available at: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});