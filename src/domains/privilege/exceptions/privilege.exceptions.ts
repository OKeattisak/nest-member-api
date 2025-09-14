import { DomainException } from '../../../common/exceptions/domain.exception';

export class PrivilegeNotFoundException extends DomainException {
  readonly code = 'PRIVILEGE_NOT_FOUND';
  
  constructor(identifier: string) {
    super(`Privilege with identifier '${identifier}' not found`);
  }
}

export class PrivilegeAlreadyExistsException extends DomainException {
  readonly code = 'PRIVILEGE_ALREADY_EXISTS';
  
  constructor(name: string) {
    super(`Privilege with name '${name}' already exists`);
  }
}

export class PrivilegeNotAvailableException extends DomainException {
  readonly code = 'PRIVILEGE_NOT_AVAILABLE';
  
  constructor(privilegeName: string, reason: string) {
    super(`Privilege '${privilegeName}' is not available: ${reason}`);
    this.details = { privilegeName, reason };
  }
  
  public readonly details: { privilegeName: string; reason: string };
}

export class PrivilegeAlreadyOwnedException extends DomainException {
  readonly code = 'PRIVILEGE_ALREADY_OWNED';
  
  constructor(privilegeName: string, memberId: string) {
    super(`Member '${memberId}' already owns privilege '${privilegeName}'`);
    this.details = { privilegeName, memberId };
  }
  
  public readonly details: { privilegeName: string; memberId: string };
}

export class PrivilegeExchangeFailedException extends DomainException {
  readonly code = 'PRIVILEGE_EXCHANGE_FAILED';
  
  constructor(privilegeName: string, memberId: string, reason: string) {
    super(`Failed to exchange privilege '${privilegeName}' for member '${memberId}': ${reason}`);
    this.details = { privilegeName, memberId, reason };
  }
  
  public readonly details: { privilegeName: string; memberId: string; reason: string };
}

export class InvalidPrivilegeCostException extends DomainException {
  readonly code = 'INVALID_PRIVILEGE_COST';
  
  constructor(cost: number, reason: string) {
    super(`Invalid privilege cost '${cost}': ${reason}`);
    this.details = { cost, reason };
  }
  
  public readonly details: { cost: number; reason: string };
}

export class MemberPrivilegeNotFoundException extends DomainException {
  readonly code = 'MEMBER_PRIVILEGE_NOT_FOUND';
  
  constructor(memberPrivilegeId: string) {
    super(`Member privilege with ID '${memberPrivilegeId}' not found`);
  }
}

export class MemberPrivilegeAlreadyInactiveException extends DomainException {
  readonly code = 'MEMBER_PRIVILEGE_ALREADY_INACTIVE';
  
  constructor(memberPrivilegeId: string) {
    super(`Member privilege '${memberPrivilegeId}' is already inactive`);
  }
}

export class PrivilegeExpirationException extends DomainException {
  readonly code = 'PRIVILEGE_EXPIRATION_ERROR';
  
  constructor(reason: string) {
    super(`Privilege expiration processing failed: ${reason}`);
  }
}