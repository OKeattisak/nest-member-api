import { Injectable } from '@nestjs/common';
import { Point, PointType, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  IPointRepository,
  CreatePointData,
  PointFilters,
  AvailablePointsResult,
} from './point.repository.interface';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';

@Injectable()
export class PointRepository implements IPointRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Point | null> {
    return this.prisma.point.findUnique({
      where: { id },
    });
  }

  async findByMemberId(memberId: string): Promise<Point[]> {
    return this.prisma.point.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreatePointData): Promise<Point> {
    return this.prisma.point.create({
      data: {
        memberId: data.memberId,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        description: data.description,
        expiresAt: data.expiresAt,
      },
    });
  }

  async createMany(data: CreatePointData[]): Promise<Point[]> {
    const points = data.map(point => ({
      memberId: point.memberId,
      amount: new Prisma.Decimal(point.amount),
      type: point.type,
      description: point.description,
      expiresAt: point.expiresAt,
    }));

    await this.prisma.point.createMany({
      data: points,
    });

    // Return the created points (Prisma createMany doesn't return data)
    // This is a limitation, but we can fetch them based on the last created timestamp
    const lastCreated = await this.prisma.point.findMany({
      where: {
        memberId: { in: data.map(d => d.memberId) },
        createdAt: { gte: new Date(Date.now() - 1000) }, // Within last second
      },
      orderBy: { createdAt: 'desc' },
      take: data.length,
    });

    return lastCreated;
  }

  async findExpiredPoints(): Promise<Point[]> {
    const now = new Date();
    return this.prisma.point.findMany({
      where: {
        expiresAt: { lte: now },
        isExpired: false,
        type: PointType.EARNED, // Only earned points can expire
      },
      orderBy: { createdAt: 'asc' }, // FIFO order
    });
  }

  async expirePoints(pointIds: string[]): Promise<void> {
    await this.prisma.point.updateMany({
      where: { id: { in: pointIds } },
      data: { isExpired: true },
    });
  }

  async getAvailableBalance(memberId: string): Promise<number> {
    const result = await this.prisma.point.aggregate({
      where: {
        memberId,
        isExpired: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      _sum: { amount: true },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  async getAvailablePoints(memberId: string): Promise<AvailablePointsResult[]> {
    const points = await this.prisma.point.findMany({
      where: {
        memberId,
        isExpired: false,
        amount: { gt: 0 }, // Only positive amounts (earned points)
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'asc' }, // FIFO order
    });

    return points.map(point => ({
      id: point.id,
      amount: Number(point.amount),
      createdAt: point.createdAt,
      expiresAt: point.expiresAt,
    }));
  }

  async deductPoints(memberId: string, amount: number, description: string): Promise<Point[]> {
    // This method implements FIFO point deduction logic
    const availablePoints = await this.getAvailablePoints(memberId);
    
    let remainingAmount = amount;
    const deductionRecords: CreatePointData[] = [];

    for (const point of availablePoints) {
      if (remainingAmount <= 0) break;

      const deductAmount = Math.min(point.amount, remainingAmount);
      
      deductionRecords.push({
        memberId,
        amount: -deductAmount,
        type: PointType.DEDUCTED,
        description: `${description} (FIFO deduction from point ${point.id})`,
      });

      remainingAmount -= deductAmount;
    }

    if (remainingAmount > 0) {
      throw new Error(`Insufficient points. Required: ${amount}, Available: ${amount - remainingAmount}`);
    }

    return this.createMany(deductionRecords);
  }

  async findPointHistory(
    memberId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Point>> {
    const where: Prisma.PointWhereInput = { memberId };
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.point.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.point.count({ where }),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async findPointsByType(memberId: string, type: PointType): Promise<Point[]> {
    return this.prisma.point.findMany({
      where: { memberId, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTotalEarnedPoints(memberId: string): Promise<number> {
    const result = await this.prisma.point.aggregate({
      where: {
        memberId,
        type: PointType.EARNED,
      },
      _sum: { amount: true },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  async findExpiringPoints(days: number): Promise<Point[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.point.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gt: new Date(),
        },
        isExpired: false,
        type: PointType.EARNED,
      },
      orderBy: { expiresAt: 'asc' },
    });
  }
}