import { Email } from '@/domains/common/value-objects';

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export interface AdminProps {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateAdminData {
  username?: string;
  role?: AdminRole;
}

export class Admin {
  private readonly _id: string;
  private _email: Email;
  private _username: string;
  private _passwordHash: string;
  private _role: AdminRole;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AdminProps) {
    this._id = props.id;
    this._email = new Email(props.email);
    this._username = props.username;
    this._passwordHash = props.passwordHash;
    this._role = props.role;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this.validate();
  }

  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('Admin ID is required');
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

    if (!Object.values(AdminRole).includes(this._role)) {
      throw new Error('Invalid admin role');
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

  get role(): AdminRole {
    return this._role;
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

  // Domain methods
  updateProfile(data: UpdateAdminData): void {
    if (!this._isActive) {
      throw new Error('Cannot update profile of inactive admin');
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

    if (data.role !== undefined) {
      if (!Object.values(AdminRole).includes(data.role)) {
        throw new Error('Invalid admin role');
      }
      this._role = data.role;
    }

    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new Error('Admin is already inactive');
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._isActive) {
      throw new Error('Admin is already active');
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  updatePasswordHash(newPasswordHash: string): void {
    if (!this._isActive) {
      throw new Error('Cannot update password of inactive admin');
    }

    if (!newPasswordHash || newPasswordHash.trim().length === 0) {
      throw new Error('Password hash is required');
    }

    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }

  hasRole(role: AdminRole): boolean {
    return this._role === role;
  }

  isSuperAdmin(): boolean {
    return this._role === AdminRole.SUPER_ADMIN;
  }

  canManageAdmins(): boolean {
    return this._role === AdminRole.SUPER_ADMIN;
  }
}