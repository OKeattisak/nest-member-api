import { Injectable, Logger, Inject } from '@nestjs/common';
import { Privilege as PrismaPrivilege, MemberPrivilege as PrismaMemberPrivilege } from '@prisma/client';
import { IPrivilegeRepository, IMemberPrivilegeRepository, CreatePrivilegeData, UpdatePrivilegeData, PrivilegeFilters, MemberPrivilegeWithDetails } from '../repositories/privilege.repository.interface';
import { PointService } from '@/domains/point/services/point.service';
import { Privilege } from '../entities/privilege.entity';
import { PointAmount } from '@/domains/common/value-objects';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';
import { BusinessRuleException, NotFoundExceptionDomain, ValidationException } from '@/common/exceptions/domain.exception';

export interface ExchangePrivilegeData {
  memberId: string;
  privilegeId: string;
}

export interface MemberPrivilegeInfo {
  id: string;
  privilegeId: string;
  privilegeName: string;
  privilegeDescription: string;
  pointCost: number;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining?: number;
}

export interface PrivilegeExchangeResult {
  memberPrivilegeId: string;
  privilegeName: string;
  pointsDeducted: number;
  expiresAt?: Date;
  exchangedAt: Date;
}

@Injectable()
export class PrivilegeService {
  private readonly logger = new Logger(PrivilegeService.name);

  constructor(
    @Inject('IPrivilegeRepository') private readonly privilegeRepository: IPrivilegeRepository,
    @Inject('IMemberPrivilegeRepository') private readonly memberPrivilegeRepository: IMemberPrivilegeRepository,
    @Inject('IPointService') private readonly pointService: PointService
  ) {}

