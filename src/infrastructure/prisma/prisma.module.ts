import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LoggingModule } from '@/infrastructure/logging/logging.module';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}