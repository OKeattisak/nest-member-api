import { Injectable, Inject } from '@nestjs/common';
import { Admin } from '../entities/admin.entity';
import { IAdminRepository } from '../repositories/admin.repository.interface';
import { PasswordService } from '../../../infrastructure/auth/password.service';
import { Email } from '../../common/value-objects';
import {
  ConflictException,
  NotFoundExceptionDomain,
  ValidationException,
  UnauthorizedException,
} from '../../../common/exceptions/domain.exception';

export interface AuthenticateAdminData {
  emailOrUsername: string;
  password: string;
}

export interface AdminAuthResult {
  admin: Admin;
  isAuthenticated: boolean;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async authenticateAdmin(data: AuthenticateAdminData): Promise<AdminAuthResult> {
    if (!data.emailOrUsername || !data.password) {
      throw new ValidationException('Email/username and password are required');
    }

    // Find admin by email or username
    let adminRecord = await this.adminRepository.findByEmail(data.emailOrUsername);
    if (!adminRecord) {
      adminRecord = await this.adminRepository.findByUsername(data.emailOrUsername);
    }

    if (!adminRecord) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if admin is active
    if (!adminRecord.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verify(data.password, adminRecord.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const admin = this.toDomainEntity(adminRecord);

    return {
      admin,
      isAuthenticated: true,
    };
  }

  async getAdminById(id: string): Promise<Admin> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('Admin ID is required');
    }

    const adminRecord = await this.adminRepository.findActiveById(id);
    if (!adminRecord) {
      throw new NotFoundExceptionDomain('Admin', id);
    }

    return this.toDomainEntity(adminRecord);
  }

  private toDomainEntity(adminRecord: any): Admin {
    return new Admin({
      id: adminRecord.id,
      email: adminRecord.email,
      username: adminRecord.username,
      passwordHash: adminRecord.passwordHash,
      role: adminRecord.role,
      isActive: adminRecord.isActive,
      createdAt: adminRecord.createdAt,
      updatedAt: adminRecord.updatedAt,
    });
  }
}