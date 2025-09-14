import { Module } from '@nestjs/common';
import { MemberService } from './services/member.service';
import { MemberRepository } from './repositories/member.repository';
import { AuthModule } from '@/infrastructure/auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  providers: [
    MemberService,
    {
      provide: 'IMemberRepository',
      useClass: MemberRepository,
    },
  ],
  exports: [
    MemberService,
    'IMemberRepository',
  ],
})
export class MemberModule {}