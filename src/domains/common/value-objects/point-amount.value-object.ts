export class PointAmount {
  private readonly value: number;

  constructor(amount: number) {
    this.validate(amount);
    this.value = Math.round(amount * 100) / 100; // Round to 2 decimal places
  }

  private validate(amount: number): void {
    if (typeof amount !== 'number') {
      throw new Error('Point amount must be a number');
    }

    if (isNaN(amount) || !isFinite(amount)) {
      throw new Error('Point amount must be a valid finite number');
    }

    if (amount < 0) {
      throw new Error('Point amount cannot be negative');
    }

    if (amount > 999999.99) {
      throw new Error('Point amount cannot exceed 999,999.99');
    }

    // Check for excessive decimal places (more than what can be reasonably rounded)
    const amountStr = amount.toString();
    if (amountStr.includes('.')) {
      const decimalPart = amountStr.split('.')[1];
      if (decimalPart && decimalPart.length > 4) {
        throw new Error('Point amount cannot have more than 2 decimal places');
      }
    }
  }

  getValue(): number {
    return this.value;
  }

  add(other: PointAmount): PointAmount {
    return new PointAmount(this.value + other.value);
  }

  subtract(other: PointAmount): PointAmount {
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error('Cannot subtract more points than available');
    }
    return new PointAmount(result);
  }

  isGreaterThan(other: PointAmount): boolean {
    return this.value > other.value;
  }

  isGreaterThanOrEqual(other: PointAmount): boolean {
    return this.value >= other.value;
  }

  isLessThan(other: PointAmount): boolean {
    return this.value < other.value;
  }

  isLessThanOrEqual(other: PointAmount): boolean {
    return this.value <= other.value;
  }

  equals(other: PointAmount): boolean {
    return this.value === other.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}