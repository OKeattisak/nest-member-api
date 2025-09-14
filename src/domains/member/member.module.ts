import { Module } from '@nestjs/common';
import { MemberService } from './services/member.service';
import { MemberRepository } from './repositories/member.repository';

@Module({
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