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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AdminJwtGuard } from '@/common/guards/admin-jwt.guard';
import { CurrentAdmin, CurrentAdminData } from '@/common/decorators/current-admin.decorator';
import { PrivilegeService } from '@/domains/privilege/services/privilege.service';
import { 
  CreatePrivilegeDto, 
  UpdatePrivilegeDto, 
  PrivilegeFiltersDto, 
  PrivilegeResponseDto 
} from '@/domains/admin/dto/privilege-management.dto';
import { PaginationDto } from '@/domains/admin/dto/member-management.dto';
import { ApiSuccessResponse, PaginationMeta } from '@/common/interfaces/api-response.interface';
import { ApiDocumentationHelper } from '@/common/swagger/api-documentation.helper';

@ApiTags('Admin Privileges')
@Controller('admin/privileges')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class AdminPrivilegeController {
  private readonly logger = new Logger(AdminPrivilegeController.name);

  constructor(private readonly privilegeService: PrivilegeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new privilege',
    description: 'Create a new privilege that members can exchange points for. Privileges can have optional expiration periods.'
  })
  @ApiBody({
    type: CreatePrivilegeDto,
    description: 'Privilege creation details',
    examples: {
      'premium-access': {
        summary: 'Premium access privilege',
        description: 'Create a premium access privilege with 30-day validity',
        value: {
          name: 'Premium Access',
          description: 'Access to premium features and exclusive content',
          pointCost: 500,
          validityDays: 30
        }
      },
      'permanent-privilege': {
        summary: 'Permanent privilege',
        description: 'Create a privilege without expiration',
        value: {
          name: 'VIP Status',
          description: 'Permanent VIP status with lifetime benefits',
          pointCost: 2000
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Privilege created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: ApiDocumentationHelper.SCHEMAS.PRIVILEGE,
        message: { type: 'string', example: 'Privilege created successfully' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2023-12-01T11:00:00.000Z' },
            traceId: { type: 'string', example: 'trace-priv123' }
          }
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.DUPLICATE_RESOURCE)
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
  @ApiOperation({
    summary: 'Get all privileges',
    description: 'Retrieve paginated list of privileges with optional filtering by name, active status, or search term.'
  })
  @ApiQuery(ApiDocumentationHelper.QUERY_PARAMS.PAGE)
  @ApiQuery(ApiDocumentationHelper.QUERY_PARAMS.LIMIT)
  @ApiQuery(ApiDocumentationHelper.QUERY_PARAMS.SEARCH)
  @ApiQuery(ApiDocumentationHelper.QUERY_PARAMS.IS_ACTIVE)
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by privilege name (exact match)'
  })
  @ApiResponse(ApiDocumentationHelper.createPaginatedResponse(
    ApiDocumentationHelper.SCHEMAS.PRIVILEGE,
    'Privileges retrieved successfully'
  ))
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
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
  @ApiOperation({
    summary: 'Get privilege by ID',
    description: 'Retrieve detailed information about a specific privilege by its unique identifier.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the privilege',
    example: 'clpr123456789'
  })
  @ApiResponse(ApiDocumentationHelper.createSuccessResponse(
    ApiDocumentationHelper.SCHEMAS.PRIVILEGE,
    'Privilege retrieved successfully'
  ))
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
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
  @ApiOperation({
    summary: 'Update privilege',
    description: 'Update an existing privilege. All fields are optional - only provided fields will be updated.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the privilege to update',
    example: 'clpr123456789'
  })
  @ApiBody({
    type: UpdatePrivilegeDto,
    description: 'Privilege update details',
    examples: {
      'update-cost': {
        summary: 'Update point cost',
        description: 'Update only the point cost of a privilege',
        value: {
          pointCost: 750
        }
      },
      'full-update': {
        summary: 'Full privilege update',
        description: 'Update multiple fields of a privilege',
        value: {
          name: 'Premium Plus Access',
          description: 'Enhanced premium access with additional features',
          pointCost: 800,
          validityDays: 45,
          isActive: true
        }
      }
    }
  })
  @ApiResponse(ApiDocumentationHelper.createSuccessResponse(
    ApiDocumentationHelper.SCHEMAS.PRIVILEGE,
    'Privilege updated successfully'
  ))
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.VALIDATION_ERROR)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
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
  @ApiOperation({
    summary: 'Activate privilege',
    description: 'Activate a privilege, making it available for members to exchange points for.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the privilege to activate',
    example: 'clpr123456789'
  })
  @ApiResponse(ApiDocumentationHelper.createSuccessResponse(
    ApiDocumentationHelper.SCHEMAS.PRIVILEGE,
    'Privilege activated successfully'
  ))
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
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
  @ApiOperation({
    summary: 'Deactivate privilege',
    description: 'Deactivate a privilege, preventing new exchanges while preserving existing member privileges.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the privilege to deactivate',
    example: 'clpr123456789'
  })
  @ApiResponse(ApiDocumentationHelper.createSuccessResponse(
    ApiDocumentationHelper.SCHEMAS.PRIVILEGE,
    'Privilege deactivated successfully'
  ))
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
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
  @ApiOperation({
    summary: 'Delete privilege',
    description: 'Permanently delete a privilege. This action cannot be undone and will affect existing member privileges.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the privilege to delete',
    example: 'clpr123456789'
  })
  @ApiResponse({
    status: 204,
    description: 'Privilege deleted successfully'
  })
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.UNAUTHORIZED)
  @ApiResponse(ApiDocumentationHelper.COMMON_ERRORS.NOT_FOUND)
  async deletePrivilege(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<void> {
    this.logger.log(`Admin ${admin.id} deleting privilege: ${id}`);

    await this.privilegeService.deletePrivilege(id);

    this.logger.log(`Successfully deleted privilege: ${id}`);
  }
}