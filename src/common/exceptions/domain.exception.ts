export abstract class DomainException extends Error {
  abstract readonly code: string;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationException extends DomainException {
  readonly code = 'VALIDATION_ERROR';
  
  constructor(message: string, public readonly details?: any) {
    super(message);
  }
}

export class NotFoundExceptionDomain extends DomainException {
  readonly code = 'NOT_FOUND';
  
  constructor(resource: string, identifier?: string) {
    super(identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`);
  }
}

export class UnauthorizedException extends DomainException {
  readonly code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

export class ForbiddenException extends DomainException {
  readonly code = 'FORBIDDEN';
  
  constructor(message: string = 'Access forbidden') {
    super(message);
  }
}

export class ConflictException extends DomainException {
  readonly code = 'CONFLICT';
  
  constructor(message: string) {
    super(message);
  }
}

export class BusinessRuleException extends DomainException {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  
  constructor(message: string) {
    super(message);
  }
}