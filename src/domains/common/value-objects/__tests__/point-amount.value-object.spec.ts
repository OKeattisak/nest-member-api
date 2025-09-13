import { PointAmount } from '../point-amount.value-object';

describe('PointAmount Value Object', () => {
  describe('constructor', () => {
    it('should create a valid point amount', () => {
      const amount = new PointAmount(100.50);
      expect(amount.getValue()).toBe(100.50);
    });

    it('should round to 2 decimal places', () => {
      const amount = new PointAmount(100.555);
      expect(amount.getValue()).toBe(100.56);
    });

    it('should handle zero amount', () => {
      const amount = new PointAmount(0);
      expect(amount.getValue()).toBe(0);
    });

    it('should throw error for non-number amount', () => {
      expect(() => new PointAmount('100' as any)).toThrow('Point amount must be a number');
    });

    it('should throw error for NaN', () => {
      expect(() => new PointAmount(NaN)).toThrow('Point amount must be a valid finite number');
    });

    it('should throw error for Infinity', () => {
      expect(() => new PointAmount(Infinity)).toThrow('Point amount must be a valid finite number');
    });

    it('should throw error for negative amount', () => {
      expect(() => new PointAmount(-10)).toThrow('Point amount cannot be negative');
    });

    it('should throw error for amount exceeding maximum', () => {
      expect(() => new PointAmount(1000000)).toThrow('Point amount cannot exceed 999,999.99');
    });

    it('should throw error for more than 4 decimal places', () => {
      expect(() => new PointAmount(100.123456)).toThrow('Point amount cannot have more than 2 decimal places');
    });
  });

  describe('add', () => {
    it('should add two point amounts', () => {
      const amount1 = new PointAmount(100.50);
      const amount2 = new PointAmount(50.25);
      const result = amount1.add(amount2);
      expect(result.getValue()).toBe(150.75);
    });

    it('should handle adding zero', () => {
      const amount1 = new PointAmount(100);
      const amount2 = new PointAmount(0);
      const result = amount1.add(amount2);
      expect(result.getValue()).toBe(100);
    });
  });

  describe('subtract', () => {
    it('should subtract two point amounts', () => {
      const amount1 = new PointAmount(100.50);
      const amount2 = new PointAmount(50.25);
      const result = amount1.subtract(amount2);
      expect(result.getValue()).toBe(50.25);
    });

    it('should handle subtracting zero', () => {
      const amount1 = new PointAmount(100);
      const amount2 = new PointAmount(0);
      const result = amount1.subtract(amount2);
      expect(result.getValue()).toBe(100);
    });

    it('should throw error when subtracting more than available', () => {
      const amount1 = new PointAmount(50);
      const amount2 = new PointAmount(100);
      expect(() => amount1.subtract(amount2)).toThrow('Cannot subtract more points than available');
    });
  });

  describe('comparison methods', () => {
    const amount100 = new PointAmount(100);
    const amount50 = new PointAmount(50);
    const amount100Copy = new PointAmount(100);

    it('should correctly compare isGreaterThan', () => {
      expect(amount100.isGreaterThan(amount50)).toBe(true);
      expect(amount50.isGreaterThan(amount100)).toBe(false);
      expect(amount100.isGreaterThan(amount100Copy)).toBe(false);
    });

    it('should correctly compare isGreaterThanOrEqual', () => {
      expect(amount100.isGreaterThanOrEqual(amount50)).toBe(true);
      expect(amount50.isGreaterThanOrEqual(amount100)).toBe(false);
      expect(amount100.isGreaterThanOrEqual(amount100Copy)).toBe(true);
    });

    it('should correctly compare isLessThan', () => {
      expect(amount50.isLessThan(amount100)).toBe(true);
      expect(amount100.isLessThan(amount50)).toBe(false);
      expect(amount100.isLessThan(amount100Copy)).toBe(false);
    });

    it('should correctly compare isLessThanOrEqual', () => {
      expect(amount50.isLessThanOrEqual(amount100)).toBe(true);
      expect(amount100.isLessThanOrEqual(amount50)).toBe(false);
      expect(amount100.isLessThanOrEqual(amount100Copy)).toBe(true);
    });

    it('should correctly compare equals', () => {
      expect(amount100.equals(amount100Copy)).toBe(true);
      expect(amount100.equals(amount50)).toBe(false);
    });
  });

  describe('isZero', () => {
    it('should return true for zero amount', () => {
      const amount = new PointAmount(0);
      expect(amount.isZero()).toBe(true);
    });

    it('should return false for non-zero amount', () => {
      const amount = new PointAmount(100);
      expect(amount.isZero()).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted string with 2 decimal places', () => {
      const amount = new PointAmount(100.5);
      expect(amount.toString()).toBe('100.50');
    });

    it('should return formatted string for whole numbers', () => {
      const amount = new PointAmount(100);
      expect(amount.toString()).toBe('100.00');
    });
  });
});