import { Module } from '@nestjs/common';
import { DomainsModule } from '../../domains/domains.module';
import { AuthModule } from '../../infrastructure/auth/auth.module';
import { LoginMemberUseCase } from './use-cases/login-member.use-case';
import { LoginAdminUseCase } from './use-cases/login-admin.use-case';
import { RegisterMemberUseCase } from './use-cases/register-member.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';

@Module({
    imports: [DomainsModule, AuthModule],
    providers: [
        LoginMemberUseCase,
        LoginAdminUseCase,
        RegisterMemberUseCase,
        RefreshTokenUseCase,
    ],
    exports: [
        LoginMemberUseCase,
        LoginAdminUseCase,
        RegisterMemberUseCase,
        RefreshTokenUseCase,
    ],
})
export class AuthApplicationModule { }