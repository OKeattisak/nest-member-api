import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});