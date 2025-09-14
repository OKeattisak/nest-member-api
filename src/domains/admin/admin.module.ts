import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminRepository } from './repositories/admin.repository';
import { AuthModule } from '@/infrastructure/auth/auth.module';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [
    AdminService,
    {
      provide: 'IAdminRepository',
      useClass: AdminRepository,
    },
  ],
  exports: [AdminService, 'IAdminRepository'],
})
export class AdminModule {}