import { Email, PointAmount } from '@/domains/common/value-objects';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface MemberProps {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Member {
  private readonly _id: string;
  private _email: Email;
  private _username: string;
  private _passwordHash: string;
  private _firstName: string;
  private _lastName: string;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date;

  constructor(props: MemberProps) {
    this._id = props.id;
    this._email = new Email(props.email);
    this._username = props.username;
    this._passwordHash = props.passwordHash;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('Member ID is required');
    }

    if (!this._username || this._username.trim().length === 0) {
      throw new Error('Username is required');
    }

    if (this._username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (this._username.length > 50) {
      throw new Error('Username cannot exceed 50 characters');
    }

    if (!this._passwordHash || this._passwordHash.trim().length === 0) {
      throw new Error('Password hash is required');
    }

    if (!this._firstName || this._firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (this._firstName.length > 100) {
      throw new Error('First name cannot exceed 100 characters');
    }

    if (!this._lastName || this._lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (this._lastName.length > 100) {
      throw new Error('Last name cannot exceed 100 characters');
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email.getValue();
  }

  get username(): string {
    return this._username;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  // Domain methods
  updateProfile(data: UpdateProfileData): void {
    if (this.isDeleted) {
      throw new Error('Cannot update profile of deleted member');
    }

    if (!this._isActive) {
      throw new Error('Cannot update profile of inactive member');
    }

    if (data.firstName !== undefined) {
      if (!data.firstName || data.firstName.trim().length === 0) {
        throw new Error('First name cannot be empty');
      }
      if (data.firstName.length > 100) {
        throw new Error('First name cannot exceed 100 characters');
      }
      this._firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      if (!data.lastName || data.lastName.trim().length === 0) {
        throw new Error('Last name cannot be empty');
      }
      if (data.lastName.length > 100) {
        throw new Error('Last name cannot exceed 100 characters');
      }
      this._lastName = data.lastName.trim();
    }

    if (data.username !== undefined) {
      if (!data.username || data.username.trim().length === 0) {
        throw new Error('Username cannot be empty');
      }
      if (data.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (data.username.length > 50) {
        throw new Error('Username cannot exceed 50 characters');
      }
      this._username = data.username.trim();
    }

    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (this.isDeleted) {
      throw new Error('Cannot deactivate deleted member');
    }

    if (!this._isActive) {
      throw new Error('Member is already inactive');
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this.isDeleted) {
      throw new Error('Cannot activate deleted member');
    }

    if (this._isActive) {
      throw new Error('Member is already active');
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted) {
      throw new Error('Member is already deleted');
    }

    this._deletedAt = new Date();
    this._isActive = false;
    this._updatedAt = new Date();
  }

  updatePasswordHash(newPasswordHash: string): void {
    if (this.isDeleted) {
      throw new Error('Cannot update password of deleted member');
    }

    if (!this._isActive) {
      throw new Error('Cannot update password of inactive member');
    }

    if (!newPasswordHash || newPasswordHash.trim().length === 0) {
      throw new Error('Password hash is required');
    }

    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }

  // Point calculation methods (these would work with point entities)
  calculateTotalPoints(points: { amount: number; isExpired: boolean }[]): PointAmount {
    const total = points.reduce((sum, point) => sum + point.amount, 0);
    return new PointAmount(total);
  }

  calculateAvailablePoints(points: { amount: number; isExpired: boolean }[]): PointAmount {
    const available = points
      .filter(point => !point.isExpired)
      .reduce((sum, point) => sum + point.amount, 0);
    return new PointAmount(available);
  }

  canExchangePoints(requiredAmount: PointAmount, availablePoints: PointAmount): boolean {
    if (!this._isActive || this.isDeleted) {
      return false;
    }
    return availablePoints.isGreaterThanOrEqual(requiredAmount);
  }
}