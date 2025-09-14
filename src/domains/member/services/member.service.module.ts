import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberRepository } from '../repositories/member.repository';
import { IMemberRepository } from '../repositories/member.repository.interface';
import { AuthModule } from '@/infrastructure/auth/auth.module';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [
    {
      provide: 'IMemberRepository',
      useClass: MemberRepository,
    },
    MemberService,
  ],
  exports: [MemberService],
})
export class MemberServiceModule {}