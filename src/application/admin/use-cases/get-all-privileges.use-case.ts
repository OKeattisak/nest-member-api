import { Injectable } from '@nestjs/common';
import { BaseQuery, ApplicationResult } from '../../common';
import { GetAllPrivilegesRequest, GetAllPrivilegesResponse } from '../dto/admin-privilege.dto';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';

@Injectable()
export class GetAllPrivilegesUseCase extends BaseQuery<GetAllPrivilegesRequest, ApplicationResult<GetAllPrivilegesResponse>> {
  constructor(
    private readonly privilegeService: PrivilegeService,
  ) {
    super();
  }

  async execute(request: GetAllPrivilegesRequest): Promise<ApplicationResult<GetAllPrivilegesResponse>> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 20;

      // 1. Get privileges with pagination and filters
      const filters = {
        isActive: request.isActive,
        // Note: Current PrivilegeService doesn't support category filtering
        // This would need to be added to the repository interface
      };

      const result = await this.privilegeService.getPrivileges(filters, { page, limit });

      // 2. Transform privileges to match DTO format
      const transformedPrivileges = result.data.map(privilege => ({
        id: privilege.id,
        name: privilege.name,
        description: privilege.description,
        pointsCost: privilege.pointCost,
        category: 'General', // Default category since not available in current entity
        validFrom: undefined, // Not available in current entity
        validUntil: privilege.validityDays ? 
          new Date(Date.now() + privilege.validityDays * 24 * 60 * 60 * 1000) : 
          undefined,
        maxRedemptions: undefined, // Not available in current entity
        currentRedemptions: 0, // Would need to be calculated from member privileges
        isActive: privilege.isActive,
        createdAt: privilege.createdAt,
        updatedAt: privilege.updatedAt,
      }));

      // 3. Return response
      return ApplicationResult.success({
        privileges: transformedPrivileges,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'GET_PRIVILEGES_FAILED'
      );
    }
  }
}