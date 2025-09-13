import { Module } from '@nestjs/common';
import { MemberRepository } from './member.repository';

@Module({
  providers: [MemberRepository],
  exports: [MemberRepository],
})
export class MemberRepositoryModule {}