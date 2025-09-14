import { PointAmount } from '@/domains/common/value-objects';

export enum PointType {
  EARNED = 'EARNED',
  DEDUCTED = 'DEDUCTED',
  EXPIRED = 'EXPIRED',
  EXCHANGED = 'EXCHANGED'
}

export interface PointProps {
  id: string;
  memberId: string;
  amount: number;
  type: PointType;
  description: string;
  expiresAt?: Date;
  isExpired: boolean;
  createdAt: Date;
}

export class Point {
  private readonly _id: string;
  private readonly _memberId: string;
  private readonly _amount: PointAmount;
  private readonly _type: PointType;
  private readonly _description: string;
  private readonly _expiresAt?: Date;
  private _isExpired: boolean;
  private readonly _createdAt: Date;

  constructor(props: PointProps) {
    this._id = props.id;
    this._memberId = props.memberId;
    this._amount = new PointAmount(Math.abs(props.amount)); // Store as absolute value
    this._type = props.type;
    this._description = props.description;
    this._expiresAt = props.expiresAt;
    this._isExpired = props.isExpired;
    this._createdAt = props.createdAt;

    this.validate();
  }

  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('Point ID is required');
    }

    if (!this._memberId || this._memberId.trim().length === 0) {
      throw new Error('Member ID is required');
    }

    if (!this._description || this._description.trim().length === 0) {
      throw new Error('Point description is required');
    }

    if (this._description.length > 500) {
      throw new Error('Point description cannot exceed 500 characters');
    }

    if (!Object.values(PointType).includes(this._type)) {
      throw new Error('Invalid point type');
    }

    // Validation for expiration logic
    if (this._type === PointType.EARNED && !this._expiresAt) {
      throw new Error('Earned points must have an expiration date');
    }

    if (this._type !== PointType.EARNED && this._expiresAt) {
      throw new Error('Only earned points can have expiration dates');
    }

    if (this._expiresAt && this._expiresAt <= this._createdAt) {
      throw new Error('Expiration date must be after creation date');
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get memberId(): string {
    return this._memberId;
  }

  get amount(): number {
    return this._amount.getValue();
  }

  get signedAmount(): number {
    // Return negative amount for deductions, expired, and exchanged points
    const multiplier = [PointType.DEDUCTED, PointType.EXPIRED, PointType.EXCHANGED].includes(this._type) ? -1 : 1;
    return this._amount.getValue() * multiplier;
  }

  get type(): PointType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  get isExpired(): boolean {
    return this._isExpired;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get isEarned(): boolean {
    return this._type === PointType.EARNED;
  }

  get isDeducted(): boolean {
    return this._type === PointType.DEDUCTED;
  }

  get isExchanged(): boolean {
    return this._type === PointType.EXCHANGED;
  }

  get canExpire(): boolean {
    return this._type === PointType.EARNED && this._expiresAt !== undefined;
  }

  // Domain methods
  expire(): void {
    if (!this.canExpire) {
      throw new Error('Only earned points with expiration dates can be expired');
    }

    if (this._isExpired) {
      throw new Error('Point is already expired');
    }

    if (!this.isExpiring(0)) {
      throw new Error('Point has not reached expiration date yet');
    }

    this._isExpired = true;
  }

  isExpiring(days: number): boolean {
    if (!this._expiresAt) {
      return false;
    }

    const now = new Date();
    const daysInMs = days * 24 * 60 * 60 * 1000;
    const expirationThreshold = new Date(now.getTime() + daysInMs);

    return this._expiresAt <= expirationThreshold;
  }

  isExpiredAt(date: Date): boolean {
    if (!this._expiresAt) {
      return false;
    }

    return this._expiresAt <= date;
  }

  getDaysUntilExpiration(): number | null {
    if (!this._expiresAt) {
      return null;
    }

    const now = new Date();
    const diffInMs = this._expiresAt.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (24 * 60 * 60 * 1000));

    return Math.max(0, diffInDays);
  }

  // FIFO logic helpers
  isAvailableForDeduction(): boolean {
    return this._type === PointType.EARNED && !this._isExpired;
  }

  canBeUsedInFifo(): boolean {
    return this.isAvailableForDeduction();
  }

  // Factory methods for creating different types of points
  static createEarned(
    id: string,
    memberId: string,
    amount: number,
    description: string,
    expiresAt: Date,
    createdAt: Date = new Date()
  ): Point {
    return new Point({
      id,
      memberId,
      amount,
      type: PointType.EARNED,
      description,
      expiresAt,
      isExpired: false,
      createdAt
    });
  }

  static createDeducted(
    id: string,
    memberId: string,
    amount: number,
    description: string,
    createdAt: Date = new Date()
  ): Point {
    return new Point({
      id,
      memberId,
      amount,
      type: PointType.DEDUCTED,
      description,
      isExpired: false,
      createdAt
    });
  }

  static createExchanged(
    id: string,
    memberId: string,
    amount: number,
    description: string,
    createdAt: Date = new Date()
  ): Point {
    return new Point({
      id,
      memberId,
      amount,
      type: PointType.EXCHANGED,
      description,
      isExpired: false,
      createdAt
    });
  }

  static createExpired(
    id: string,
    memberId: string,
    amount: number,
    description: string,
    createdAt: Date = new Date()
  ): Point {
    return new Point({
      id,
      memberId,
      amount,
      type: PointType.EXPIRED,
      description,
      isExpired: true,
      createdAt
    });
  }
}