  /**
   * Create a new privilege
   */
  async createPrivilege(data: CreatePrivilegeData): Promise<Privilege> {
    this.logger.log(`Creating new privilege: ${data.name}`);

    try {
      // Check if privilege name already exists
      const existingPrivilege = await this.privilegeRepository.findByName(data.name);
      if (existingPrivilege) {
        throw new ValidationException(`Privilege with name '${data.name}' already exists`);
      }

      // Validate business rules without creating entity (since ID is not available yet)
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationException('Privilege name is required');
      }
      if (!data.description || data.description.trim().length === 0) {
        throw new ValidationException('Privilege description is required');
      }
      if (data.pointCost < 0) {
        throw new ValidationException('Point cost cannot be negative');
      }

      // Create in database
      const createdPrivilege = await this.privilegeRepository.create(data);
      
      this.logger.log(`Successfully created privilege: ${data.name} with ID: ${createdPrivilege.id}`);
      
      return this.toDomainEntity(createdPrivilege);
    } catch (error) {
      this.logger.error(`Failed to create privilege '${data.name}':`, error);
      throw error;
    }
  }

  /**
   * Update an existing privilege
   */
  async updatePrivilege(privilegeId: string, data: UpdatePrivilegeData): Promise<Privilege> {
    this.logger.log(`Updating privilege: ${privilegeId}`);

    try {
      // Check if privilege exists
      const existingPrivilege = await this.privilegeRepository.findById(privilegeId);
      if (!existingPrivilege) {
        throw new NotFoundExceptionDomain('Privilege', privilegeId);
      }

      // Check name uniqueness if name is being updated
      if (data.name && data.name !== existingPrivilege.name) {
        const privilegeWithSameName = await this.privilegeRepository.findByName(data.name);
        if (privilegeWithSameName && privilegeWithSameName.id !== privilegeId) {
          throw new ValidationException(`Privilege with name '${data.name}' already exists`);
        }
      }

      // Create domain entity to validate business rules
      const privilegeEntity = this.toDomainEntity(existingPrivilege);
      
      // Apply updates using domain methods
      if (data.name !== undefined || data.description !== undefined || 
          data.pointCost !== undefined || data.validityDays !== undefined) {
        privilegeEntity.update({
          name: data.name,
          description: data.description,
          pointCost: data.pointCost,
          validityDays: data.validityDays
        });
      }

      // Update in database
      const updatedPrivilege = await this.privilegeRepository.update(privilegeId, data);
      
      this.logger.log(`Successfully updated privilege: ${privilegeId}`);
      
      return this.toDomainEntity(updatedPrivilege);
    } catch (error) {
      this.logger.error(`Failed to update privilege '${privilegeId}':`, error);
      throw error;
    }
  }

  /**
   * Get privilege by ID
   */
  async getPrivilegeById(privilegeId: string): Promise<Privilege> {
    try {
      const privilege = await this.privilegeRepository.findById(privilegeId);
      if (!privilege) {
        throw new NotFoundExceptionDomain('Privilege', privilegeId);
      }
      
      return this.toDomainEntity(privilege);
    } catch (error) {
      this.logger.error(`Failed to get privilege '${privilegeId}':`, error);
      throw error;
    }
  }

  /**
   * Get all available privileges for exchange
   */
  async getAvailablePrivileges(): Promise<Privilege[]> {
    this.logger.debug('Fetching available privileges for exchange');

    try {
      const privileges = await this.privilegeRepository.findActivePrivileges();
      return privileges.map(p => this.toDomainEntity(p));
    } catch (error) {
      this.logger.error('Failed to get available privileges:', error);
      throw new Error(`Failed to get available privileges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get privileges with pagination and filtering
   */
  async getPrivileges(filters: PrivilegeFilters, pagination: PaginationOptions): Promise<PaginatedResult<Privilege>> {
    this.logger.debug('Fetching privileges with filters and pagination');

    try {
      const result = await this.privilegeRepository.findMany(filters, pagination);
      
      return {
        ...result,
        data: result.data.map(p => this.toDomainEntity(p))
      };
    } catch (error) {
      this.logger.error('Failed to get privileges:', error);
      throw new Error(`Failed to get privileges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Activate a privilege
   */
  async activatePrivilege(privilegeId: string): Promise<Privilege> {
    this.logger.log(`Activating privilege: ${privilegeId}`);

    try {
      const existingPrivilege = await this.privilegeRepository.findById(privilegeId);
      if (!existingPrivilege) {
        throw new NotFoundExceptionDomain('Privilege', privilegeId);
      }

      const privilegeEntity = this.toDomainEntity(existingPrivilege);
      privilegeEntity.activate();

      const updatedPrivilege = await this.privilegeRepository.update(privilegeId, { isActive: true });
      
      this.logger.log(`Successfully activated privilege: ${privilegeId}`);
      
      return this.toDomainEntity(updatedPrivilege);
    } catch (error) {
      this.logger.error(`Failed to activate privilege '${privilegeId}':`, error);
      throw error;
    }
  }

  /**
   * Deactivate a privilege
   */
  async deactivatePrivilege(privilegeId: string): Promise<Privilege> {
    this.logger.log(`Deactivating privilege: ${privilegeId}`);

    try {
      const existingPrivilege = await this.privilegeRepository.findById(privilegeId);
      if (!existingPrivilege) {
        throw new NotFoundExceptionDomain('Privilege', privilegeId);
      }

      const privilegeEntity = this.toDomainEntity(existingPrivilege);
      privilegeEntity.deactivate();

      const updatedPrivilege = await this.privilegeRepository.update(privilegeId, { isActive: false });
      
      this.logger.log(`Successfully deactivated privilege: ${privilegeId}`);
      
      return this.toDomainEntity(updatedPrivilege);
    } catch (error) {
      this.logger.error(`Failed to deactivate privilege '${privilegeId}':`, error);
      throw error;
    }
  }

  /**
   * Exchange points for a privilege using FIFO logic
   */
  async exchangePrivilege(data: ExchangePrivilegeData): Promise<PrivilegeExchangeResult> {
    this.logger.log(`Processing privilege exchange for member ${data.memberId}, privilege ${data.privilegeId}`);

    try {
      // Get privilege details
      const privilege = await this.privilegeRepository.findById(data.privilegeId);
      if (!privilege) {
        throw new NotFoundExceptionDomain('Privilege', data.privilegeId);
      }

      const privilegeEntity = this.toDomainEntity(privilege);

      // Validate privilege can be exchanged
      if (!privilegeEntity.canBeExchanged()) {
        throw new BusinessRuleException(`Privilege '${privilege.name}' is not available for exchange`);
      }

      // Check if member already has this privilege (if it's not expired)
      const existingMemberPrivilege = await this.memberPrivilegeRepository.findByMemberAndPrivilege(
        data.memberId, 
        data.privilegeId
      );

      if (existingMemberPrivilege && existingMemberPrivilege.isActive) {
        // Check if it's expired
        if (!existingMemberPrivilege.expiresAt || existingMemberPrivilege.expiresAt > new Date()) {
          throw new BusinessRuleException(`Member already has active privilege '${privilege.name}'`);
        }
      }

      // Validate member has sufficient points
      const requiredPoints = new PointAmount(Number(privilege.pointCost));
      const memberBalance = await this.pointService.getAvailableBalance(data.memberId);
      const memberPointAmount = new PointAmount(memberBalance);

      if (!privilegeEntity.isAffordable(memberPointAmount)) {
        throw new BusinessRuleException(
          `Insufficient points for privilege '${privilege.name}'. Required: ${requiredPoints.getValue()}, Available: ${memberBalance}`
        );
      }

      // Deduct points using FIFO logic
      await this.pointService.exchangePoints(
        data.memberId, 
        requiredPoints.getValue(), 
        privilege.name
      );

      // Calculate expiration date
      const grantedAt = new Date();
      const expiresAt = privilegeEntity.calculateExpirationDate(grantedAt);

      // Grant privilege to member
      const memberPrivilege = await this.memberPrivilegeRepository.create({
        memberId: data.memberId,
        privilegeId: data.privilegeId,
        expiresAt: expiresAt || undefined
      });

      this.logger.log(`Successfully exchanged privilege '${privilege.name}' for member ${data.memberId}`);

      return {
        memberPrivilegeId: memberPrivilege.id,
        privilegeName: privilege.name,
        pointsDeducted: requiredPoints.getValue(),
        expiresAt: expiresAt || undefined,
        exchangedAt: grantedAt
      };
    } catch (error) {
      this.logger.error(`Failed to exchange privilege for member ${data.memberId}:`, error);
      throw error;
    }
  }

  /**
   * Get member's privileges
   */
  async getMemberPrivileges(memberId: string): Promise<MemberPrivilegeInfo[]> {
    this.logger.debug(`Fetching privileges for member ${memberId}`);

    try {
      const memberPrivileges = await this.memberPrivilegeRepository.findByMemberId(memberId);
      
      return memberPrivileges.map(mp => this.transformMemberPrivilege(mp));
    } catch (error) {
      this.logger.error(`Failed to get member privileges for ${memberId}:`, error);
      throw new Error(`Failed to get member privileges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get member's active privileges only
   */
  async getActiveMemberPrivileges(memberId: string): Promise<MemberPrivilegeInfo[]> {
    this.logger.debug(`Fetching active privileges for member ${memberId}`);

    try {
      const activePrivileges = await this.memberPrivilegeRepository.findActiveMemberPrivileges(memberId);
      
      return activePrivileges.map(mp => this.transformMemberPrivilege(mp));
    } catch (error) {
      this.logger.error(`Failed to get active member privileges for ${memberId}:`, error);
      throw new Error(`Failed to get active member privileges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate a member's privilege
   */
  async deactivateMemberPrivilege(memberPrivilegeId: string): Promise<void> {
    this.logger.log(`Deactivating member privilege: ${memberPrivilegeId}`);

    try {
      const memberPrivilege = await this.memberPrivilegeRepository.findById(memberPrivilegeId);
      if (!memberPrivilege) {
        throw new NotFoundExceptionDomain('Member privilege', memberPrivilegeId);
      }

      if (!memberPrivilege.isActive) {
        throw new BusinessRuleException('Member privilege is already inactive');
      }

      await this.memberPrivilegeRepository.deactivateMemberPrivilege(memberPrivilegeId);
      
      this.logger.log(`Successfully deactivated member privilege: ${memberPrivilegeId}`);
    } catch (error) {
      this.logger.error(`Failed to deactivate member privilege '${memberPrivilegeId}':`, error);
      throw error;
    }
  }

  /**
   * Process expired member privileges
   */
  async processExpiredMemberPrivileges(): Promise<{ processed: number; errors: string[] }> {
    this.logger.log('Processing expired member privileges');

    const result: { processed: number; errors: string[] } = { processed: 0, errors: [] };

    try {
      // Find privileges expiring today or already expired
      const expiringPrivileges = await this.memberPrivilegeRepository.findExpiringPrivileges(0);
      
      if (expiringPrivileges.length === 0) {
        this.logger.log('No expired member privileges found');
        return result;
      }

      this.logger.log(`Found ${expiringPrivileges.length} expired member privileges to process`);

      for (const memberPrivilege of expiringPrivileges) {
        try {
          await this.memberPrivilegeRepository.expireMemberPrivilege(memberPrivilege.id);
          result.processed++;
          
          this.logger.debug(`Expired member privilege: ${memberPrivilege.id}`);
        } catch (error) {
          const errorMsg = `Failed to expire member privilege ${memberPrivilege.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      this.logger.log(`Processed ${result.processed} expired member privileges`);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process expired member privileges:', error);
      result.errors.push(`Global processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Delete a privilege (hard delete)
   */
  async deletePrivilege(privilegeId: string): Promise<void> {
    this.logger.log(`Deleting privilege: ${privilegeId}`);

    try {
      const privilege = await this.privilegeRepository.findById(privilegeId);
      if (!privilege) {
        throw new NotFoundExceptionDomain('Privilege', privilegeId);
      }

      // Check if privilege is being used by any members
      const memberPrivileges = await this.memberPrivilegeRepository.findByMemberId(''); // This would need a different method
      // For now, we'll allow deletion but in production you might want to prevent deletion of privileges in use

      await this.privilegeRepository.delete(privilegeId);
      
      this.logger.log(`Successfully deleted privilege: ${privilegeId}`);
    } catch (error) {
      this.logger.error(`Failed to delete privilege '${privilegeId}':`, error);
      throw error;
    }
  }

  // Private helper methods

  private toDomainEntity(prismaPrivilege: PrismaPrivilege): Privilege {
    return new Privilege({
      id: prismaPrivilege.id,
      name: prismaPrivilege.name,
      description: prismaPrivilege.description,
      pointCost: Number(prismaPrivilege.pointCost),
      isActive: prismaPrivilege.isActive,
      validityDays: prismaPrivilege.validityDays || undefined,
      createdAt: prismaPrivilege.createdAt,
      updatedAt: prismaPrivilege.updatedAt
    });
  }

  private transformMemberPrivilege(memberPrivilege: MemberPrivilegeWithDetails): MemberPrivilegeInfo {
    const now = new Date();
    const isExpired = memberPrivilege.expiresAt ? memberPrivilege.expiresAt <= now : false;
    
    let daysRemaining: number | undefined;
    if (memberPrivilege.expiresAt && !isExpired) {
      const timeDiff = memberPrivilege.expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    return {
      id: memberPrivilege.id,
      privilegeId: memberPrivilege.privilegeId,
      privilegeName: memberPrivilege.privilege.name,
      privilegeDescription: memberPrivilege.privilege.description,
      pointCost: Number(memberPrivilege.privilege.pointCost),
      grantedAt: memberPrivilege.grantedAt,
      expiresAt: memberPrivilege.expiresAt || undefined,
      isActive: memberPrivilege.isActive && !isExpired,
      isExpired,
      daysRemaining
    };
  }
}