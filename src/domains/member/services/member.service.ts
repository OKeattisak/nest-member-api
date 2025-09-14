import { Injectable, Inject } from '@nestjs/common';
import { Member } from '../entities/member.entity';
import { IMemberRepository } from '../repositories/member.repository.interface';
import { PasswordService } from '../../../infrastructure/auth/password.service';
import { Email, Password } from '../../common/value-objects';
import {
  ConflictException,
  NotFoundExceptionDomain,
  ValidationException,
  BusinessRuleException,
  UnauthorizedException,
} from '../../../common/exceptions/domain.exception';
import { AuditService } from '../../audit/services/audit.service';
import { AuditAction, ActorType } from '@prisma/client';
import { RequestContext } from '../../../common/utils/trace.util';

export interface RegisterMemberData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthenticateMemberData {
  emailOrUsername: string;
  password: string;
}

export interface UpdateMemberProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface MemberAuthResult {
  member: Member;
  isAuthenticated: boolean;
}

@Injectable()
export class MemberService {
  constructor(
    @Inject('IMemberRepository')
    private readonly memberRepository: IMemberRepository,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
  ) {}

  async registerMember(data: RegisterMemberData): Promise<Member> {
    // Validate input data
    this.validateRegistrationData(data);

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new ValidationException(
        'Password does not meet strength requirements',
        { errors: passwordValidation.errors }
      );
    }

    // Check if email already exists
    const existingEmailMember = await this.memberRepository.findByEmail(data.email);
    if (existingEmailMember) {
      throw new ConflictException('Email is already registered');
    }

    // Check if username already exists
    const existingUsernameMember = await this.memberRepository.findByUsername(data.username);
    if (existingUsernameMember) {
      throw new ConflictException('Username is already taken');
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(data.password);

    // Create member
    const memberData = {
      email: data.email,
      username: data.username,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const createdMember = await this.memberRepository.create(memberData);
    
    // Log member creation
    await this.auditService.logEntityCreation(
      {
        entityType: 'Member',
        entityId: createdMember.id,
        newValues: {
          email: createdMember.email,
          username: createdMember.username,
          firstName: createdMember.firstName,
          lastName: createdMember.lastName,
          isActive: createdMember.isActive,
        },
        metadata: {
          registrationMethod: 'self_registration',
        },
      },
      {
        actorType: ActorType.MEMBER,
        actorId: createdMember.id,
        traceId: RequestContext.getTraceId(),
      },
    );
    
    return this.toDomainEntity(createdMember);
  }

  async authenticateMember(data: AuthenticateMemberData): Promise<MemberAuthResult> {
    if (!data.emailOrUsername || !data.password) {
      throw new ValidationException('Email/username and password are required');
    }

    // Find member by email or username
    let memberRecord = await this.memberRepository.findByEmail(data.emailOrUsername);
    if (!memberRecord) {
      memberRecord = await this.memberRepository.findByUsername(data.emailOrUsername);
    }

    if (!memberRecord) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if member is active and not deleted
    if (!memberRecord.isActive || memberRecord.deletedAt) {
      throw new UnauthorizedException('Account is inactive or deleted');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verify(data.password, memberRecord.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const member = this.toDomainEntity(memberRecord);

    return {
      member,
      isAuthenticated: true,
    };
  }

  async getMemberById(id: string): Promise<Member> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('Member ID is required');
    }

    const memberRecord = await this.memberRepository.findActiveById(id);
    if (!memberRecord) {
      throw new NotFoundExceptionDomain('Member', id);
    }

    return this.toDomainEntity(memberRecord);
  }

  async updateMemberProfile(id: string, data: UpdateMemberProfileData): Promise<Member> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('Member ID is required');
    }

    // Get existing member
    const existingMember = await this.getMemberById(id);

    // Validate username uniqueness if being updated
    if (data.username && data.username !== existingMember.username) {
      const existingUsernameMember = await this.memberRepository.findByUsername(data.username);
      if (existingUsernameMember && existingUsernameMember.id !== id) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Create a new member instance to validate the update
    const memberToUpdate = new Member({
      id: existingMember.id,
      email: existingMember.email,
      username: existingMember.username,
      passwordHash: existingMember.passwordHash,
      firstName: existingMember.firstName,
      lastName: existingMember.lastName,
      isActive: existingMember.isActive,
      createdAt: existingMember.createdAt,
      updatedAt: existingMember.updatedAt,
      deletedAt: existingMember.deletedAt,
    });

    // Apply updates using domain method (this validates the data)
    memberToUpdate.updateProfile(data);

    // Update in repository
    const updatedMemberRecord = await this.memberRepository.update(id, {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
    });

    // Log member profile update
    await this.auditService.logEntityUpdate(
      {
        entityType: 'Member',
        entityId: id,
        oldValues: {
          firstName: existingMember.firstName,
          lastName: existingMember.lastName,
          username: existingMember.username,
        },
        newValues: {
          firstName: data.firstName || existingMember.firstName,
          lastName: data.lastName || existingMember.lastName,
          username: data.username || existingMember.username,
        },
        metadata: {
          updateType: 'profile_update',
        },
      },
      {
        actorType: ActorType.MEMBER,
        actorId: id,
        traceId: RequestContext.getTraceId(),
      },
    );

    return this.toDomainEntity(updatedMemberRecord);
  }

