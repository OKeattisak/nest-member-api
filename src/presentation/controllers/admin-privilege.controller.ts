import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Logger 
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CurrentAdmin, CurrentAdminData } from '../../common/decorators/current-admin.decorator';
import { PrivilegeService } from '../../domains/privilege/services/privilege.service';
import { 
  CreatePrivilegeDto, 
  UpdatePrivilegeDto, 
  PrivilegeFiltersDto, 
  PrivilegeResponseDto 
} from '../../domains/admin/dto/privilege-management.dto';
import { PaginationDto } from '../../domains/admin/dto/member-management.dto';
import { ApiSuccessResponse, PaginationMeta } from '../../common/interfaces/api-response.interface';

@Controller('admin/privileges')
@UseGuards(AdminJwtGuard)
export class AdminPrivilegeController {
  private readonly logger = new Logger(AdminPrivilegeController.name);

  constructor(private readonly privilegeService: PrivilegeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPrivilege(
    @Body() createPrivilegeDto: CreatePrivilegeDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PrivilegeResponseDto>> {
    this.logger.log(`Admin ${admin.id} creating new privilege: ${createPrivilegeDto.name}`);

    const privilege = await this.privilegeService.createPrivilege({
      name: createPrivilegeDto.name,
      description: createPrivilegeDto.description,
      pointCost: createPrivilegeDto.pointCost,
      validityDays: createPrivilegeDto.validityDays,
    });

    const responseData: PrivilegeResponseDto = {
      id: privilege.id,
      name: privilege.name,
      description: privilege.description,
      pointCost: privilege.pointCost,
      isActive: privilege.isActive,
      validityDays: privilege.validityDays,
      createdAt: privilege.createdAt,
      updatedAt: privilege.updatedAt,
    };

    this.logger.log(`Successfully created privilege: ${privilege.id}`);

    return {
      success: true,
      data: responseData,
      message: 'Privilege created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get()
  async getPrivileges(
    @Query() filters: PrivilegeFiltersDto,
    @Query() pagination: PaginationDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PrivilegeResponseDto[]>> {
    this.logger.log(`Admin ${admin.id} fetching privileges with filters:`, filters);

    const result = await this.privilegeService.getPrivileges(
      {
        name: filters.name,
        isActive: filters.isActive,
        search: filters.search,
      },
      {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
      }
    );

    const responseData: PrivilegeResponseDto[] = result.data.map(privilege => ({
      id: privilege.id,
      name: privilege.name,
      description: privilege.description,
      pointCost: privilege.pointCost,
      isActive: privilege.isActive,
      validityDays: privilege.validityDays,
      createdAt: privilege.createdAt,
      updatedAt: privilege.updatedAt,
    }));

    const paginationMeta: PaginationMeta = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1,
    };

    return {
      success: true,
      data: responseData,
      message: 'Privileges retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
        pagination: paginationMeta,
      },
    };
  }

  @Get(':id')
  async getPrivilegeById(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PrivilegeResponseDto>> {
    this.logger.log(`Admin ${admin.id} fetching privilege: ${id}`);

    const privilege = await this.privilegeService.getPrivilegeById(id);

    const responseData: PrivilegeResponseDto = {
      id: privilege.id,
      name: privilege.name,
      description: privilege.description,
      pointCost: privilege.pointCost,
      isActive: privilege.isActive,
      validityDays: privilege.validityDays,
      createdAt: privilege.createdAt,
      updatedAt: privilege.updatedAt,
    };

    return {
      success: true,
      data: responseData,
      message: 'Privilege retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Put(':id')
  async updatePrivilege(
    @Param('id') id: string,
    @Body() updatePrivilegeDto: UpdatePrivilegeDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PrivilegeResponseDto>> {
    this.logger.log(`Admin ${admin.id} updating privilege: ${id}`);

    const privilege = await this.privilegeService.updatePrivilege(id, {
      name: updatePrivilegeDto.name,
      description: updatePrivilegeDto.description,
      pointCost: updatePrivilegeDto.pointCost,
      validityDays: updatePrivilegeDto.validityDays,
      isActive: updatePrivilegeDto.isActive,
    });

    const responseData: PrivilegeResponseDto = {
      id: privilege.id,
      name: privilege.name,
      description: privilege.description,
      pointCost: privilege.pointCost,
      isActive: privilege.isActive,
      validityDays: privilege.validityDays,
      createdAt: privilege.createdAt,
      updatedAt: privilege.updatedAt,
    };

    this.logger.log(`Successfully updated privilege: ${id}`);

    return {
      success: true,
      data: responseData,
      message: 'Privilege updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Put(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activatePrivilege(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PrivilegeResponseDto>> {
    this.logger.log(`Admin ${admin.id} activating privilege: ${id}`);

    const privilege = await this.privilegeService.activatePrivilege(id);

    const responseData: PrivilegeResponseDto = {
      id: privilege.id,
      name: privilege.name,
      description: privilege.description,
      pointCost: privilege.pointCost,
      isActive: privilege.isActive,
      validityDays: privilege.validityDays,
      createdAt: privilege.createdAt,
      updatedAt: privilege.updatedAt,
    };

    this.logger.log(`Successfully activated privilege: ${id}`);

    return {
      success: true,
      data: responseData,
      message: 'Privilege activated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Put(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivatePrivilege(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<PrivilegeResponseDto>> {
    this.logger.log(`Admin ${admin.id} deactivating privilege: ${id}`);

    const privilege = await this.privilegeService.deactivatePrivilege(id);

    const responseData: PrivilegeResponseDto = {
      id: privilege.id,
      name: privilege.name,
      description: privilege.description,
      pointCost: privilege.pointCost,
      isActive: privilege.isActive,
      validityDays: privilege.validityDays,
      createdAt: privilege.createdAt,
      updatedAt: privilege.updatedAt,
    };

    this.logger.log(`Successfully deactivated privilege: ${id}`);

    return {
      success: true,
      data: responseData,
      message: 'Privilege deactivated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePrivilege(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<void> {
    this.logger.log(`Admin ${admin.id} deleting privilege: ${id}`);

    await this.privilegeService.deletePrivilege(id);

    this.logger.log(`Successfully deleted privilege: ${id}`);
  }
}