import {
  InsufficientPointsException,
  InvalidPointAmountException,
  PointTransactionFailedException,
  PointExpirationException,
  InvalidExpirationDateException,
  PointHistoryNotFoundException,
} from '../point.exceptions';

describe('Point Domain Exceptions', () => {
  describe('InsufficientPointsException', () => {
    it('should create exception with required and available amounts', () => {
      const exception = new InsufficientPointsException(100, 50);
      
      expect(exception.message).toBe('Insufficient points. Required: 100, Available: 50');
      expect(exception.code).toBe('INSUFFICIENT_POINTS');
      expect(exception.details).toEqual({
        required: 100,
        available: 50,
        deficit: 50,
      });
    });
  });

  describe('InvalidPointAmountException', () => {
    it('should create exception with amount and reason', () => {
      const exception = new InvalidPointAmountException(-10, 'Amount cannot be negative');
      
      expect(exception.message).toBe("Invalid point amount '-10': Amount cannot be negative");
      expect(exception.code).toBe('INVALID_POINT_AMOUNT');
      expect(exception.details).toEqual({
        amount: -10,
        reason: 'Amount cannot be negative',
      });
    });
  });

  describe('PointTransactionFailedException', () => {
    it('should create exception with transaction details', () => {
      const exception = new PointTransactionFailedException('deduction', 'member-123', 50, 'Database error');
      
      expect(exception.message).toBe("Point deduction failed for member 'member-123': Database error");
      expect(exception.code).toBe('POINT_TRANSACTION_FAILED');
      expect(exception.details).toEqual({
        operation: 'deduction',
        memberId: 'member-123',
        amount: 50,
        reason: 'Database error',
      });
    });
  });

  describe('PointExpirationException', () => {
    it('should create exception with reason', () => {
      const exception = new PointExpirationException('Job failed');
      
      expect(exception.message).toBe('Point expiration processing failed: Job failed');
      expect(exception.code).toBe('POINT_EXPIRATION_ERROR');
    });
  });

  describe('InvalidExpirationDateException', () => {
    it('should create exception with invalid date', () => {
      const pastDate = new Date('2020-01-01');
      const exception = new InvalidExpirationDateException(pastDate);
      
      expect(exception.message).toBe('Invalid expiration date: 2020-01-01T00:00:00.000Z. Date must be in the future');
      expect(exception.code).toBe('INVALID_EXPIRATION_DATE');
      expect(exception.details).toEqual({
        providedDate: '2020-01-01T00:00:00.000Z',
      });
    });
  });

  describe('PointHistoryNotFoundException', () => {
    it('should create exception with member ID', () => {
      const exception = new PointHistoryNotFoundException('member-123');
      
      expect(exception.message).toBe("No point history found for member 'member-123'");
      expect(exception.code).toBe('POINT_HISTORY_NOT_FOUND');
    });
  });

  describe('Exception inheritance', () => {
    it('should extend Error correctly', () => {
      const exception = new InsufficientPointsException(100, 50);
      
      expect(exception).toBeInstanceOf(Error);
      expect(exception.stack).toBeDefined();
    });

    it('should have correct name property', () => {
      const exception = new PointTransactionFailedException('test', 'member', 10, 'reason');
      
      expect(exception.name).toBe('PointTransactionFailedException');
    });
  });
});