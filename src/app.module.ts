import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { CommonModule } from './common/common.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { JobsModule } from './infrastructure/jobs/jobs.module';
import { PresentationModule } from './presentation/presentation.module';
import { validateConfig } from './infrastructure/config/config.interface';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),
    LoggingModule,
    CommonModule,
    PrismaModule,
    AuthModule,
    JobsModule,
    PresentationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}