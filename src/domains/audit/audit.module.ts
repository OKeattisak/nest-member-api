import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { AuditLogRepository } from '../../infrastructure/database/repositories/audit-log.repository';
import { LoginAttemptRepository } from '../../infrastructure/database/repositories/login-attempt.repository';
import { TransactionHistoryRepository } from '../../infrastructure/database/repositories/transaction-history.repository';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { LoggingModule } from '../../infrastructure/logging/logging.module';

@Module({
  imports: [PrismaModule, LoggingModule],
  providers: [
    AuditService,
    {
      provide: 'IAuditLogRepository',
      useClass: AuditLogRepository,
    },
    {
      provide: 'ILoginAttemptRepository',
      useClass: LoginAttemptRepository,
    },
    {
      provide: 'ITransactionHistoryRepository',
      useClass: TransactionHistoryRepository,
    },
  ],
  exports: [
    AuditService,
    'IAuditLogRepository',
    'ILoginAttemptRepository',
    'ITransactionHistoryRepository',
  ],
})
export class AuditModule {}