import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { CommonModule } from './common/common.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { JobsModule } from './infrastructure/jobs/jobs.module';
import { HealthModule } from './infrastructure/health/health.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { PresentationModule } from './presentation/presentation.module';
import { validateConfig } from './infrastructure/config/config.interface';
import appConfig from './infrastructure/config/app.config';
import databaseConfig from './infrastructure/config/database.config';
import authConfig from './infrastructure/config/auth.config';
import loggingConfig from './infrastructure/config/logging.config';
import businessConfig from './infrastructure/config/business.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        loggingConfig,
        businessConfig,
      ],
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    LoggingModule,
    SecurityModule,
    CommonModule,
    PrismaModule,
    AuthModule,
    JobsModule,
    HealthModule,
    PresentationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}