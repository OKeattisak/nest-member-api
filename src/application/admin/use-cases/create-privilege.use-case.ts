import { Injectable } from '@nestjs/common';
import { BaseCommand, ApplicationResult } from '../../common';
import { CreatePrivilegeRequest } from '../dto/admin-privilege.dto';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';
import { AuditService } from '../../../domains/audit/services/audit.service';

@Injectable()
export class CreatePrivilegeUseCase extends BaseCommand<CreatePrivilegeRequest, ApplicationResult<{ privilegeId: string }>> {
  constructor(
    private readonly privilegeService: PrivilegeService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async execute(request: CreatePrivilegeRequest): Promise<ApplicationResult<{ privilegeId: string }>> {
    try {
      // 1. Validate privilege data
      if (request.pointsCost <= 0) {
        return ApplicationResult.failure('Points cost must be positive', 'INVALID_POINTS_COST');
      }

      // 2. Create privilege (validation for existing name is handled in the service)
      const privilege = await this.privilegeService.createPrivilege({
        name: request.name,
        description: request.description,
        pointCost: request.pointsCost,
        validityDays: request.validUntil ? 
          Math.ceil((request.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
          undefined,
      });

      // 3. Log the creation for audit
      await this.auditService.logAdminAction(
        'CREATE',
        {
          entityType: 'Privilege',
          entityId: privilege.id,
          newValues: {
            name: request.name,
            description: request.description,
            pointsCost: request.pointsCost,
            category: request.category,
          },
          metadata: {
            action: 'privilege_creation',
            validFrom: request.validFrom?.toISOString(),
            validUntil: request.validUntil?.toISOString(),
            maxRedemptions: request.maxRedemptions,
          },
        },
        request.adminId,
      );

      // 4. Return success with privilege ID
      return ApplicationResult.success({ privilegeId: privilege.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return ApplicationResult.failure(errorMessage, 'CREATE_PRIVILEGE_FAILED');
    }
  }
}