import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AuthModule } from '../../infrastructure/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [
    AdminService,
    // Repository will be provided by infrastructure layer
  ],
  exports: [AdminService],
})
export class AdminModule {}