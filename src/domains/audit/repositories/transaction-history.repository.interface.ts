import { TransactionType } from '@prisma/client';
import { TransactionHistory } from '../entities/transaction-history.entity';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';

export interface CreateTransactionHistoryData {
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
}

export interface TransactionHistoryFilters {
  memberId?: string;
  transactionType?: TransactionType;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

export interface ITransactionHistoryRepository {
  /**
   * Create a new transaction history record
   */
  create(data: CreateTransactionHistoryData): Promise<TransactionHistory>;

  /**
   * Create multiple transaction history records
   */
  createMany(data: CreateTransactionHistoryData[]): Promise<TransactionHistory[]>;

  /**
   * Find transaction history by member ID
   */
  findByMemberId(memberId: string, pagination?: PaginationOptions): Promise<PaginatedResult<TransactionHistory>>;

  /**
   * Find transaction history by transaction type
   */
  findByTransactionType(transactionType: TransactionType, pagination?: PaginationOptions): Promise<PaginatedResult<TransactionHistory>>;

  /**
   * Find transaction history with filters
   */
  findWithFilters(filters: TransactionHistoryFilters, pagination?: PaginationOptions): Promise<PaginatedResult<TransactionHistory>>;

  /**
   * Find transaction history by entity
   */
  findByEntity(entityType: string, entityId: string, pagination?: PaginationOptions): Promise<PaginatedResult<TransactionHistory>>;

  /**
   * Get member transaction summary
   */
  getMemberTransactionSummary(memberId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalTransactions: number;
    pointsEarned: number;
    pointsDeducted: number;
    pointsExpired: number;
    pointsExchanged: number;
    privilegesGranted: number;
    privilegesExpired: number;
    privilegesRevoked: number;
    transactionTypeCounts: Record<TransactionType, number>;
  }>;

  /**
   * Get transaction statistics
   */
  getStatistics(dateFrom: Date, dateTo: Date): Promise<{
    totalTransactions: number;
    totalMembers: number;
    transactionTypeCounts: Record<TransactionType, number>;
    entityTypeCounts: Record<string, number>;
    totalPointsTransacted: number;
    averageTransactionAmount: number;
  }>;

  /**
   * Find large transactions (above threshold)
   */
  findLargeTransactions(amountThreshold: number, dateFrom?: Date, dateTo?: Date, pagination?: PaginationOptions): Promise<PaginatedResult<TransactionHistory>>;
}