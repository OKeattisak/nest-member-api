import { ActorType } from '@prisma/client';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';

export interface CreateLoginAttemptData {
  emailOrUsername: string;
  actorType: ActorType;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
}

export interface LoginAttemptFilters {
  emailOrUsername?: string;
  actorType?: ActorType;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
}

export interface ILoginAttemptRepository {
  /**
   * Create a new login attempt record
   */
  create(data: CreateLoginAttemptData): Promise<LoginAttempt>;

  /**
   * Find login attempts by email or username
   */
  findByEmailOrUsername(emailOrUsername: string, pagination?: PaginationOptions): Promise<PaginatedResult<LoginAttempt>>;

  /**
   * Find recent failed login attempts for an email/username
   */
  findRecentFailedAttempts(emailOrUsername: string, minutesBack: number): Promise<LoginAttempt[]>;

  /**
   * Find login attempts by IP address
   */
  findByIpAddress(ipAddress: string, pagination?: PaginationOptions): Promise<PaginatedResult<LoginAttempt>>;

  /**
   * Find login attempts with filters
   */
  findWithFilters(filters: LoginAttemptFilters, pagination?: PaginationOptions): Promise<PaginatedResult<LoginAttempt>>;

  /**
   * Get login attempt statistics
   */
  getStatistics(dateFrom: Date, dateTo: Date): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    uniqueUsers: number;
    uniqueIPs: number;
    actorTypeCounts: Record<ActorType, number>;
    topFailureReasons: Array<{ reason: string; count: number }>;
  }>;

  /**
   * Check if IP address has suspicious activity
   */
  checkSuspiciousActivity(ipAddress: string, hoursBack: number): Promise<{
    isSuspicious: boolean;
    failedAttempts: number;
    uniqueAccounts: number;
    lastAttempt: Date | null;
  }>;

  /**
   * Get failed login attempts count for a user in a time window
   */
  getFailedAttemptsCount(emailOrUsername: string, minutesBack: number): Promise<number>;
}