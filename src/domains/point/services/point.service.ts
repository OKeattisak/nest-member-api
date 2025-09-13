import { Injectable, Logger, Inject } from '@nestjs/common';
import { Point as PrismaPoint, PointType } from '@prisma/client';
import { IPointRepository } from '../repositories/point.repository.interface';
import { Point } from '../entities/point.entity';
import { PaginationOptions, PaginatedResult } from '../../member/repositories/member.repository.interface';

export interface AddPointsData {
  memberId: string;
  amount: number;
  description: string;
  expirationDays?: number;
}

export interface DeductPointsData {
  memberId: string;
  amount: number;
  description: string;
}

export interface PointBalance {
  memberId: string;
  totalEarned: number;
  totalDeducted: number;
  totalExpired: number;
  totalExchanged: number;
  availableBalance: number;
  lastUpdated: Date;
}

export interface PointTransaction {
  id: string;
  memberId: string;
  amount: number;
  signedAmount: number;
  type: PointType;
  description: string;
  expiresAt?: Date;
  isExpired: boolean;
  createdAt: Date;
}

export interface ExpirationProcessingResult {
  totalPointsExpired: number;
  membersAffected: number;
  pointsProcessed: string[];
  errors: string[];
}

@Injectable()
export class PointService {
  private readonly logger = new Logger(PointService.name);

  constructor(
    @Inject('IPointRepository') private readonly pointRepository: IPointRepository
  ) {}

  /**
   * Add points to a member's account with FIFO expiration tracking
   */
  async addPoints(data: AddPointsData): Promise<void> {
    this.logger.log(`Adding ${data.amount} points to member ${data.memberId}`);

    // Calculate expiration date if provided
    let expiresAt: Date | undefined;
    if (data.expirationDays && data.expirationDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expirationDays);
    }

