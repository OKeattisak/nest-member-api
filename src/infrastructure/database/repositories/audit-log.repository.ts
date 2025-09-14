import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AuditAction, ActorType, AuditLog as PrismaAuditLog } from '@prisma/client';
import { 
  IAuditLogRepository, 
  CreateAuditLogData, 
  AuditLogFilters 
} from '@/domains/audit/repositories/audit-log.repository.interface';
import { AuditLog } from '@/domains/audit/entities/audit-log.entity';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditLogData): Promise<AuditLog> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        actorType: data.actorType,
        actorId: data.actorId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        traceId: data.traceId,
      },
    });

    return this.toDomainEntity(auditLog);
  }

  async createMany(data: CreateAuditLogData[]): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.createManyAndReturn({
      data: data.map(item => ({
        entityType: item.entityType,
        entityId: item.entityId,
        action: item.action,
        actorType: item.actorType,
        actorId: item.actorId,
        oldValues: item.oldValues,
        newValues: item.newValues,
        metadata: item.metadata,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        traceId: item.traceId,
      })),
    });

    return auditLogs.map(this.toDomainEntity);
  }

  async findByEntity(
    entityType: string, 
    entityId: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({
        where: {
          entityType,
          entityId,
        },
      }),
    ]);

    return {
      data: auditLogs.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByActor(
    actorType: ActorType, 
    actorId: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          actorType,
          actorId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({
        where: {
          actorType,
          actorId,
        },
      }),
    ]);

    return {
      data: auditLogs.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWithFilters(
    filters: AuditLogFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;
    if (filters.actorType) where.actorType = filters.actorType;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.traceId) where.traceId = filters.traceId;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: auditLogs.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTraceId(traceId: string): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { traceId },
      orderBy: { createdAt: 'asc' },
    });

    return auditLogs.map(this.toDomainEntity);
  }

  async findSensitiveActions(
    dateFrom: Date, 
    dateTo: Date, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const sensitiveActions = [
      AuditAction.DELETE,
      AuditAction.SOFT_DELETE,
      AuditAction.DEACTIVATE,
      AuditAction.POINT_DEDUCT,
      AuditAction.PRIVILEGE_REVOKE,
    ];

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          action: { in: sensitiveActions },
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({
        where: {
          action: { in: sensitiveActions },
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
    ]);

    return {
      data: auditLogs.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStatistics(dateFrom: Date, dateTo: Date): Promise<{
    totalLogs: number;
    actionCounts: Record<AuditAction, number>;
    actorTypeCounts: Record<ActorType, number>;
    entityTypeCounts: Record<string, number>;
  }> {
    const [
      totalLogs,
      actionCounts,
      actorTypeCounts,
      entityTypeCounts,
    ] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { action: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['actorType'],
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { actorType: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entityType'],
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { entityType: true },
      }),
    ]);

    return {
      totalLogs,
      actionCounts: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<AuditAction, number>),
      actorTypeCounts: actorTypeCounts.reduce((acc, item) => {
        acc[item.actorType] = item._count.actorType;
        return acc;
      }, {} as Record<ActorType, number>),
      entityTypeCounts: entityTypeCounts.reduce((acc, item) => {
        acc[item.entityType] = item._count.entityType;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private toDomainEntity(prismaAuditLog: PrismaAuditLog): AuditLog {
    return new AuditLog({
      id: prismaAuditLog.id,
      entityType: prismaAuditLog.entityType,
      entityId: prismaAuditLog.entityId,
      action: prismaAuditLog.action,
      actorType: prismaAuditLog.actorType,
      actorId: prismaAuditLog.actorId || undefined,
      oldValues: prismaAuditLog.oldValues as Record<string, any> || undefined,
      newValues: prismaAuditLog.newValues as Record<string, any> || undefined,
      metadata: prismaAuditLog.metadata as Record<string, any> || undefined,
      ipAddress: prismaAuditLog.ipAddress || undefined,
      userAgent: prismaAuditLog.userAgent || undefined,
      traceId: prismaAuditLog.traceId || undefined,
      createdAt: prismaAuditLog.createdAt,
    });
  }
}