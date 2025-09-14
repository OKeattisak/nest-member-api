import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PointService } from './services/point.service';
import { PointExpirationJob } from './services/point-expiration.job';
import { PointRepositoryModule } from './repositories/point.repository.module';
import { PointRepository } from './repositories/point.repository';
import { AuditModule } from '@/domains/audit/audit.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable scheduling for background jobs
    PointRepositoryModule,
    AuditModule,
  ],
  providers: [
    PointService,
    PointExpirationJob,
    {
      provide: 'IPointRepository',
      useClass: PointRepository,
    },
  ],
  exports: [
    PointService,
    PointExpirationJob,
  ],
})
export class PointModule {}