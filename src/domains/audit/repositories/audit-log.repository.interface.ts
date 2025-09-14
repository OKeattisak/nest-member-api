import { AuditAction, ActorType } from '@prisma/client';
import { AuditLog } from '../entities/audit-log.entity';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';

export interface CreateAuditLogData {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorType: ActorType;
  actorId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  actorType?: ActorType;
  actorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  traceId?: string;
}

export interface IAuditLogRepository {
  /**
   * Create a new audit log entry
   */
  create(data: CreateAuditLogData): Promise<AuditLog>;

  /**
   * Create multiple audit log entries
   */
  createMany(data: CreateAuditLogData[]): Promise<AuditLog[]>;

  /**
   * Find audit logs by entity
   */
  findByEntity(entityType: string, entityId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;

  /**
   * Find audit logs by actor
   */
  findByActor(actorType: ActorType, actorId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;

  /**
   * Find audit logs with filters
   */
  findWithFilters(filters: AuditLogFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;

  /**
   * Find audit logs by trace ID
   */
  findByTraceId(traceId: string): Promise<AuditLog[]>;

  /**
   * Find sensitive actions within a date range
   */
  findSensitiveActions(dateFrom: Date, dateTo: Date, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;

  /**
   * Get audit log statistics
   */
  getStatistics(dateFrom: Date, dateTo: Date): Promise<{
    totalLogs: number;
    actionCounts: Record<AuditAction, number>;
    actorTypeCounts: Record<ActorType, number>;
    entityTypeCounts: Record<string, number>;
  }>;
}