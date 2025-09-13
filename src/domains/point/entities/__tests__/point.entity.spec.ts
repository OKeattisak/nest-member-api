import { Point, PointProps, PointType } from '../point.entity';

describe('Point Entity', () => {
  const basePointProps: PointProps = {
    id: 'point-123',
    memberId: 'member-123',
    amount: 100,
    type: PointType.EARNED,
    description: 'Test points',
    expiresAt: new Date('2024-12-31'),
    isExpired: false,
    createdAt: new Date('2023-01-01')
  };

  describe('constructor', () => {
    it('should create a valid point', () => {
      const point = new Point(basePointProps);
      expect(point.id).toBe('point-123');
      expect(point.memberId).toBe('member-123');
      expect(point.amount).toBe(100);
      expect(point.type).toBe(PointType.EARNED);
      expect(point.description).toBe('Test points');
      expect(point.isExpired).toBe(false);
    });

    it('should store amount as absolute value', () => {
      const props = { ...basePointProps, amount: -100 };
      const point = new Point(props);
      expect(point.amount).toBe(100);
    });

    it('should throw error for empty ID', () => {
      const props = { ...basePointProps, id: '' };
      expect(() => new Point(props)).toThrow('Point ID is required');
    });

    it('should throw error for empty member ID', () => {
      const props = { ...basePointProps, memberId: '' };
      expect(() => new Point(props)).toThrow('Member ID is required');
    });

    it('should throw error for empty description', () => {
      const props = { ...basePointProps, description: '' };
      expect(() => new Point(props)).toThrow('Point description is required');
    });

    it('should throw error for description exceeding 500 characters', () => {
      const props = { ...basePointProps, description: 'a'.repeat(501) };
      expect(() => new Point(props)).toThrow('Point description cannot exceed 500 characters');
    });

    it('should throw error for invalid point type', () => {
      const props = { ...basePointProps, type: 'INVALID' as PointType };
      expect(() => new Point(props)).toThrow('Invalid point type');
    });

    it('should throw error for earned points without expiration date', () => {
      const props = { ...basePointProps, type: PointType.EARNED, expiresAt: undefined };
      expect(() => new Point(props)).toThrow('Earned points must have an expiration date');
    });

    it('should throw error for non-earned points with expiration date', () => {
      const props = { ...basePointProps, type: PointType.DEDUCTED, expiresAt: new Date() };
      expect(() => new Point(props)).toThrow('Only earned points can have expiration dates');
    });

    it('should throw error for expiration date before creation date', () => {
      const props = {
        ...basePointProps,
        createdAt: new Date('2023-12-31'),
        expiresAt: new Date('2023-01-01')
      };
      expect(() => new Point(props)).toThrow('Expiration date must be after creation date');
    });
  });

  describe('signedAmount', () => {
    it('should return positive amount for earned points', () => {
      const point = new Point({ ...basePointProps, type: PointType.EARNED });
      expect(point.signedAmount).toBe(100);
    });

    it('should return negative amount for deducted points', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(point.signedAmount).toBe(-100);
    });

    it('should return negative amount for expired points', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.EXPIRED,
        expiresAt: undefined
      });
      expect(point.signedAmount).toBe(-100);
    });

    it('should return negative amount for exchanged points', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.EXCHANGED,
        expiresAt: undefined
      });
      expect(point.signedAmount).toBe(-100);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify earned points', () => {
      const point = new Point({ ...basePointProps, type: PointType.EARNED });
      expect(point.isEarned).toBe(true);
      expect(point.isDeducted).toBe(false);
      expect(point.isExchanged).toBe(false);
    });

    it('should correctly identify deducted points', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(point.isEarned).toBe(false);
      expect(point.isDeducted).toBe(true);
      expect(point.isExchanged).toBe(false);
    });

    it('should correctly identify exchanged points', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.EXCHANGED,
        expiresAt: undefined
      });
      expect(point.isEarned).toBe(false);
      expect(point.isDeducted).toBe(false);
      expect(point.isExchanged).toBe(true);
    });
  });

  describe('canExpire', () => {
    it('should return true for earned points with expiration date', () => {
      const point = new Point(basePointProps);
      expect(point.canExpire).toBe(true);
    });

    it('should return false for non-earned points', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(point.canExpire).toBe(false);
    });
  });

  describe('expire', () => {
    it('should expire a point that can expire', () => {
      const point = new Point({
        ...basePointProps,
        expiresAt: new Date('2023-01-02') // Past date
      });
      point.expire();
      expect(point.isExpired).toBe(true);
    });

    it('should throw error when expiring point that cannot expire', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(() => point.expire()).toThrow('Only earned points with expiration dates can be expired');
    });

    it('should throw error when expiring already expired point', () => {
      const point = new Point({ ...basePointProps, isExpired: true });
      expect(() => point.expire()).toThrow('Point is already expired');
    });

    it('should throw error when expiring point that has not reached expiration date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const point = new Point({ ...basePointProps, expiresAt: futureDate });
      expect(() => point.expire()).toThrow('Point has not reached expiration date yet');
    });
  });

  describe('isExpiring', () => {
    it('should return true for points expiring within specified days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const point = new Point({ ...basePointProps, expiresAt: tomorrow });
      expect(point.isExpiring(7)).toBe(true);
    });

    it('should return false for points expiring beyond specified days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const point = new Point({ ...basePointProps, expiresAt: futureDate });
      expect(point.isExpiring(7)).toBe(false);
    });

    it('should return false for points without expiration date', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(point.isExpiring(7)).toBe(false);
    });
  });

  describe('isExpiredAt', () => {
    it('should return true for points expired at given date', () => {
      const point = new Point({ 
        ...basePointProps, 
        expiresAt: new Date('2023-01-02'),
        createdAt: new Date('2023-01-01')
      });
      expect(point.isExpiredAt(new Date('2023-01-03'))).toBe(true);
    });

    it('should return false for points not expired at given date', () => {
      const point = new Point({ ...basePointProps, expiresAt: new Date('2023-01-02') });
      expect(point.isExpiredAt(new Date('2023-01-01'))).toBe(false);
    });

    it('should return false for points without expiration date', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(point.isExpiredAt(new Date())).toBe(false);
    });
  });

  describe('getDaysUntilExpiration', () => {
    it('should return correct days until expiration', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const point = new Point({ ...basePointProps, expiresAt: futureDate });
      expect(point.getDaysUntilExpiration()).toBe(5);
    });

    it('should return 0 for expired points', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const point = new Point({ ...basePointProps, expiresAt: pastDate });
      expect(point.getDaysUntilExpiration()).toBe(0);
    });

    it('should return null for points without expiration date', () => {
      const point = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(point.getDaysUntilExpiration()).toBeNull();
    });
  });

  describe('FIFO logic helpers', () => {
    it('should identify available points for deduction', () => {
      const earnedPoint = new Point(basePointProps);
      expect(earnedPoint.isAvailableForDeduction()).toBe(true);
      expect(earnedPoint.canBeUsedInFifo()).toBe(true);
    });

    it('should not identify expired points as available for deduction', () => {
      const expiredPoint = new Point({ ...basePointProps, isExpired: true });
      expect(expiredPoint.isAvailableForDeduction()).toBe(false);
      expect(expiredPoint.canBeUsedInFifo()).toBe(false);
    });

    it('should not identify deducted points as available for deduction', () => {
      const deductedPoint = new Point({
        ...basePointProps,
        type: PointType.DEDUCTED,
        expiresAt: undefined
      });
      expect(deductedPoint.isAvailableForDeduction()).toBe(false);
      expect(deductedPoint.canBeUsedInFifo()).toBe(false);
    });
  });

  describe('factory methods', () => {
    const memberId = 'member-123';
    const amount = 100;
    const description = 'Test points';

    it('should create earned points', () => {
      const createdAt = new Date('2023-01-01');
      const expiresAt = new Date('2024-12-31');
      const point = Point.createEarned('point-1', memberId, amount, description, expiresAt, createdAt);
      expect(point.type).toBe(PointType.EARNED);
      expect(point.amount).toBe(amount);
      expect(point.expiresAt).toBe(expiresAt);
      expect(point.isExpired).toBe(false);
    });

    it('should create deducted points', () => {
      const point = Point.createDeducted('point-1', memberId, amount, description);
      expect(point.type).toBe(PointType.DEDUCTED);
      expect(point.amount).toBe(amount);
      expect(point.expiresAt).toBeUndefined();
      expect(point.isExpired).toBe(false);
    });

    it('should create exchanged points', () => {
      const point = Point.createExchanged('point-1', memberId, amount, description);
      expect(point.type).toBe(PointType.EXCHANGED);
      expect(point.amount).toBe(amount);
      expect(point.expiresAt).toBeUndefined();
      expect(point.isExpired).toBe(false);
    });

    it('should create expired points', () => {
      const point = Point.createExpired('point-1', memberId, amount, description);
      expect(point.type).toBe(PointType.EXPIRED);
      expect(point.amount).toBe(amount);
      expect(point.expiresAt).toBeUndefined();
      expect(point.isExpired).toBe(true);
    });
  });
});