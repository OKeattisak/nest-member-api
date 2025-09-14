import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActorType, LoginAttempt as PrismaLoginAttempt } from '@prisma/client';
import { 
  ILoginAttemptRepository, 
  CreateLoginAttemptData, 
  LoginAttemptFilters 
} from '../../../domains/audit/repositories/login-attempt.repository.interface';
import { LoginAttempt } from '../../../domains/audit/entities/login-attempt.entity';
import { PaginationOptions, PaginatedResult } from '../../../domains/member/repositories/member.repository.interface';

@Injectable()
export class LoginAttemptRepository implements ILoginAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLoginAttemptData): Promise<LoginAttempt> {
    const loginAttempt = await this.prisma.loginAttempt.create({
      data: {
        emailOrUsername: data.emailOrUsername,
        actorType: data.actorType,
        success: data.success,
        failureReason: data.failureReason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        traceId: data.traceId,
      },
    });

    return this.toDomainEntity(loginAttempt);
  }

  async findByEmailOrUsername(
    emailOrUsername: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<LoginAttempt>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [loginAttempts, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where: { emailOrUsername },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loginAttempt.count({
        where: { emailOrUsername },
      }),
    ]);

    return {
      data: loginAttempts.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRecentFailedAttempts(emailOrUsername: string, minutesBack: number): Promise<LoginAttempt[]> {
    const cutoffTime = new Date(Date.now() - minutesBack * 60 * 1000);

    const loginAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        emailOrUsername,
        success: false,
        createdAt: {
          gte: cutoffTime,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return loginAttempts.map(this.toDomainEntity);
  }

  async findByIpAddress(
    ipAddress: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<LoginAttempt>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [loginAttempts, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where: { ipAddress },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loginAttempt.count({
        where: { ipAddress },
      }),
    ]);

    return {
      data: loginAttempts.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWithFilters(
    filters: LoginAttemptFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<LoginAttempt>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.emailOrUsername) where.emailOrUsername = filters.emailOrUsername;
    if (filters.actorType) where.actorType = filters.actorType;
    if (filters.success !== undefined) where.success = filters.success;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [loginAttempts, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loginAttempt.count({ where }),
    ]);

    return {
      data: loginAttempts.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStatistics(dateFrom: Date, dateTo: Date): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    uniqueUsers: number;
    uniqueIPs: number;
    actorTypeCounts: Record<ActorType, number>;
    topFailureReasons: Array<{ reason: string; count: number }>;
  }> {
    const [
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      uniqueUsers,
      uniqueIPs,
      actorTypeCounts,
      failureReasons,
    ] = await Promise.all([
      this.prisma.loginAttempt.count({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      this.prisma.loginAttempt.count({
        where: {
          success: true,
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      this.prisma.loginAttempt.count({
        where: {
          success: false,
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      this.prisma.loginAttempt.findMany({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        select: { emailOrUsername: true },
        distinct: ['emailOrUsername'],
      }).then(results => results.length),
      this.prisma.loginAttempt.findMany({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
          ipAddress: { not: null },
        },
        select: { ipAddress: true },
        distinct: ['ipAddress'],
      }).then(results => results.length),
      this.prisma.loginAttempt.groupBy({
        by: ['actorType'],
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { actorType: true },
      }),
      this.prisma.loginAttempt.groupBy({
        by: ['failureReason'],
        where: {
          success: false,
          failureReason: { not: null },
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { failureReason: true },
        orderBy: { _count: { failureReason: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      uniqueUsers,
      uniqueIPs,
      actorTypeCounts: actorTypeCounts.reduce((acc, item) => {
        acc[item.actorType] = item._count.actorType;
        return acc;
      }, {} as Record<ActorType, number>),
      topFailureReasons: failureReasons.map(item => ({
        reason: item.failureReason || 'unknown',
        count: item._count.failureReason,
      })),
    };
  }

  async checkSuspiciousActivity(ipAddress: string, hoursBack: number): Promise<{
    isSuspicious: boolean;
    failedAttempts: number;
    uniqueAccounts: number;
    lastAttempt: Date | null;
  }> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const [failedAttempts, uniqueAccounts, lastAttempt] = await Promise.all([
      this.prisma.loginAttempt.count({
        where: {
          ipAddress,
          success: false,
          createdAt: { gte: cutoffTime },
        },
      }),
      this.prisma.loginAttempt.findMany({
        where: {
          ipAddress,
          createdAt: { gte: cutoffTime },
        },
        select: { emailOrUsername: true },
        distinct: ['emailOrUsername'],
      }).then(results => results.length),
      this.prisma.loginAttempt.findFirst({
        where: { ipAddress },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }).then(result => result?.createdAt || null),
    ]);

    // Define suspicious thresholds
    const isSuspicious = failedAttempts >= 10 || uniqueAccounts >= 5;

    return {
      isSuspicious,
      failedAttempts,
      uniqueAccounts,
      lastAttempt,
    };
  }

  async getFailedAttemptsCount(emailOrUsername: string, minutesBack: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - minutesBack * 60 * 1000);

    return this.prisma.loginAttempt.count({
      where: {
        emailOrUsername,
        success: false,
        createdAt: { gte: cutoffTime },
      },
    });
  }

  private toDomainEntity(prismaLoginAttempt: PrismaLoginAttempt): LoginAttempt {
    return new LoginAttempt({
      id: prismaLoginAttempt.id,
      emailOrUsername: prismaLoginAttempt.emailOrUsername,
      actorType: prismaLoginAttempt.actorType,
      success: prismaLoginAttempt.success,
      failureReason: prismaLoginAttempt.failureReason || undefined,
      ipAddress: prismaLoginAttempt.ipAddress || undefined,
      userAgent: prismaLoginAttempt.userAgent || undefined,
      traceId: prismaLoginAttempt.traceId || undefined,
      createdAt: prismaLoginAttempt.createdAt,
    });
  }
}