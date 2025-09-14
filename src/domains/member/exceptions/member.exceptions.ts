import { DomainException } from '@/common/exceptions/domain.exception';

export class MemberAlreadyExistsException extends DomainException {
  readonly code = 'MEMBER_ALREADY_EXISTS';
  
  constructor(identifier: string, type: 'email' | 'username') {
    super(`Member with ${type} '${identifier}' already exists`);
  }
}

export class MemberNotFoundException extends DomainException {
  readonly code = 'MEMBER_NOT_FOUND';
  
  constructor(identifier: string) {
    super(`Member with identifier '${identifier}' not found`);
  }
}

export class MemberInactiveException extends DomainException {
  readonly code = 'MEMBER_INACTIVE';
  
  constructor(memberId: string) {
    super(`Member '${memberId}' is inactive or deleted`);
  }
}

export class InvalidCredentialsException extends DomainException {
  readonly code = 'INVALID_CREDENTIALS';
  
  constructor(message: string = 'Invalid credentials provided') {
    super(message);
  }
}

export class WeakPasswordException extends DomainException {
  readonly code = 'WEAK_PASSWORD';
  
  constructor(errors: string[]) {
    super(`Password does not meet strength requirements: ${errors.join(', ')}`);
    this.details = { errors };
  }
  
  public readonly details: { errors: string[] };
}

export class PasswordMismatchException extends DomainException {
  readonly code = 'PASSWORD_MISMATCH';
  
  constructor() {
    super('Current password is incorrect');
  }
}

export class MemberProfileUpdateException extends DomainException {
  readonly code = 'MEMBER_PROFILE_UPDATE_FAILED';
  
  constructor(reason: string) {
    super(`Failed to update member profile: ${reason}`);
  }
}