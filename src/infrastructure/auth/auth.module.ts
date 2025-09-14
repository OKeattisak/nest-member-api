import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      // We'll configure secrets dynamically in the service
      global: false,
    }),
  ],
  providers: [JwtService, PasswordService],
  exports: [JwtService, PasswordService],
})
export class AuthModule { }