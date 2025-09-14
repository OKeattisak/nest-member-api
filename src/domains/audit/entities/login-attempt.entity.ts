import { ActorType } from '@prisma/client';

export interface LoginAttemptData {
  id: string;
  emailOrUsername: string;
  actorType: ActorType;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  createdAt: Date;
}

export class LoginAttempt {
  public readonly id: string;
  public readonly emailOrUsername: string;
  public readonly actorType: ActorType;
  public readonly success: boolean;
  public readonly failureReason?: string;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;
  public readonly traceId?: string;
  public readonly createdAt: Date;

  constructor(data: LoginAttemptData) {
    this.id = data.id;
    this.emailOrUsername = data.emailOrUsername;
    this.actorType = data.actorType;
    this.success = data.success;
    this.failureReason = data.failureReason;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.traceId = data.traceId;
    this.createdAt = data.createdAt;
  }

  /**
   * Check if this is a failed login attempt
   */
  isFailedAttempt(): boolean {
    return !this.success;
  }

  /**
   * Check if this is a suspicious login attempt
   */
  isSuspicious(): boolean {
    // Define suspicious patterns
    const suspiciousReasons = [
      'multiple_failed_attempts',
      'account_locked',
      'suspicious_ip',
    ];
    
    return this.isFailedAttempt() && 
           this.failureReason !== undefined && 
           suspiciousReasons.includes(this.failureReason);
  }

  /**
   * Get a human-readable description of the login attempt
   */
  getDescription(): string {
    const actorTypeText = this.actorType.toLowerCase();
    const statusText = this.success ? 'successful' : 'failed';
    
    let description = `${actorTypeText} login attempt ${statusText} for ${this.emailOrUsername}`;
    
    if (this.failureReason) {
      description += ` (${this.failureReason})`;
    }
    
    return description;
  }
}