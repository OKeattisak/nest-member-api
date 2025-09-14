import { AuditAction, ActorType } from '@prisma/client';

export interface AuditLogData {
  id: string;
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
  createdAt: Date;
}

export class AuditLog {
  public readonly id: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly action: AuditAction;
  public readonly actorType: ActorType;
  public readonly actorId?: string;
  public readonly oldValues?: Record<string, any>;
  public readonly newValues?: Record<string, any>;
  public readonly metadata?: Record<string, any>;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;
  public readonly traceId?: string;
  public readonly createdAt: Date;

  constructor(data: AuditLogData) {
    this.id = data.id;
    this.entityType = data.entityType;
    this.entityId = data.entityId;
    this.action = data.action;
    this.actorType = data.actorType;
    this.actorId = data.actorId;
    this.oldValues = data.oldValues;
    this.newValues = data.newValues;
    this.metadata = data.metadata;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.traceId = data.traceId;
    this.createdAt = data.createdAt;
  }

  /**
   * Check if this audit log represents a sensitive action
   */
  isSensitiveAction(): boolean {
    const sensitiveActions: AuditAction[] = [
      AuditAction.DELETE,
      AuditAction.SOFT_DELETE,
      AuditAction.DEACTIVATE,
      AuditAction.POINT_DEDUCT,
      AuditAction.PRIVILEGE_REVOKE,
    ];
    return sensitiveActions.includes(this.action);
  }

  /**
   * Get a human-readable description of the audit action
   */
  getActionDescription(): string {
    const descriptions: Record<AuditAction, string> = {
      [AuditAction.CREATE]: 'Created',
      [AuditAction.UPDATE]: 'Updated',
      [AuditAction.DELETE]: 'Deleted',
      [AuditAction.SOFT_DELETE]: 'Soft deleted',
      [AuditAction.ACTIVATE]: 'Activated',
      [AuditAction.DEACTIVATE]: 'Deactivated',
      [AuditAction.LOGIN]: 'Logged in',
      [AuditAction.LOGOUT]: 'Logged out',
      [AuditAction.POINT_ADD]: 'Added points',
      [AuditAction.POINT_DEDUCT]: 'Deducted points',
      [AuditAction.POINT_EXPIRE]: 'Expired points',
      [AuditAction.PRIVILEGE_EXCHANGE]: 'Exchanged privilege',
      [AuditAction.PRIVILEGE_GRANT]: 'Granted privilege',
      [AuditAction.PRIVILEGE_REVOKE]: 'Revoked privilege',
    };
    return descriptions[this.action] || 'Unknown action';
  }

  /**
   * Get the actor description
   */
  getActorDescription(): string {
    if (this.actorType === ActorType.SYSTEM) {
      return 'System';
    }
    return `${this.actorType}${this.actorId ? ` (${this.actorId})` : ''}`;
  }
}