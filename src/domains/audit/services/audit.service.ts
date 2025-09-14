import { Injectable, Inject } from '@nestjs/common';
import { AuditAction, ActorType, TransactionType } from '@prisma/client';
import { IAuditLogRepository } from '../repositories/audit-log.repository.interface';
import { ILoginAttemptRepository } from '../repositories/login-attempt.repository.interface';
import { ITransactionHistoryRepository } from '../repositories/transaction-history.repository.interface';
import { LoggerService } from '../../../infrastructure/logging/logger.service';
import { RequestContext } from '../../../common/utils/trace.util';

export interface AuditContext {
  actorType: ActorType;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
}

export interface EntityAuditData {
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PointTransactionAuditData {
  memberId: string;
  pointId: string;
  amount: number;
  description: string;
  balanceBefore?: number;
  balanceAfter?: number;
  metadata?: Record<string, any>;
}

export interface PrivilegeTransactionAuditData {
  memberId: string;
  privilegeId: string;
  privilegeName: string;
  pointCost?: number;
  metadata?: Record<string, any>;
}

export interface LoginAttemptAuditData {
  emailOrUsername: string;
  actorType: ActorType;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject('IAuditLogRepository')
    private readonly auditLogRepository: IAuditLogRepository,
    @Inject('ILoginAttemptRepository')
    private readonly loginAttemptRepository: ILoginAttemptRepository,
    @Inject('ITransactionHistoryRepository')
    private readonly transactionHistoryRepository: ITransactionHistoryRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Log entity creation
   */
  async logEntityCreation(
    entityData: EntityAuditData,
    context: AuditContext,
  ): Promise<void> {
    try {
      await this.auditLogRepository.create({
        entityType: entityData.entityType,
        entityId: entityData.entityId,
        action: AuditAction.CREATE,
        actorType: context.actorType,
        actorId: context.actorId,
        newValues: entityData.newValues,
        metadata: entityData.metadata,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      this.logger.log(
        `Entity created: ${entityData.entityType}:${entityData.entityId}`,
        'AuditService',
        {
          operation: 'entity_creation',
          userId: context.actorId,
          metadata: {
            entityType: entityData.entityType,
            entityId: entityData.entityId,
            actorType: context.actorType,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to log entity creation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
        {
          operation: 'audit_logging_error',
          metadata: { entityType: entityData.entityType, entityId: entityData.entityId },
        },
      );
    }
  }

  /**
   * Log entity update
   */
  async logEntityUpdate(
    entityData: EntityAuditData,
    context: AuditContext,
  ): Promise<void> {
    try {
      await this.auditLogRepository.create({
        entityType: entityData.entityType,
        entityId: entityData.entityId,
        action: AuditAction.UPDATE,
        actorType: context.actorType,
        actorId: context.actorId,
        oldValues: entityData.oldValues,
        newValues: entityData.newValues,
        metadata: entityData.metadata,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      this.logger.log(
        `Entity updated: ${entityData.entityType}:${entityData.entityId}`,
        'AuditService',
        {
          operation: 'entity_update',
          userId: context.actorId,
          metadata: {
            entityType: entityData.entityType,
            entityId: entityData.entityId,
            actorType: context.actorType,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to log entity update: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
      );
    }
  }

  /**
   * Log entity deletion
   */
  async logEntityDeletion(
    entityData: EntityAuditData,
    context: AuditContext,
    isSoftDelete: boolean = false,
  ): Promise<void> {
    try {
      await this.auditLogRepository.create({
        entityType: entityData.entityType,
        entityId: entityData.entityId,
        action: isSoftDelete ? AuditAction.SOFT_DELETE : AuditAction.DELETE,
        actorType: context.actorType,
        actorId: context.actorId,
        oldValues: entityData.oldValues,
        metadata: entityData.metadata,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      this.logger.log(
        `Entity ${isSoftDelete ? 'soft deleted' : 'deleted'}: ${entityData.entityType}:${entityData.entityId}`,
        'AuditService',
        {
          operation: 'entity_deletion',
          userId: context.actorId,
          metadata: {
            entityType: entityData.entityType,
            entityId: entityData.entityId,
            actorType: context.actorType,
            isSoftDelete,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to log entity deletion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
      );
    }
  }

  /**
   * Log point transaction (add, deduct, expire)
   */
  async logPointTransaction(
    transactionData: PointTransactionAuditData,
    transactionType: TransactionType,
    context: AuditContext,
  ): Promise<void> {
    try {
      // Create audit log
      const auditAction = this.getAuditActionForTransactionType(transactionType);
      await this.auditLogRepository.create({
        entityType: 'Point',
        entityId: transactionData.pointId,
        action: auditAction,
        actorType: context.actorType,
        actorId: context.actorId,
        metadata: {
          memberId: transactionData.memberId,
          amount: transactionData.amount,
          description: transactionData.description,
          balanceBefore: transactionData.balanceBefore,
          balanceAfter: transactionData.balanceAfter,
          ...transactionData.metadata,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      // Create transaction history
      await this.transactionHistoryRepository.create({
        memberId: transactionData.memberId,
        transactionType,
        entityType: 'Point',
        entityId: transactionData.pointId,
        amount: transactionData.amount,
        description: transactionData.description,
        metadata: transactionData.metadata,
        balanceBefore: transactionData.balanceBefore,
        balanceAfter: transactionData.balanceAfter,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      this.logger.log(
        `Point transaction logged: ${transactionType} for member ${transactionData.memberId}`,
        'AuditService',
        {
          operation: 'point_transaction',
          userId: context.actorId,
          metadata: {
            memberId: transactionData.memberId,
            transactionType,
            amount: transactionData.amount,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to log point transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
      );
    }
  }

  /**
   * Log privilege transaction (grant, expire, revoke)
   */
  async logPrivilegeTransaction(
    transactionData: PrivilegeTransactionAuditData,
    transactionType: TransactionType,
    context: AuditContext,
  ): Promise<void> {
    try {
      // Create audit log
      const auditAction = this.getAuditActionForTransactionType(transactionType);
      await this.auditLogRepository.create({
        entityType: 'Privilege',
        entityId: transactionData.privilegeId,
        action: auditAction,
        actorType: context.actorType,
        actorId: context.actorId,
        metadata: {
          memberId: transactionData.memberId,
          privilegeName: transactionData.privilegeName,
          pointCost: transactionData.pointCost,
          ...transactionData.metadata,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      // Create transaction history
      await this.transactionHistoryRepository.create({
        memberId: transactionData.memberId,
        transactionType,
        entityType: 'Privilege',
        entityId: transactionData.privilegeId,
        amount: transactionData.pointCost,
        description: `${transactionType.toLowerCase().replace('_', ' ')} privilege: ${transactionData.privilegeName}`,
        metadata: transactionData.metadata,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      this.logger.log(
        `Privilege transaction logged: ${transactionType} for member ${transactionData.memberId}`,
        'AuditService',
        {
          operation: 'privilege_transaction',
          userId: context.actorId,
          metadata: {
            memberId: transactionData.memberId,
            transactionType,
            privilegeName: transactionData.privilegeName,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to log privilege transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
      );
    }
  }

  /**
   * Log login attempt
   */
  async logLoginAttempt(
    attemptData: LoginAttemptAuditData,
  ): Promise<void> {
    try {
      await this.loginAttemptRepository.create({
        emailOrUsername: attemptData.emailOrUsername,
        actorType: attemptData.actorType,
        success: attemptData.success,
        failureReason: attemptData.failureReason,
        ipAddress: attemptData.ipAddress,
        userAgent: attemptData.userAgent,
        traceId: RequestContext.getTraceId(),
      });

      this.logger.log(
        `Login attempt logged: ${attemptData.success ? 'successful' : 'failed'} for ${attemptData.emailOrUsername}`,
        'AuditService',
        {
          operation: 'login_attempt',
          metadata: {
            emailOrUsername: attemptData.emailOrUsername,
            actorType: attemptData.actorType,
            success: attemptData.success,
            failureReason: attemptData.failureReason,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to log login attempt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
      );
    }
  }

  /**
   * Log admin action on member account
   */
  async logAdminAction(
    action: AuditAction,
    entityData: EntityAuditData,
    adminId: string,
    context: Partial<AuditContext> = {},
  ): Promise<void> {
    try {
      await this.auditLogRepository.create({
        entityType: entityData.entityType,
        entityId: entityData.entityId,
        action,
        actorType: ActorType.ADMIN,
        actorId: adminId,
        oldValues: entityData.oldValues,
        newValues: entityData.newValues,
        metadata: {
          ...entityData.metadata,
          adminAction: true,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        traceId: context.traceId || RequestContext.getTraceId(),
      });

      this.logger.log(
        `Admin action logged: ${action} on ${entityData.entityType}:${entityData.entityId} by admin ${adminId}`,
        'AuditService',
        {
          operation: 'admin_action',
          userId: adminId,
          metadata: {
            action,
            entityType: entityData.entityType,
            entityId: entityData.entityId,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to log admin action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
      );
    }
  }

  /**
   * Check for suspicious login activity
   */
  async checkSuspiciousLoginActivity(
    emailOrUsername: string,
    ipAddress?: string,
  ): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    recommendedAction: string;
  }> {
    try {
      const reasons: string[] = [];
      let isSuspicious = false;

      // Check failed attempts in last 15 minutes
      const recentFailedAttempts = await this.loginAttemptRepository.getFailedAttemptsCount(
        emailOrUsername,
        15,
      );

      if (recentFailedAttempts >= 5) {
        isSuspicious = true;
        reasons.push(`${recentFailedAttempts} failed attempts in last 15 minutes`);
      }

      // Check IP-based suspicious activity if IP is provided
      if (ipAddress) {
        const ipActivity = await this.loginAttemptRepository.checkSuspiciousActivity(
          ipAddress,
          24,
        );

        if (ipActivity.isSuspicious) {
          isSuspicious = true;
          reasons.push(
            `Suspicious IP activity: ${ipActivity.failedAttempts} failed attempts, ${ipActivity.uniqueAccounts} unique accounts`,
          );
        }
      }

      const recommendedAction = isSuspicious
        ? recentFailedAttempts >= 10
          ? 'BLOCK_ACCOUNT'
          : 'REQUIRE_ADDITIONAL_VERIFICATION'
        : 'ALLOW';

      return {
        isSuspicious,
        reasons,
        recommendedAction,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check suspicious login activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'AuditService',
      );

      return {
        isSuspicious: false,
        reasons: ['Error checking suspicious activity'],
        recommendedAction: 'ALLOW',
      };
    }
  }

  private getAuditActionForTransactionType(transactionType: TransactionType): AuditAction {
    const mapping: Record<TransactionType, AuditAction> = {
      [TransactionType.POINT_EARNED]: AuditAction.POINT_ADD,
      [TransactionType.POINT_DEDUCTED]: AuditAction.POINT_DEDUCT,
      [TransactionType.POINT_EXPIRED]: AuditAction.POINT_EXPIRE,
      [TransactionType.POINT_EXCHANGED]: AuditAction.PRIVILEGE_EXCHANGE,
      [TransactionType.PRIVILEGE_GRANTED]: AuditAction.PRIVILEGE_GRANT,
      [TransactionType.PRIVILEGE_EXPIRED]: AuditAction.PRIVILEGE_REVOKE,
      [TransactionType.PRIVILEGE_REVOKED]: AuditAction.PRIVILEGE_REVOKE,
    };

    return mapping[transactionType] || AuditAction.UPDATE;
  }
}