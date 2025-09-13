import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { AppConfig } from '../config/config.interface';
import { AdminRole } from '../../domains/admin/entities/admin.entity';

export interface MemberJwtPayload {
  sub: string; // member ID
  type: 'member';
  iat?: number;
  exp?: number;
}

export interface AdminJwtPayload {
  sub: string; // admin ID
  role: AdminRole;
  type: 'admin';
  iat?: number;
  exp?: number;
}

export interface JwtTokens {
  accessToken: string;
  expiresIn: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async generateMemberToken(memberId: string): Promise<JwtTokens> {
    const payload: MemberJwtPayload = {
      sub: memberId,
      type: 'member',
    };

    const secret = this.configService.get('JWT_SECRET', { infer: true })!;
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', { infer: true })!;

    const accessToken = await this.nestJwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    return {
      accessToken,
      expiresIn,
    };
  }

  async generateAdminToken(adminId: string, role: AdminRole): Promise<JwtTokens> {
    const payload: AdminJwtPayload = {
      sub: adminId,
      role,
      type: 'admin',
    };

    const secret = this.configService.get('ADMIN_JWT_SECRET', { infer: true })!;
    const expiresIn = this.configService.get('ADMIN_JWT_EXPIRES_IN', { infer: true })!;

    const accessToken = await this.nestJwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    return {
      accessToken,
      expiresIn,
    };
  }

  async verifyMemberToken(token: string): Promise<MemberJwtPayload> {
    try {
      const secret = this.configService.get('JWT_SECRET', { infer: true })!;
      const payload = await this.nestJwtService.verifyAsync<MemberJwtPayload>(token, {
        secret,
      });

      if (payload.type !== 'member') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid or expired member token');
    }
  }

  async verifyAdminToken(token: string): Promise<AdminJwtPayload> {
    try {
      const secret = this.configService.get('ADMIN_JWT_SECRET', { infer: true })!;
      const payload = await this.nestJwtService.verifyAsync<AdminJwtPayload>(token, {
        secret,
      });

      if (payload.type !== 'admin') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid or expired admin token');
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}