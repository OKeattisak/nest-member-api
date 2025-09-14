import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { DeletePrivilegeRequest } from '../dto/admin-privilege.dto';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';
import { AuditService } from '../../../domains/audit/services/audit.service';

@Injectable()
export class DeletePrivilegeUseCase extends BaseCommand<DeletePrivilegeRequest, ApplicationResult<void>> {
  constructor(
    private readonly privilegeService: PrivilegeService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async execute(request: DeletePrivilegeRequest): Promise<ApplicationResult<void>> {
    try {
      // 1. Verify privilege exists and get details for audit
      const privilege = await this.privilegeService.getPrivilegeById(request.privilegeId);

      // 2. Check if privilege has active redemptions (soft delete instead of hard delete)
      // For now, we'll deactivate the privilege instead of deleting it
      // This is safer as it preserves data integrity

      // 3. Deactivate the privilege (soft delete)
      await this.privilegeService.deactivatePrivilege(request.privilegeId);

      // 4. Log the deletion for audit
      await this.auditService.logAdminAction(
        'SOFT_DELETE',
        {
          entityType: 'Privilege',
          entityId: request.privilegeId,
          oldValues: {
            name: privilege.name,
            description: privilege.description,
            pointsCost: privilege.pointCost,
            isActive: privilege.isActive,
          },
          metadata: {
            action: 'privilege_deletion',
            deletionType: 'soft_delete',
            reason: 'Admin requested deletion',
          },
        },
        request.adminId,
      );

      // 5. Return success
      return ApplicationResult.success();
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'DELETE_PRIVILEGE_FAILED'
      );
    }
  }
}