import { TransactionHistory } from '../entities/transaction-history.entity';
import { TransactionType } from '@prisma/client';

describe('TransactionHistory Entity', () => {
  const mockTransactionHistoryData = {
    id: 'transaction-1',
    memberId: 'member-1',
    transactionType: TransactionType.POINT_EARNED,
    entityType: 'Point',
    entityId: 'point-1',
    amount: 100,
    description: 'Points earned from purchase',
    metadata: { orderId: 'order-123' },
    balanceBefore: 0,
    balanceAfter: 100,
    traceId: 'trace-123',
    createdAt: new Date(),
  };

  it('should create a transaction history instance', () => {
    const transaction = new TransactionHistory(mockTransactionHistoryData);

    expect(transaction.id).toBe(mockTransactionHistoryData.id);
    expect(transaction.memberId).toBe(mockTransactionHistoryData.memberId);
    expect(transaction.transactionType).toBe(mockTransactionHistoryData.transactionType);
    expect(transaction.entityType).toBe(mockTransactionHistoryData.entityType);
    expect(transaction.entityId).toBe(mockTransactionHistoryData.entityId);
    expect(transaction.amount).toBe(mockTransactionHistoryData.amount);
    expect(transaction.description).toBe(mockTransactionHistoryData.description);
    expect(transaction.metadata).toEqual(mockTransactionHistoryData.metadata);
    expect(transaction.balanceBefore).toBe(mockTransactionHistoryData.balanceBefore);
    expect(transaction.balanceAfter).toBe(mockTransactionHistoryData.balanceAfter);
    expect(transaction.traceId).toBe(mockTransactionHistoryData.traceId);
    expect(transaction.createdAt).toBe(mockTransactionHistoryData.createdAt);
  });

  describe('isPointTransaction', () => {
    it('should return true for point transaction types', () => {
      const pointTransactionTypes = [
        TransactionType.POINT_EARNED,
        TransactionType.POINT_DEDUCTED,
        TransactionType.POINT_EXPIRED,
        TransactionType.POINT_EXCHANGED,
      ];

      pointTransactionTypes.forEach(transactionType => {
        const transaction = new TransactionHistory({
          ...mockTransactionHistoryData,
          transactionType,
        });
        expect(transaction.isPointTransaction()).toBe(true);
      });
    });

    it('should return false for privilege transaction types', () => {
      const privilegeTransactionTypes = [
        TransactionType.PRIVILEGE_GRANTED,
        TransactionType.PRIVILEGE_EXPIRED,
        TransactionType.PRIVILEGE_REVOKED,
      ];

      privilegeTransactionTypes.forEach(transactionType => {
        const transaction = new TransactionHistory({
          ...mockTransactionHistoryData,
          transactionType,
        });
        expect(transaction.isPointTransaction()).toBe(false);
      });
    });
  });

  describe('isPrivilegeTransaction', () => {
    it('should return true for privilege transaction types', () => {
      const privilegeTransactionTypes = [
        TransactionType.PRIVILEGE_GRANTED,
        TransactionType.PRIVILEGE_EXPIRED,
        TransactionType.PRIVILEGE_REVOKED,
      ];

      privilegeTransactionTypes.forEach(transactionType => {
        const transaction = new TransactionHistory({
          ...mockTransactionHistoryData,
          transactionType,
        });
        expect(transaction.isPrivilegeTransaction()).toBe(true);
      });
    });

    it('should return false for point transaction types', () => {
      const pointTransactionTypes = [
        TransactionType.POINT_EARNED,
        TransactionType.POINT_DEDUCTED,
        TransactionType.POINT_EXPIRED,
        TransactionType.POINT_EXCHANGED,
      ];

      pointTransactionTypes.forEach(transactionType => {
        const transaction = new TransactionHistory({
          ...mockTransactionHistoryData,
          transactionType,
        });
        expect(transaction.isPrivilegeTransaction()).toBe(false);
      });
    });
  });

  describe('isDebitTransaction', () => {
    it('should return true for debit transaction types', () => {
      const debitTypes = [
        TransactionType.POINT_DEDUCTED,
        TransactionType.POINT_EXPIRED,
        TransactionType.POINT_EXCHANGED,
      ];

      debitTypes.forEach(transactionType => {
        const transaction = new TransactionHistory({
          ...mockTransactionHistoryData,
          transactionType,
        });
        expect(transaction.isDebitTransaction()).toBe(true);
      });
    });

    it('should return false for credit transaction types', () => {
      const transaction = new TransactionHistory({
        ...mockTransactionHistoryData,
        transactionType: TransactionType.POINT_EARNED,
      });
      expect(transaction.isDebitTransaction()).toBe(false);
    });
  });

  describe('isCreditTransaction', () => {
    it('should return true for credit transaction type', () => {
      const transaction = new TransactionHistory({
        ...mockTransactionHistoryData,
        transactionType: TransactionType.POINT_EARNED,
      });
      expect(transaction.isCreditTransaction()).toBe(true);
    });

    it('should return false for debit transaction types', () => {
      const debitTypes = [
        TransactionType.POINT_DEDUCTED,
        TransactionType.POINT_EXPIRED,
        TransactionType.POINT_EXCHANGED,
      ];

      debitTypes.forEach(transactionType => {
        const transaction = new TransactionHistory({
          ...mockTransactionHistoryData,
          transactionType,
        });
        expect(transaction.isCreditTransaction()).toBe(false);
      });
    });
  });

  describe('getBalanceChange', () => {
    it('should return correct balance change when both balances are provided', () => {
      const transaction = new TransactionHistory({
        ...mockTransactionHistoryData,
        balanceBefore: 50,
        balanceAfter: 150,
      });
      expect(transaction.getBalanceChange()).toBe(100);
    });

    it('should return negative balance change for deductions', () => {
      const transaction = new TransactionHistory({
        ...mockTransactionHistoryData,
        balanceBefore: 150,
        balanceAfter: 50,
      });
      expect(transaction.getBalanceChange()).toBe(-100);
    });

    it('should return undefined when balance information is missing', () => {
      const transaction = new TransactionHistory({
        ...mockTransactionHistoryData,
        balanceBefore: undefined,
        balanceAfter: undefined,
      });
      expect(transaction.getBalanceChange()).toBeUndefined();
    });

    it('should return undefined when only one balance is provided', () => {
      const transaction = new TransactionHistory({
        ...mockTransactionHistoryData,
        balanceBefore: 50,
        balanceAfter: undefined,
      });
      expect(transaction.getBalanceChange()).toBeUndefined();
    });
  });

  describe('getTransactionDescription', () => {
    it('should return correct descriptions for all transaction types', () => {
      const transactionDescriptions = [
        { type: TransactionType.POINT_EARNED, description: 'Points earned' },
        { type: TransactionType.POINT_DEDUCTED, description: 'Points deducted' },
        { type: TransactionType.POINT_EXPIRED, description: 'Points expired' },
        { type: TransactionType.POINT_EXCHANGED, description: 'Points exchanged' },
        { type: TransactionType.PRIVILEGE_GRANTED, description: 'Privilege granted' },
        { type: TransactionType.PRIVILEGE_EXPIRED, description: 'Privilege expired' },
        { type: TransactionType.PRIVILEGE_REVOKED, description: 'Privilege revoked' },
      ];

      transactionDescriptions.forEach(({ type, description }) => {
        const transaction = new TransactionHistory({
          ...mockTransactionHistoryData,
          transactionType: type,
        });
        expect(transaction.getTransactionDescription()).toBe(description);
      });
    });
  });
});