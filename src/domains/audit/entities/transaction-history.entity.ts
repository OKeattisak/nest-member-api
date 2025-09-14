import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface TransactionHistoryData {
  id: string;
  memberId: string;
  transactionType: TransactionType;
  entityType: string;
  entityId: string;
  amount?: number;
  description: string;
  metadata?: Record<string, any>;
  balanceBefore?: number;
  balanceAfter?: number;
  traceId?: string;
  createdAt: Date;
}

export class TransactionHistory {
  public readonly id: string;
  public readonly memberId: string;
  public readonly transactionType: TransactionType;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly amount?: number;
  public readonly description: string;
  public readonly metadata?: Record<string, any>;
  public readonly balanceBefore?: number;
  public readonly balanceAfter?: number;
  public readonly traceId?: string;
  public readonly createdAt: Date;

  constructor(data: TransactionHistoryData) {
    this.id = data.id;
    this.memberId = data.memberId;
    this.transactionType = data.transactionType;
    this.entityType = data.entityType;
    this.entityId = data.entityId;
    this.amount = data.amount;
    this.description = data.description;
    this.metadata = data.metadata;
    this.balanceBefore = data.balanceBefore;
    this.balanceAfter = data.balanceAfter;
    this.traceId = data.traceId;
    this.createdAt = data.createdAt;
  }

  /**
   * Check if this is a point-related transaction
   */
  isPointTransaction(): boolean {
    const pointTransactionTypes: TransactionType[] = [
      TransactionType.POINT_EARNED,
      TransactionType.POINT_DEDUCTED,
      TransactionType.POINT_EXPIRED,
      TransactionType.POINT_EXCHANGED,
    ];
    return pointTransactionTypes.includes(this.transactionType);
  }

  /**
   * Check if this is a privilege-related transaction
   */
  isPrivilegeTransaction(): boolean {
    const privilegeTransactionTypes: TransactionType[] = [
      TransactionType.PRIVILEGE_GRANTED,
      TransactionType.PRIVILEGE_EXPIRED,
      TransactionType.PRIVILEGE_REVOKED,
    ];
    return privilegeTransactionTypes.includes(this.transactionType);
  }

  /**
   * Check if this transaction resulted in a point balance decrease
   */
  isDebitTransaction(): boolean {
    const debitTypes: TransactionType[] = [
      TransactionType.POINT_DEDUCTED,
      TransactionType.POINT_EXPIRED,
      TransactionType.POINT_EXCHANGED,
    ];
    return debitTypes.includes(this.transactionType);
  }

  /**
   * Check if this transaction resulted in a point balance increase
   */
  isCreditTransaction(): boolean {
    return this.transactionType === TransactionType.POINT_EARNED;
  }

  /**
   * Get the net effect on point balance
   */
  getBalanceChange(): number | undefined {
    if (this.balanceBefore !== undefined && this.balanceAfter !== undefined) {
      return this.balanceAfter - this.balanceBefore;
    }
    return undefined;
  }

  /**
   * Get a human-readable description of the transaction
   */
  getTransactionDescription(): string {
    const descriptions: Record<TransactionType, string> = {
      [TransactionType.POINT_EARNED]: 'Points earned',
      [TransactionType.POINT_DEDUCTED]: 'Points deducted',
      [TransactionType.POINT_EXPIRED]: 'Points expired',
      [TransactionType.POINT_EXCHANGED]: 'Points exchanged',
      [TransactionType.PRIVILEGE_GRANTED]: 'Privilege granted',
      [TransactionType.PRIVILEGE_EXPIRED]: 'Privilege expired',
      [TransactionType.PRIVILEGE_REVOKED]: 'Privilege revoked',
    };
    return descriptions[this.transactionType] || 'Unknown transaction';
  }
}