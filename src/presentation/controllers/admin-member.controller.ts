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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminJwtGuard } from '@/common/guards/admin-jwt.guard';
import { CurrentAdmin, CurrentAdminData } from '@/common/decorators/current-admin.decorator';
import { MemberService } from '@/domains/member/services/member.service';
import { 
  CreateMemberDto, 
  UpdateMemberDto, 
  MemberFiltersDto, 
  PaginationDto, 
  MemberResponseDto 
} from '@/domains/admin/dto/member-management.dto';
import { ApiSuccessResponse, PaginationMeta } from '@/common/interfaces/api-response.interface';

@ApiTags('Admin Members')
@ApiBearerAuth('admin-auth')
@Controller('admin/members')
@UseGuards(AdminJwtGuard)
export class AdminMemberController {
  private readonly logger = new Logger(AdminMemberController.name);

  constructor(private readonly memberService: MemberService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create new member',
    description: 'Create a new member account (Admin only)'
  })
  @ApiBody({
    type: CreateMemberDto,
    description: 'Member creation data'
  })
  @ApiResponse({
    status: 201,
    description: 'Member created successfully'
  })
  async createMember(
    @Body() createMemberDto: CreateMemberDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<MemberResponseDto>> {
    this.logger.log(`Admin ${admin.id} creating new member: ${createMemberDto.email}`);

    const member = await this.memberService.registerMember({
      email: createMemberDto.email,
      username: createMemberDto.username,
      password: createMemberDto.password,
      firstName: createMemberDto.firstName,
      lastName: createMemberDto.lastName,
    });

    const responseData: MemberResponseDto = {
      id: member.id,
      email: member.email,
      username: member.username,
      firstName: member.firstName,
      lastName: member.lastName,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };

    this.logger.log(`Successfully created member: ${member.id}`);

    return {
      success: true,
      data: responseData,
      message: 'Member created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all members',
    description: 'Retrieve paginated list of members with optional filters (Admin only)'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({
    status: 200,
    description: 'Members retrieved successfully'
  })
  async getMembers(
    @Query() filters: MemberFiltersDto,
    @Query() pagination: PaginationDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<MemberResponseDto[]>> {
    this.logger.log(`Admin ${admin.id} fetching members with filters:`, filters);

    // This would need to be implemented in MemberService
    // For now, we'll create a placeholder response
    const members: MemberResponseDto[] = [];
    const total = 0;
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const totalPages = Math.ceil(total / limit);

    const paginationMeta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      success: true,
      data: members,
      message: 'Members retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
        pagination: paginationMeta,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get member by ID',
    description: 'Retrieve a specific member by their ID (Admin only)'
  })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({
    status: 200,
    description: 'Member retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Member not found'
  })
  async getMemberById(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<MemberResponseDto>> {
    this.logger.log(`Admin ${admin.id} fetching member: ${id}`);

    const member = await this.memberService.getMemberById(id);

    const responseData: MemberResponseDto = {
      id: member.id,
      email: member.email,
      username: member.username,
      firstName: member.firstName,
      lastName: member.lastName,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };

    return {
      success: true,
      data: responseData,
      message: 'Member retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Put(':id')
  async updateMember(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<ApiSuccessResponse<MemberResponseDto>> {
    this.logger.log(`Admin ${admin.id} updating member: ${id}`);

    const member = await this.memberService.updateMemberProfile(id, {
      firstName: updateMemberDto.firstName,
      lastName: updateMemberDto.lastName,
      username: updateMemberDto.username,
    });

    // Handle isActive separately if provided
    if (updateMemberDto.isActive !== undefined && !updateMemberDto.isActive) {
      await this.memberService.deactivateMember(id);
    }

    const responseData: MemberResponseDto = {
      id: member.id,
      email: member.email,
      username: member.username,
      firstName: member.firstName,
      lastName: member.lastName,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };

    this.logger.log(`Successfully updated member: ${id}`);

    return {
      success: true,
      data: responseData,
      message: 'Member updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMember(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminData,
  ): Promise<void> {
    this.logger.log(`Admin ${admin.id} deleting member: ${id}`);

    await this.memberService.softDeleteMember(id);

    this.logger.log(`Successfully deleted member: ${id}`);
  }
}