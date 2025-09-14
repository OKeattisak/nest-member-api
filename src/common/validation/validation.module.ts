import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import {
  IsEmailUniqueConstraint,
  IsUsernameUniqueConstraint,
  MemberExistsConstraint,
  PrivilegeExistsConstraint,
} from '../decorators/validation.decorators';

@Module({
  imports: [PrismaModule],
  providers: [
    IsEmailUniqueConstraint,
    IsUsernameUniqueConstraint,
    MemberExistsConstraint,
    PrivilegeExistsConstraint,
  ],
  exports: [
    IsEmailUniqueConstraint,
    IsUsernameUniqueConstraint,
    MemberExistsConstraint,
    PrivilegeExistsConstraint,
  ],
})
export class ValidationModule {}