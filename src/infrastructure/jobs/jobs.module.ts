import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { DomainsModule } from '@/domains/domains.module';

@Module({
  imports: [
    DomainsModule,
  ],
  providers: [
    JobsService,
  ],
  exports: [
    JobsService,
  ],
})
export class JobsModule {}