    try {
      await this.pointRepository.create({
        memberId: data.memberId,
        amount: data.amount,
        type: PointType.EARNED,
        description: data.description,
        expiresAt,
      });

      this.logger.log(`Successfully added ${data.amount} points to member ${data.memberId}`);
    } catch (error) {
      this.logger.error(`Failed to add points to member ${data.memberId}:`, error);
      throw new Error(`Failed to add points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deduct points from a member's account using FIFO logic
   */
  async deductPoints(data: DeductPointsData): Promise<void> {
    this.logger.log(`Deducting ${data.amount} points from member ${data.memberId}`);

    try {
      // Validate sufficient balance first
      const availableBalance = await this.getAvailableBalance(data.memberId);
      if (availableBalance < data.amount) {
        throw new Error(`Insufficient points. Required: ${data.amount}, Available: ${availableBalance}`);
      }

      // Use repository's FIFO deduction logic
      await this.pointRepository.deductPoints(data.memberId, data.amount, data.description);

      this.logger.log(`Successfully deducted ${data.amount} points from member ${data.memberId}`);
    } catch (error) {
      this.logger.error(`Failed to deduct points from member ${data.memberId}:`, error);
      throw error;
    }
  }

  /**
   * Exchange points for privileges using FIFO logic
   */
  async exchangePoints(memberId: string, amount: number, privilegeName: string): Promise<void> {
    this.logger.log(`Exchanging ${amount} points for privilege '${privilegeName}' for member ${memberId}`);

    try {
      // Validate sufficient balance first
      const availableBalance = await this.getAvailableBalance(memberId);
      if (availableBalance < amount) {
        throw new Error(`Insufficient points for privilege exchange. Required: ${amount}, Available: ${availableBalance}`);
      }

      // Get available points in FIFO order
      const availablePoints = await this.pointRepository.getAvailablePoints(memberId);
      
      let remainingAmount = amount;
      const exchangeRecords = [];

      for (const point of availablePoints) {
        if (remainingAmount <= 0) break;

        const exchangeAmount = Math.min(point.amount, remainingAmount);
        
        exchangeRecords.push({
          memberId,
          amount: exchangeAmount,
          type: PointType.EXCHANGED,
          description: `Exchanged for privilege: ${privilegeName} (FIFO from point ${point.id})`,
        });

        remainingAmount -= exchangeAmount;
      }

      if (remainingAmount > 0) {
        throw new Error(`Insufficient points for exchange. Required: ${amount}, Available: ${amount - remainingAmount}`);
      }

      // Create exchange records
      await this.pointRepository.createMany(exchangeRecords);

      this.logger.log(`Successfully exchanged ${amount} points for privilege '${privilegeName}' for member ${memberId}`);
    } catch (error) {
      this.logger.error(`Failed to exchange points for member ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Get point transaction history with pagination
   */
  async getPointHistory(memberId: string, pagination: PaginationOptions): Promise<PaginatedResult<PointTransaction>> {
    this.logger.debug(`Fetching point history for member ${memberId}`);

    try {
      const result = await this.pointRepository.findPointHistory(memberId, pagination);
      
      // Transform Prisma points to domain PointTransaction objects
      const transformedData = result.data.map(this.transformPrismaPointToTransaction);

      return {
        ...result,
        data: transformedData,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch point history for member ${memberId}:`, error);
      throw new Error(`Failed to fetch point history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available point balance excluding expired points
   */
  async getAvailableBalance(memberId: string): Promise<number> {
    try {
      return await this.pointRepository.getAvailableBalance(memberId);
    } catch (error) {
      this.logger.error(`Failed to get available balance for member ${memberId}:`, error);
      throw new Error(`Failed to get available balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive point balance information
   */
  async getPointBalance(memberId: string): Promise<PointBalance> {
    this.logger.debug(`Fetching comprehensive point balance for member ${memberId}`);

    try {
      const [
        totalEarned,
        earnedPoints,
        deductedPoints,
        expiredPoints,
        exchangedPoints,
        availableBalance,
      ] = await Promise.all([
        this.pointRepository.getTotalEarnedPoints(memberId),
        this.pointRepository.findPointsByType(memberId, PointType.EARNED),
        this.pointRepository.findPointsByType(memberId, PointType.DEDUCTED),
        this.pointRepository.findPointsByType(memberId, PointType.EXPIRED),
        this.pointRepository.findPointsByType(memberId, PointType.EXCHANGED),
        this.pointRepository.getAvailableBalance(memberId),
      ]);

      const totalDeducted = this.calculateTotalAmount(deductedPoints);
      const totalExpired = this.calculateTotalAmount(expiredPoints);
      const totalExchanged = this.calculateTotalAmount(exchangedPoints);

      return {
        memberId,
        totalEarned,
        totalDeducted,
        totalExpired,
        totalExchanged,
        availableBalance,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get point balance for member ${memberId}:`, error);
      throw new Error(`Failed to get point balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process expired points using FIFO logic
   */
  async processExpiredPoints(): Promise<ExpirationProcessingResult> {
    this.logger.log('Starting automated point expiration processing');

    const result: ExpirationProcessingResult = {
      totalPointsExpired: 0,
      membersAffected: 0,
      pointsProcessed: [],
      errors: [],
    };

    try {
      // Find all expired points
      const expiredPoints = await this.pointRepository.findExpiredPoints();
      
      if (expiredPoints.length === 0) {
        this.logger.log('No expired points found');
        return result;
      }

      this.logger.log(`Found ${expiredPoints.length} expired points to process`);

      // Group expired points by member for processing
      const pointsByMember = this.groupPointsByMember(expiredPoints);
      
      for (const [memberId, memberPoints] of pointsByMember.entries()) {
        try {
          await this.processExpiredPointsForMember(memberId, memberPoints);
          
          result.membersAffected++;
          result.totalPointsExpired += memberPoints.length;
          result.pointsProcessed.push(...memberPoints.map(p => p.id));
          
          this.logger.debug(`Processed ${memberPoints.length} expired points for member ${memberId}`);
        } catch (error) {
          const errorMsg = `Failed to process expired points for member ${memberId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      this.logger.log(`Point expiration processing completed. Points expired: ${result.totalPointsExpired}, Members affected: ${result.membersAffected}`);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process expired points:', error);
      result.errors.push(`Global processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Get points that are expiring within specified days
   */
  async getExpiringPoints(days: number): Promise<PointTransaction[]> {
    this.logger.debug(`Fetching points expiring within ${days} days`);

    try {
      const expiringPoints = await this.pointRepository.findExpiringPoints(days);
      return expiringPoints.map(this.transformPrismaPointToTransaction);
    } catch (error) {
      this.logger.error(`Failed to get expiring points:`, error);
      throw new Error(`Failed to get expiring points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if member has sufficient points for an operation
   */
  async validateSufficientPoints(memberId: string, requiredAmount: number): Promise<boolean> {
    try {
      const availableBalance = await this.getAvailableBalance(memberId);
      return availableBalance >= requiredAmount;
    } catch (error) {
      this.logger.error(`Failed to validate sufficient points for member ${memberId}:`, error);
      return false;
    }
  }

  // Private helper methods

  private async processExpiredPointsForMember(memberId: string, expiredPoints: PrismaPoint[]): Promise<void> {
    // Mark points as expired
    const pointIds = expiredPoints.map(p => p.id);
    await this.pointRepository.expirePoints(pointIds);

    // Create expiration records for audit trail
    const expirationRecords = expiredPoints.map(point => ({
      memberId,
      amount: Number(point.amount),
      type: PointType.EXPIRED,
      description: `Automatic expiration of points earned on ${point.createdAt.toISOString().split('T')[0]}`,
    }));

    await this.pointRepository.createMany(expirationRecords);
  }

  private groupPointsByMember(points: PrismaPoint[]): Map<string, PrismaPoint[]> {
    const grouped = new Map<string, PrismaPoint[]>();
    
    for (const point of points) {
      if (!grouped.has(point.memberId)) {
        grouped.set(point.memberId, []);
      }
      grouped.get(point.memberId)!.push(point);
    }
    
    return grouped;
  }

  private calculateTotalAmount(points: PrismaPoint[]): number {
    return points.reduce((total, point) => total + Number(point.amount), 0);
  }

  private transformPrismaPointToTransaction(prismaPoint: PrismaPoint): PointTransaction {
    // Calculate signed amount based on point type
    const amount = Number(prismaPoint.amount);
    const negativeTypes: PointType[] = [PointType.DEDUCTED, PointType.EXPIRED, PointType.EXCHANGED];
    const signedAmount = negativeTypes.includes(prismaPoint.type) 
      ? -amount 
      : amount;

    return {
      id: prismaPoint.id,
      memberId: prismaPoint.memberId,
      amount,
      signedAmount,
      type: prismaPoint.type,
      description: prismaPoint.description,
      expiresAt: prismaPoint.expiresAt || undefined,
      isExpired: prismaPoint.isExpired,
      createdAt: prismaPoint.createdAt,
    };
  }
}