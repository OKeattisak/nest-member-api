import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { UpdatePrivilegeRequest } from '../dto/admin-privilege.dto';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';
import { AuditService } from '../../../domains/audit/services/audit.service';

@Injectable()
export class UpdatePrivilegeUseCase extends BaseCommand<UpdatePrivilegeRequest, ApplicationResult<void>> {
  constructor(
    private readonly privilegeService: PrivilegeService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async execute(request: UpdatePrivilegeRequest): Promise<ApplicationResult<void>> {
    try {
      // 1. Verify privilege exists and get current values for audit
      const existingPrivilege = await this.privilegeService.getPrivilegeById(request.privilegeId);

      // 2. Validate updates
      if (request.pointsCost !== undefined && request.pointsCost <= 0) {
        return ApplicationResult.failure('Points cost must be positive', 'INVALID_POINTS_COST');
      }

      // 3. Prepare update data
      const updateData: any = {};
      if (request.name !== undefined) updateData.name = request.name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.pointsCost !== undefined) updateData.pointCost = request.pointsCost;
      if (request.validUntil !== undefined) {
        updateData.validityDays = request.validUntil ? 
          Math.ceil((request.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
          undefined;
      }

      // 4. Update privilege
      await this.privilegeService.updatePrivilege(request.privilegeId, updateData);

      // 5. Activate/deactivate if requested
      if (request.isActive !== undefined) {
        if (request.isActive) {
          await this.privilegeService.activatePrivilege(request.privilegeId);
        } else {
          await this.privilegeService.deactivatePrivilege(request.privilegeId);
        }
      }

      // 6. Log the update for audit
      await this.auditService.logAdminAction(
        'UPDATE',
        {
          entityType: 'Privilege',
          entityId: request.privilegeId,
          oldValues: {
            name: existingPrivilege.name,
            description: existingPrivilege.description,
            pointsCost: existingPrivilege.pointCost,
            isActive: existingPrivilege.isActive,
          },
          newValues: {
            name: request.name || existingPrivilege.name,
            description: request.description || existingPrivilege.description,
            pointsCost: request.pointsCost || existingPrivilege.pointCost,
            isActive: request.isActive !== undefined ? request.isActive : existingPrivilege.isActive,
          },
          metadata: {
            action: 'privilege_update',
            category: request.category,
            validFrom: request.validFrom?.toISOString(),
            validUntil: request.validUntil?.toISOString(),
            maxRedemptions: request.maxRedemptions,
          },
        },
        request.adminId,
      );

      // 7. Return success
      return ApplicationResult.success();
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'UPDATE_PRIVILEGE_FAILED'
      );
    }
  }
}