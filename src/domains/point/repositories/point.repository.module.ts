import { Module } from '@nestjs/common';
import { PointRepository } from './point.repository';

@Module({
  providers: [PointRepository],
  exports: [PointRepository],
})
export class PointRepositoryModule {}