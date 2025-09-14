import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

// Email uniqueness validator
@ValidatorConstraint({ name: 'isEmailUnique', async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    if (!email) return true; // Let other validators handle empty values

    const existingMember = await this.prisma.member.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    return !existingMember;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Email is already registered';
  }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailUniqueConstraint,
    });
  };
}

// Username uniqueness validator
@ValidatorConstraint({ name: 'isUsernameUnique', async: true })
@Injectable()
export class IsUsernameUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(username: string, args: ValidationArguments): Promise<boolean> {
    if (!username) return true; // Let other validators handle empty values

    const existingMember = await this.prisma.member.findUnique({
      where: { username: username.trim() },
    });

    return !existingMember;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Username is already taken';
  }
}

export function IsUsernameUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUsernameUniqueConstraint,
    });
  };
}

// Strong password validator
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Check minimum length
    if (password.length < 8) {
      return false;
    }

    // Check maximum length
    if (password.length > 128) {
      return false;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      return false;
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Point amount validator
@ValidatorConstraint({ name: 'isValidPointAmount', async: false })
export class IsValidPointAmountConstraint implements ValidatorConstraintInterface {
  validate(amount: number, args: ValidationArguments): boolean {
    if (typeof amount !== 'number') {
      return false;
    }

    if (isNaN(amount) || !isFinite(amount)) {
      return false;
    }

    if (amount <= 0) {
      return false;
    }

    if (amount > 999999.99) {
      return false;
    }

    // Check decimal places
    const amountStr = amount.toString();
    if (amountStr.includes('.')) {
      const decimalPart = amountStr.split('.')[1];
      if (decimalPart && decimalPart.length > 2) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Point amount must be a positive number with at most 2 decimal places and cannot exceed 999,999.99';
  }
}

export function IsValidPointAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPointAmountConstraint,
    });
  };
}

// Member exists validator
@ValidatorConstraint({ name: 'memberExists', async: true })
@Injectable()
export class MemberExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(memberId: string, args: ValidationArguments): Promise<boolean> {
    if (!memberId) return false;

    const member = await this.prisma.member.findUnique({
      where: { id: memberId, isActive: true, deletedAt: null },
    });

    return !!member;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Member not found or inactive';
  }
}

export function MemberExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: MemberExistsConstraint,
    });
  };
}

// Privilege exists validator
@ValidatorConstraint({ name: 'privilegeExists', async: true })
@Injectable()
export class PrivilegeExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(privilegeId: string, args: ValidationArguments): Promise<boolean> {
    if (!privilegeId) return false;

    const privilege = await this.prisma.privilege.findUnique({
      where: { id: privilegeId, isActive: true },
    });

    return !!privilege;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Privilege not found or inactive';
  }
}

export function PrivilegeExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PrivilegeExistsConstraint,
    });
  };
}