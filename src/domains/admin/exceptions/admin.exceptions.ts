import { DomainException } from '@/common/exceptions/domain.exception';

export class AdminNotFoundException extends DomainException {
  readonly code = 'ADMIN_NOT_FOUND';
  
  constructor(identifier: string) {
    super(`Admin with identifier '${identifier}' not found`);
  }
}

export class AdminAlreadyExistsException extends DomainException {
  readonly code = 'ADMIN_ALREADY_EXISTS';
  
  constructor(identifier: string, type: 'email' | 'username') {
    super(`Admin with ${type} '${identifier}' already exists`);
  }
}

export class AdminInactiveException extends DomainException {
  readonly code = 'ADMIN_INACTIVE';
  
  constructor(adminId: string) {
    super(`Admin '${adminId}' is inactive`);
  }
}

export class InvalidAdminCredentialsException extends DomainException {
  readonly code = 'INVALID_ADMIN_CREDENTIALS';
  
  constructor() {
    super('Invalid admin credentials provided');
  }
}

export class InsufficientAdminPrivilegesException extends DomainException {
  readonly code = 'INSUFFICIENT_ADMIN_PRIVILEGES';
  
  constructor(requiredRole: string, currentRole: string) {
    super(`Insufficient privileges. Required: ${requiredRole}, Current: ${currentRole}`);
    this.details = { requiredRole, currentRole };
  }
  
  public readonly details: { requiredRole: string; currentRole: string };
}