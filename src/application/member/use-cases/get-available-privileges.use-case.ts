import { Injectable } from '@nestjs/common';
import { BaseQuery, ApplicationResult } from '../../common';
import { GetAvailablePrivilegesRequest, AvailablePrivilege } from '../dto/privilege-exchange.dto';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';
import { MemberService } from '../../../domains/member/services/member.service';
import { PointService } from '../../../domains/point/services/point.service';

@Injectable()
export class GetAvailablePrivilegesUseCase extends BaseQuery<GetAvailablePrivilegesRequest, ApplicationResult<AvailablePrivilege[]>> {
  constructor(
    private readonly privilegeService: PrivilegeService,
    private readonly memberService: MemberService,
    private readonly pointService: PointService,
  ) {
    super();
  }

  async execute(request: GetAvailablePrivilegesRequest): Promise<ApplicationResult<AvailablePrivilege[]>> {
    try {
      // 1. Verify member exists
      await this.memberService.getMemberById(request.memberId);

      // 2. Get all available privileges
      const privileges = await this.privilegeService.getAvailablePrivileges();

      // 3. Get member's current point balance
      const memberPoints = await this.pointService.getAvailableBalance(request.memberId);

      // 4. Transform privileges to include availability status
      const availablePrivileges: AvailablePrivilege[] = privileges
        .filter(privilege => {
          // Filter by category if specified
          if (request.category) {
            // Note: Current privilege entity doesn't have category, so we'll skip this filter for now
            return true;
          }
          return true;
        })
        .map(privilege => ({
          id: privilege.id,
          name: privilege.name,
          description: privilege.description,
          pointsCost: privilege.pointCost,
          category: 'General', // Default category since not available in current entity
          isAvailable: memberPoints >= privilege.pointCost && privilege.isActive,
          validUntil: undefined, // Not available in current privilege entity
        }));

      // 5. Return response
      return ApplicationResult.success(availablePrivileges);
    } catch (error) {
      return ApplicationResult.failure(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'GET_PRIVILEGES_FAILED'
      );
    }
  }
}