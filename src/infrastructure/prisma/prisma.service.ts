import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logging/logger.service';
import { PrismaLoggingService } from '../logging/prisma-logging.interceptor';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private prismaLoggingService: PrismaLoggingService;

  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    this.prismaLoggingService = new PrismaLoggingService(loggerService);
  }

  async onModuleInit() {
    await this.$connect();
    
    // Add logging middleware
    (this as any).$use(this.prismaLoggingService.createPrismaLogMiddleware());
    
    // Set up event listeners for Prisma logs
    (this as any).$on('query', (e: any) => {
      this.loggerService.debug(`Query: ${e.query}`, 'PrismaService', {
        operation: 'prisma_query',
        duration: e.duration,
        metadata: {
          query: e.query,
          params: e.params,
        },
      });
    });

    (this as any).$on('info', (e: any) => {
      this.loggerService.log(e.message, 'PrismaService');
    });

    (this as any).$on('warn', (e: any) => {
      this.loggerService.warn(e.message, 'PrismaService');
    });

    (this as any).$on('error', (e: any) => {
      this.loggerService.error(e.message, undefined, 'PrismaService');
    });

    this.loggerService.logSystemStartup('PrismaService');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}