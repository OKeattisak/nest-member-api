import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction, ActorType } from '@prisma/client';

describe('AuditLog Entity', () => {
  const mockAuditLogData = {
    id: 'audit-1',
    entityType: 'Member',
    entityId: 'member-1',
    action: AuditAction.CREATE,
    actorType: ActorType.MEMBER,
    actorId: 'member-1',
    newValues: { email: 'test@example.com' },
    metadata: { source: 'registration' },
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    traceId: 'trace-123',
    createdAt: new Date(),
  };

  it('should create an audit log instance', () => {
    const auditLog = new AuditLog(mockAuditLogData);

    expect(auditLog.id).toBe(mockAuditLogData.id);
    expect(auditLog.entityType).toBe(mockAuditLogData.entityType);
    expect(auditLog.entityId).toBe(mockAuditLogData.entityId);
    expect(auditLog.action).toBe(mockAuditLogData.action);
    expect(auditLog.actorType).toBe(mockAuditLogData.actorType);
    expect(auditLog.actorId).toBe(mockAuditLogData.actorId);
    expect(auditLog.newValues).toEqual(mockAuditLogData.newValues);
    expect(auditLog.metadata).toEqual(mockAuditLogData.metadata);
    expect(auditLog.ipAddress).toBe(mockAuditLogData.ipAddress);
    expect(auditLog.userAgent).toBe(mockAuditLogData.userAgent);
    expect(auditLog.traceId).toBe(mockAuditLogData.traceId);
    expect(auditLog.createdAt).toBe(mockAuditLogData.createdAt);
  });

  describe('isSensitiveAction', () => {
    it('should return true for sensitive actions', () => {
      const sensitiveActions = [
        AuditAction.DELETE,
        AuditAction.SOFT_DELETE,
        AuditAction.DEACTIVATE,
        AuditAction.POINT_DEDUCT,
        AuditAction.PRIVILEGE_REVOKE,
      ];

      sensitiveActions.forEach(action => {
        const auditLog = new AuditLog({
          ...mockAuditLogData,
          action,
        });
        expect(auditLog.isSensitiveAction()).toBe(true);
      });
    });

    it('should return false for non-sensitive actions', () => {
      const nonSensitiveActions = [
        AuditAction.CREATE,
        AuditAction.UPDATE,
        AuditAction.LOGIN,
        AuditAction.POINT_ADD,
        AuditAction.PRIVILEGE_GRANT,
      ];

      nonSensitiveActions.forEach(action => {
        const auditLog = new AuditLog({
          ...mockAuditLogData,
          action,
        });
        expect(auditLog.isSensitiveAction()).toBe(false);
      });
    });
  });

  describe('getActionDescription', () => {
    it('should return correct descriptions for all actions', () => {
      const actionDescriptions = [
        { action: AuditAction.CREATE, description: 'Created' },
        { action: AuditAction.UPDATE, description: 'Updated' },
        { action: AuditAction.DELETE, description: 'Deleted' },
        { action: AuditAction.SOFT_DELETE, description: 'Soft deleted' },
        { action: AuditAction.ACTIVATE, description: 'Activated' },
        { action: AuditAction.DEACTIVATE, description: 'Deactivated' },
        { action: AuditAction.LOGIN, description: 'Logged in' },
        { action: AuditAction.LOGOUT, description: 'Logged out' },
        { action: AuditAction.POINT_ADD, description: 'Added points' },
        { action: AuditAction.POINT_DEDUCT, description: 'Deducted points' },
        { action: AuditAction.POINT_EXPIRE, description: 'Expired points' },
        { action: AuditAction.PRIVILEGE_EXCHANGE, description: 'Exchanged privilege' },
        { action: AuditAction.PRIVILEGE_GRANT, description: 'Granted privilege' },
        { action: AuditAction.PRIVILEGE_REVOKE, description: 'Revoked privilege' },
      ];

      actionDescriptions.forEach(({ action, description }) => {
        const auditLog = new AuditLog({
          ...mockAuditLogData,
          action,
        });
        expect(auditLog.getActionDescription()).toBe(description);
      });
    });
  });

  describe('getActorDescription', () => {
    it('should return "System" for system actor', () => {
      const auditLog = new AuditLog({
        ...mockAuditLogData,
        actorType: ActorType.SYSTEM,
        actorId: undefined,
      });
      expect(auditLog.getActorDescription()).toBe('System');
    });

    it('should return actor type with ID for non-system actors', () => {
      const auditLog = new AuditLog({
        ...mockAuditLogData,
        actorType: ActorType.ADMIN,
        actorId: 'admin-123',
      });
      expect(auditLog.getActorDescription()).toBe('ADMIN (admin-123)');
    });

    it('should return actor type without ID when ID is not provided', () => {
      const auditLog = new AuditLog({
        ...mockAuditLogData,
        actorType: ActorType.MEMBER,
        actorId: undefined,
      });
      expect(auditLog.getActorDescription()).toBe('MEMBER');
    });
  });
});