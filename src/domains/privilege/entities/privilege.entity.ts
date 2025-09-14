import { PointAmount } from '@/domains/common/value-objects';

export interface PrivilegeProps {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  isActive: boolean;
  validityDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePrivilegeData {
  name?: string;
  description?: string;
  pointCost?: number;
  validityDays?: number;
}

export class Privilege {
  private readonly _id: string;
  private _name: string;
  private _description: string;
  private _pointCost: PointAmount;
  private _isActive: boolean;
  private _validityDays?: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PrivilegeProps) {
    this._id = props.id;
    this._name = props.name;
    this._description = props.description;
    this._pointCost = new PointAmount(props.pointCost);
    this._isActive = props.isActive;
    this._validityDays = props.validityDays;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this.validate();
  }

  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('Privilege ID is required');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Privilege name is required');
    }

    if (this._name.length > 200) {
      throw new Error('Privilege name cannot exceed 200 characters');
    }

    if (!this._description || this._description.trim().length === 0) {
      throw new Error('Privilege description is required');
    }

    if (this._description.length > 1000) {
      throw new Error('Privilege description cannot exceed 1000 characters');
    }

    if (this._validityDays !== undefined) {
      if (this._validityDays <= 0) {
        throw new Error('Validity days must be greater than 0');
      }

      if (this._validityDays > 3650) { // 10 years max
        throw new Error('Validity days cannot exceed 3650 days (10 years)');
      }
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get pointCost(): number {
    return this._pointCost.getValue();
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get validityDays(): number | undefined {
    return this._validityDays;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get hasExpiration(): boolean {
    return this._validityDays !== undefined;
  }

  get isPermanent(): boolean {
    return this._validityDays === undefined;
  }

  // Domain methods
  updateCost(newCost: number): void {
    if (!this._isActive) {
      throw new Error('Cannot update cost of inactive privilege');
    }

    const newPointCost = new PointAmount(newCost);
    
    if (newPointCost.equals(this._pointCost)) {
      throw new Error('New cost must be different from current cost');
    }

    this._pointCost = newPointCost;
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._isActive) {
      throw new Error('Privilege is already active');
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new Error('Privilege is already inactive');
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  update(data: UpdatePrivilegeData): void {
    if (!this._isActive) {
      throw new Error('Cannot update inactive privilege');
    }

    let hasChanges = false;

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Privilege name cannot be empty');
      }
      if (data.name.length > 200) {
        throw new Error('Privilege name cannot exceed 200 characters');
      }
      if (data.name.trim() !== this._name) {
        this._name = data.name.trim();
        hasChanges = true;
      }
    }

    if (data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        throw new Error('Privilege description cannot be empty');
      }
      if (data.description.length > 1000) {
        throw new Error('Privilege description cannot exceed 1000 characters');
      }
      if (data.description.trim() !== this._description) {
        this._description = data.description.trim();
        hasChanges = true;
      }
    }

    if (data.pointCost !== undefined) {
      const newPointCost = new PointAmount(data.pointCost);
      if (!newPointCost.equals(this._pointCost)) {
        this._pointCost = newPointCost;
        hasChanges = true;
      }
    }

    if (data.validityDays !== undefined) {
      if (data.validityDays <= 0) {
        throw new Error('Validity days must be greater than 0');
      }
      if (data.validityDays > 3650) {
        throw new Error('Validity days cannot exceed 3650 days (10 years)');
      }
      if (data.validityDays !== this._validityDays) {
        this._validityDays = data.validityDays;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this._updatedAt = new Date();
    }
  }

  canBeExchanged(): boolean {
    return this._isActive;
  }

  calculateExpirationDate(grantedAt: Date = new Date()): Date | null {
    if (!this._validityDays) {
      return null;
    }

    const expirationDate = new Date(grantedAt);
    expirationDate.setDate(expirationDate.getDate() + this._validityDays);
    return expirationDate;
  }

  isAffordable(availablePoints: PointAmount): boolean {
    return availablePoints.isGreaterThanOrEqual(this._pointCost);
  }

  getRequiredPoints(): PointAmount {
    return this._pointCost;
  }

  // Factory method for creating new privileges
  static create(
    id: string,
    name: string,
    description: string,
    pointCost: number,
    validityDays?: number,
    createdAt: Date = new Date()
  ): Privilege {
    return new Privilege({
      id,
      name: name.trim(),
      description: description.trim(),
      pointCost,
      isActive: true,
      validityDays,
      createdAt,
      updatedAt: createdAt
    });
  }
}