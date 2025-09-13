import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../member.service';
import { IMemberRepository } from '../../repositories/member.repository.interface';
import { PasswordService } from '../../../../infrastructure/auth/password.service';
import { Member } from '../../entities/member.entity';
import {
  ConflictException,
  NotFoundExceptionDomain,
  ValidationException,
  UnauthorizedException,
} from '../../../../common/exceptions/domain.exception';

describe('MemberService', () => {
  let service: MemberService;
  let memberRepository: jest.Mocked<IMemberRepository>;
  let passwordService: jest.Mocked<PasswordService>;

  const mockMemberRecord = {
    id: 'member-1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockMemberRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findMany: jest.fn(),
      findActiveById: jest.fn(),
      existsByEmail: jest.fn(),
      existsByUsername: jest.fn(),
    };

    const mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
      validatePasswordStrength: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: 'IMemberRepository',
          useValue: mockMemberRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    memberRepository = module.get('IMemberRepository');
    passwordService = module.get(PasswordService);
  });

  describe('registerMember', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'StrongPass123!',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should successfully register a new member', async () => {
      // Arrange
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      memberRepository.findByEmail.mockResolvedValue(null);
      memberRepository.findByUsername.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed-password');
      memberRepository.create.mockResolvedValue({
        ...mockMemberRecord,
        id: 'new-member-id',
        email: validRegistrationData.email,
        username: validRegistrationData.username,
        firstName: validRegistrationData.firstName,
        lastName: validRegistrationData.lastName,
      });

      // Act
      const result = await service.registerMember(validRegistrationData);

      // Assert
      expect(result).toBeInstanceOf(Member);
      expect(result.email).toBe(validRegistrationData.email);
      expect(result.username).toBe(validRegistrationData.username);
      expect(result.firstName).toBe(validRegistrationData.firstName);
      expect(result.lastName).toBe(validRegistrationData.lastName);
      expect(passwordService.hash).toHaveBeenCalledWith(validRegistrationData.password);
      expect(memberRepository.create).toHaveBeenCalledWith({
        email: validRegistrationData.email,
        username: validRegistrationData.username,
        passwordHash: 'hashed-password',
        firstName: validRegistrationData.firstName,
        lastName: validRegistrationData.lastName,
      });
    });

    it('should throw ValidationException for invalid email', async () => {
      // Arrange
      const invalidData = { ...validRegistrationData, email: 'invalid-email' };

      // Act & Assert
      await expect(service.registerMember(invalidData)).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for weak password', async () => {
      // Arrange
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      // Act & Assert
      await expect(service.registerMember(validRegistrationData)).rejects.toThrow(ValidationException);
    });

    it('should throw ConflictException for existing email', async () => {
      // Arrange
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      memberRepository.findByEmail.mockResolvedValue(mockMemberRecord);

      // Act & Assert
      await expect(service.registerMember(validRegistrationData)).rejects.toThrow(ConflictException);
      expect(memberRepository.findByEmail).toHaveBeenCalledWith(validRegistrationData.email);
    });

    it('should throw ConflictException for existing username', async () => {
      // Arrange
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      memberRepository.findByEmail.mockResolvedValue(null);
      memberRepository.findByUsername.mockResolvedValue(mockMemberRecord);

      // Act & Assert
      await expect(service.registerMember(validRegistrationData)).rejects.toThrow(ConflictException);
      expect(memberRepository.findByUsername).toHaveBeenCalledWith(validRegistrationData.username);
    });

    it('should throw ValidationException for missing required fields', async () => {
      // Arrange
      const invalidData = { ...validRegistrationData, firstName: '' };

      // Act & Assert
      await expect(service.registerMember(invalidData)).rejects.toThrow(ValidationException);
    });
  });

  describe('authenticateMember', () => {
    const authData = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    };

    it('should successfully authenticate member with email', async () => {
      // Arrange
      memberRepository.findByEmail.mockResolvedValue(mockMemberRecord);
      passwordService.verify.mockResolvedValue(true);

      // Act
      const result = await service.authenticateMember(authData);

      // Assert
      expect(result.isAuthenticated).toBe(true);
      expect(result.member).toBeInstanceOf(Member);
      expect(result.member.email).toBe(mockMemberRecord.email);
      expect(memberRepository.findByEmail).toHaveBeenCalledWith(authData.emailOrUsername);
      expect(passwordService.verify).toHaveBeenCalledWith(authData.password, mockMemberRecord.passwordHash);
    });

    it('should successfully authenticate member with username', async () => {
      // Arrange
      memberRepository.findByEmail.mockResolvedValue(null);
      memberRepository.findByUsername.mockResolvedValue(mockMemberRecord);
      passwordService.verify.mockResolvedValue(true);

      // Act
      const result = await service.authenticateMember({
        emailOrUsername: 'testuser',
        password: 'password123',
      });

      // Assert
      expect(result.isAuthenticated).toBe(true);
      expect(result.member).toBeInstanceOf(Member);
      expect(memberRepository.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should throw UnauthorizedException for non-existent member', async () => {
      // Arrange
      memberRepository.findByEmail.mockResolvedValue(null);
      memberRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(service.authenticateMember(authData)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive member', async () => {
      // Arrange
      const inactiveMember = { ...mockMemberRecord, isActive: false };
      memberRepository.findByEmail.mockResolvedValue(inactiveMember);

      // Act & Assert
      await expect(service.authenticateMember(authData)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for deleted member', async () => {
      // Arrange
      const deletedMember = { ...mockMemberRecord, deletedAt: new Date() };
      memberRepository.findByEmail.mockResolvedValue(deletedMember);

      // Act & Assert
      await expect(service.authenticateMember(authData)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      memberRepository.findByEmail.mockResolvedValue(mockMemberRecord);
      passwordService.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(service.authenticateMember(authData)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ValidationException for missing credentials', async () => {
      // Act & Assert
      await expect(service.authenticateMember({
        emailOrUsername: '',
        password: 'password123',
      })).rejects.toThrow(ValidationException);

      await expect(service.authenticateMember({
        emailOrUsername: 'test@example.com',
        password: '',
      })).rejects.toThrow(ValidationException);
    });
  });

  describe('getMemberById', () => {
    it('should successfully get member by id', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(mockMemberRecord);

      // Act
      const result = await service.getMemberById('member-1');

      // Assert
      expect(result).toBeInstanceOf(Member);
      expect(result.id).toBe(mockMemberRecord.id);
      expect(memberRepository.findActiveById).toHaveBeenCalledWith('member-1');
    });

    it('should throw NotFoundExceptionDomain for non-existent member', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getMemberById('non-existent')).rejects.toThrow(NotFoundExceptionDomain);
    });

    it('should throw ValidationException for empty id', async () => {
      // Act & Assert
      await expect(service.getMemberById('')).rejects.toThrow(ValidationException);
      await expect(service.getMemberById('   ')).rejects.toThrow(ValidationException);
    });
  });

  describe('updateMemberProfile', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      username: 'updateduser',
    };

    it('should successfully update member profile', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(mockMemberRecord);
      memberRepository.findByUsername.mockResolvedValue(null);
      const updatedRecord = { ...mockMemberRecord, ...updateData };
      memberRepository.update.mockResolvedValue(updatedRecord);

      // Act
      const result = await service.updateMemberProfile('member-1', updateData);

      // Assert
      expect(result).toBeInstanceOf(Member);
      expect(result.firstName).toBe(updateData.firstName);
      expect(result.lastName).toBe(updateData.lastName);
      expect(result.username).toBe(updateData.username);
      expect(memberRepository.update).toHaveBeenCalledWith('member-1', updateData);
    });

    it('should throw ConflictException for existing username', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(mockMemberRecord);
      memberRepository.findByUsername.mockResolvedValue({
        ...mockMemberRecord,
        id: 'different-id',
        username: updateData.username,
      });

      // Act & Assert
      await expect(service.updateMemberProfile('member-1', updateData)).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same username', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(mockMemberRecord);
      memberRepository.findByUsername.mockResolvedValue(mockMemberRecord);
      const updatedRecord = { ...mockMemberRecord, firstName: 'Updated' };
      memberRepository.update.mockResolvedValue(updatedRecord);

      // Act
      const result = await service.updateMemberProfile('member-1', {
        firstName: 'Updated',
        username: mockMemberRecord.username,
      });

      // Assert
      expect(result.firstName).toBe('Updated');
    });

    it('should throw ValidationException for empty id', async () => {
      // Act & Assert
      await expect(service.updateMemberProfile('', updateData)).rejects.toThrow(ValidationException);
    });
  });

  describe('deactivateMember', () => {
    it('should successfully deactivate member', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(mockMemberRecord);
      const deactivatedRecord = { ...mockMemberRecord, isActive: false };
      memberRepository.update.mockResolvedValue(deactivatedRecord);

      // Act
      const result = await service.deactivateMember('member-1');

      // Assert
      expect(result).toBeInstanceOf(Member);
      expect(result.isActive).toBe(false);
      expect(memberRepository.update).toHaveBeenCalledWith('member-1', { isActive: false });
    });

    it('should throw ValidationException for empty id', async () => {
      // Act & Assert
      await expect(service.deactivateMember('')).rejects.toThrow(ValidationException);
    });

    it('should throw NotFoundExceptionDomain for non-existent member', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deactivateMember('non-existent')).rejects.toThrow(NotFoundExceptionDomain);
    });
  });

  describe('softDeleteMember', () => {
    it('should successfully soft delete member', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(mockMemberRecord);
      memberRepository.softDelete.mockResolvedValue(undefined);

      // Act
      await service.softDeleteMember('member-1');

      // Assert
      expect(memberRepository.softDelete).toHaveBeenCalledWith('member-1');
    });

    it('should throw ValidationException for empty id', async () => {
      // Act & Assert
      await expect(service.softDeleteMember('')).rejects.toThrow(ValidationException);
    });

    it('should throw NotFoundExceptionDomain for non-existent member', async () => {
      // Arrange
      memberRepository.findActiveById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.softDeleteMember('non-existent')).rejects.toThrow(NotFoundExceptionDomain);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      // Arrange
      memberRepository.findById.mockResolvedValue(mockMemberRecord);
      passwordService.verify.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hash.mockResolvedValue('new-hashed-password');
      memberRepository.update.mockResolvedValue({
        ...mockMemberRecord,
        passwordHash: 'new-hashed-password',
      });

      // Act
      await service.changePassword('member-1', 'currentPassword', 'NewStrongPass123!');

      // Assert
      expect(passwordService.verify).toHaveBeenCalledWith('currentPassword', mockMemberRecord.passwordHash);
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith('NewStrongPass123!');
      expect(passwordService.hash).toHaveBeenCalledWith('NewStrongPass123!');
      expect(memberRepository.update).toHaveBeenCalledWith('member-1', {
        passwordHash: 'new-hashed-password',
      });
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      // Arrange
      memberRepository.findById.mockResolvedValue(mockMemberRecord);
      passwordService.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(service.changePassword('member-1', 'wrongPassword', 'NewStrongPass123!')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ValidationException for weak new password', async () => {
      // Arrange
      memberRepository.findById.mockResolvedValue(mockMemberRecord);
      passwordService.verify.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      // Act & Assert
      await expect(service.changePassword('member-1', 'currentPassword', 'weakpass')).rejects.toThrow(ValidationException);
    });

    it('should throw NotFoundExceptionDomain for non-existent member', async () => {
      // Arrange
      memberRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changePassword('non-existent', 'currentPassword', 'NewStrongPass123!')).rejects.toThrow(NotFoundExceptionDomain);
    });

    it('should throw ValidationException for missing parameters', async () => {
      // Act & Assert
      await expect(service.changePassword('', 'currentPassword', 'NewStrongPass123!')).rejects.toThrow(ValidationException);
      await expect(service.changePassword('member-1', '', 'NewStrongPass123!')).rejects.toThrow(ValidationException);
      await expect(service.changePassword('member-1', 'currentPassword', '')).rejects.toThrow(ValidationException);
    });
  });
});