import { DomainException } from '@/common/exceptions/domain.exception';

export class InsufficientPointsException extends DomainException {
  readonly code = 'INSUFFICIENT_POINTS';
  
  constructor(required: number, available: number) {
    super(`Insufficient points. Required: ${required}, Available: ${available}`);
    this.details = { required, available, deficit: required - available };
  }
  
  public readonly details: { required: number; available: number; deficit: number };
}

export class InvalidPointAmountException extends DomainException {
  readonly code = 'INVALID_POINT_AMOUNT';
  
  constructor(amount: number, reason: string) {
    super(`Invalid point amount '${amount}': ${reason}`);
    this.details = { amount, reason };
  }
  
  public readonly details: { amount: number; reason: string };
}

export class PointTransactionFailedException extends DomainException {
  readonly code = 'POINT_TRANSACTION_FAILED';
  
  constructor(operation: string, memberId: string, amount: number, reason: string) {
    super(`Point ${operation} failed for member '${memberId}': ${reason}`);
    this.details = { operation, memberId, amount, reason };
  }
  
  public readonly details: { operation: string; memberId: string; amount: number; reason: string };
}

export class PointExpirationException extends DomainException {
  readonly code = 'POINT_EXPIRATION_ERROR';
  
  constructor(reason: string) {
    super(`Point expiration processing failed: ${reason}`);
  }
}

export class InvalidExpirationDateException extends DomainException {
  readonly code = 'INVALID_EXPIRATION_DATE';
  
  constructor(date: Date) {
    super(`Invalid expiration date: ${date.toISOString()}. Date must be in the future`);
    this.details = { providedDate: date.toISOString() };
  }
  
  public readonly details: { providedDate: string };
}

export class PointHistoryNotFoundException extends DomainException {
  readonly code = 'POINT_HISTORY_NOT_FOUND';
  
  constructor(memberId: string) {
    super(`No point history found for member '${memberId}'`);
  }
}