  async deactivateMember(id: string): Promise<Member> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('Member ID is required');
    }

    // Get existing member
    const existingMember = await this.getMemberById(id);

    // Create member instance and deactivate using domain method
    const memberToDeactivate = new Member({
      id: existingMember.id,
      email: existingMember.email,
      username: existingMember.username,
      passwordHash: existingMember.passwordHash,
      firstName: existingMember.firstName,
      lastName: existingMember.lastName,
      isActive: existingMember.isActive,
      createdAt: existingMember.createdAt,
      updatedAt: existingMember.updatedAt,
      deletedAt: existingMember.deletedAt,
    });

    memberToDeactivate.deactivate();

    // Update in repository
    const updatedMemberRecord = await this.memberRepository.update(id, {
      isActive: false,
    });

    // Log member deactivation
    await this.auditService.logEntityUpdate(
      {
        entityType: 'Member',
        entityId: id,
        oldValues: {
          isActive: existingMember.isActive,
        },
        newValues: {
          isActive: false,
        },
        metadata: {
          updateType: 'deactivation',
        },
      },
      {
        actorType: ActorType.MEMBER,
        actorId: id,
        traceId: RequestContext.getTraceId(),
      },
    );

    return this.toDomainEntity(updatedMemberRecord);
  }

  async softDeleteMember(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('Member ID is required');
    }

    // Get existing member
    const existingMember = await this.getMemberById(id);

    // Create member instance and soft delete using domain method
    const memberToDelete = new Member({
      id: existingMember.id,
      email: existingMember.email,
      username: existingMember.username,
      passwordHash: existingMember.passwordHash,
      firstName: existingMember.firstName,
      lastName: existingMember.lastName,
      isActive: existingMember.isActive,
      createdAt: existingMember.createdAt,
      updatedAt: existingMember.updatedAt,
      deletedAt: existingMember.deletedAt,
    });

    memberToDelete.softDelete();

    // Perform soft delete in repository
    await this.memberRepository.softDelete(id);

    // Log member soft deletion
    await this.auditService.logEntityDeletion(
      {
        entityType: 'Member',
        entityId: id,
        oldValues: {
          email: existingMember.email,
          username: existingMember.username,
          firstName: existingMember.firstName,
          lastName: existingMember.lastName,
          isActive: existingMember.isActive,
        },
        metadata: {
          deletionType: 'soft_delete',
        },
      },
      {
        actorType: ActorType.MEMBER,
        actorId: id,
        traceId: RequestContext.getTraceId(),
      },
      true, // isSoftDelete
    );
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('Member ID is required');
    }

    if (!currentPassword || !newPassword) {
      throw new ValidationException('Current password and new password are required');
    }

    // Get existing member (including password hash for verification)
    const memberRecord = await this.memberRepository.findById(id);
    if (!memberRecord || !memberRecord.isActive || memberRecord.deletedAt) {
      throw new NotFoundExceptionDomain('Member', id);
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.verify(currentPassword, memberRecord.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationException(
        'New password does not meet strength requirements',
        { errors: passwordValidation.errors }
      );
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hash(newPassword);

    // Update password in repository
    await this.memberRepository.update(id, {
      passwordHash: newPasswordHash,
    });
  }

  private toDomainEntity(memberRecord: any): Member {
    return new Member({
      id: memberRecord.id,
      email: memberRecord.email,
      username: memberRecord.username,
      passwordHash: memberRecord.passwordHash,
      firstName: memberRecord.firstName,
      lastName: memberRecord.lastName,
      isActive: memberRecord.isActive,
      createdAt: memberRecord.createdAt,
      updatedAt: memberRecord.updatedAt,
      deletedAt: memberRecord.deletedAt || undefined,
    });
  }

  private validateRegistrationData(data: RegisterMemberData): void {
    if (!data.email || data.email.trim().length === 0) {
      throw new ValidationException('Email is required');
    }

    if (!data.username || data.username.trim().length === 0) {
      throw new ValidationException('Username is required');
    }

    if (!data.password) {
      throw new ValidationException('Password is required');
    }

    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new ValidationException('First name is required');
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new ValidationException('Last name is required');
    }

    // Validate email format using value object
    try {
      new Email(data.email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid email format';
      throw new ValidationException(`Invalid email: ${errorMessage}`);
    }

    // Validate username format
    if (data.username.length < 3) {
      throw new ValidationException('Username must be at least 3 characters long');
    }

    if (data.username.length > 50) {
      throw new ValidationException('Username cannot exceed 50 characters');
    }

    // Validate name lengths
    if (data.firstName.length > 100) {
      throw new ValidationException('First name cannot exceed 100 characters');
    }

    if (data.lastName.length > 100) {
      throw new ValidationException('Last name cannot exceed 100 characters');
    }
  }
}