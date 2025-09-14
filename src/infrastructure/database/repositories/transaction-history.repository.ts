import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, TransactionHistory as PrismaTransactionHistory } from '@prisma/client';
import { 
  ITransactionHistoryRepository, 
  CreateTransactionHistoryData, 
  TransactionHistoryFilters 
} from '../../../domains/audit/repositories/transaction-history.repository.interface';
import { TransactionHistory } from '../../../domains/audit/entities/transaction-history.entity';
import { PaginationOptions, PaginatedResult } from '../../../domains/member/repositories/member.repository.interface';

@Injectable()
export class TransactionHistoryRepository implements ITransactionHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTransactionHistoryData): Promise<TransactionHistory> {
    const transactionHistory = await this.prisma.transactionHistory.create({
      data: {
        memberId: data.memberId,
        transactionType: data.transactionType,
        entityType: data.entityType,
        entityId: data.entityId,
        amount: data.amount,
        description: data.description,
        metadata: data.metadata,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        traceId: data.traceId,
      },
    });

    return this.toDomainEntity(transactionHistory);
  }

  async createMany(data: CreateTransactionHistoryData[]): Promise<TransactionHistory[]> {
    const transactionHistories = await this.prisma.transactionHistory.createManyAndReturn({
      data: data.map(item => ({
        memberId: item.memberId,
        transactionType: item.transactionType,
        entityType: item.entityType,
        entityId: item.entityId,
        amount: item.amount,
        description: item.description,
        metadata: item.metadata,
        balanceBefore: item.balanceBefore,
        balanceAfter: item.balanceAfter,
        traceId: item.traceId,
      })),
    });

    return transactionHistories.map(this.toDomainEntity);
  }

  async findByMemberId(
    memberId: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<TransactionHistory>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transactionHistory.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transactionHistory.count({
        where: { memberId },
      }),
    ]);

    return {
      data: transactions.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTransactionType(
    transactionType: TransactionType, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<TransactionHistory>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transactionHistory.findMany({
        where: { transactionType },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transactionHistory.count({
        where: { transactionType },
      }),
    ]);

    return {
      data: transactions.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWithFilters(
    filters: TransactionHistoryFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<TransactionHistory>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.memberId) where.memberId = filters.memberId;
    if (filters.transactionType) where.transactionType = filters.transactionType;
    if (filters.entityType) where.entityType = filters.entityType;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {};
      if (filters.amountMin !== undefined) where.amount.gte = filters.amountMin;
      if (filters.amountMax !== undefined) where.amount.lte = filters.amountMax;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transactionHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transactionHistory.count({ where }),
    ]);

    return {
      data: transactions.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEntity(
    entityType: string, 
    entityId: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<TransactionHistory>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transactionHistory.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transactionHistory.count({
        where: {
          entityType,
          entityId,
        },
      }),
    ]);

    return {
      data: transactions.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberTransactionSummary(
    memberId: string, 
    dateFrom?: Date, 
    dateTo?: Date
  ): Promise<{
    totalTransactions: number;
    pointsEarned: number;
    pointsDeducted: number;
    pointsExpired: number;
    pointsExchanged: number;
    privilegesGranted: number;
    privilegesExpired: number;
    privilegesRevoked: number;
    transactionTypeCounts: Record<TransactionType, number>;
  }> {
    const where: any = { memberId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [totalTransactions, transactionTypeCounts, pointTransactions] = await Promise.all([
      this.prisma.transactionHistory.count({ where }),
      this.prisma.transactionHistory.groupBy({
        by: ['transactionType'],
        where,
        _count: { transactionType: true },
      }),
      this.prisma.transactionHistory.findMany({
        where: {
          ...where,
          transactionType: {
            in: [
              TransactionType.POINT_EARNED,
              TransactionType.POINT_DEDUCTED,
              TransactionType.POINT_EXPIRED,
              TransactionType.POINT_EXCHANGED,
            ],
          },
        },
        select: {
          transactionType: true,
          amount: true,
        },
      }),
    ]);

    // Calculate point totals
    const pointsEarned = pointTransactions
      .filter(t => t.transactionType === TransactionType.POINT_EARNED)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pointsDeducted = pointTransactions
      .filter(t => t.transactionType === TransactionType.POINT_DEDUCTED)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pointsExpired = pointTransactions
      .filter(t => t.transactionType === TransactionType.POINT_EXPIRED)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pointsExchanged = pointTransactions
      .filter(t => t.transactionType === TransactionType.POINT_EXCHANGED)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Count privilege transactions
    const privilegesGranted = transactionTypeCounts.find(
      t => t.transactionType === TransactionType.PRIVILEGE_GRANTED
    )?._count.transactionType || 0;

    const privilegesExpired = transactionTypeCounts.find(
      t => t.transactionType === TransactionType.PRIVILEGE_EXPIRED
    )?._count.transactionType || 0;

    const privilegesRevoked = transactionTypeCounts.find(
      t => t.transactionType === TransactionType.PRIVILEGE_REVOKED
    )?._count.transactionType || 0;

    return {
      totalTransactions,
      pointsEarned,
      pointsDeducted,
      pointsExpired,
      pointsExchanged,
      privilegesGranted,
      privilegesExpired,
      privilegesRevoked,
      transactionTypeCounts: transactionTypeCounts.reduce((acc, item) => {
        acc[item.transactionType] = item._count.transactionType;
        return acc;
      }, {} as Record<TransactionType, number>),
    };
  }

  async getStatistics(dateFrom: Date, dateTo: Date): Promise<{
    totalTransactions: number;
    totalMembers: number;
    transactionTypeCounts: Record<TransactionType, number>;
    entityTypeCounts: Record<string, number>;
    totalPointsTransacted: number;
    averageTransactionAmount: number;
  }> {
    const [
      totalTransactions,
      totalMembers,
      transactionTypeCounts,
      entityTypeCounts,
      pointTransactions,
    ] = await Promise.all([
      this.prisma.transactionHistory.count({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      this.prisma.transactionHistory.findMany({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        select: { memberId: true },
        distinct: ['memberId'],
      }).then(results => results.length),
      this.prisma.transactionHistory.groupBy({
        by: ['transactionType'],
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { transactionType: true },
      }),
      this.prisma.transactionHistory.groupBy({
        by: ['entityType'],
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { entityType: true },
      }),
      this.prisma.transactionHistory.findMany({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
          amount: { not: null },
        },
        select: { amount: true },
      }),
    ]);

    const totalPointsTransacted = pointTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0), 
      0
    );

    const averageTransactionAmount = pointTransactions.length > 0 
      ? totalPointsTransacted / pointTransactions.length 
      : 0;

    return {
      totalTransactions,
      totalMembers,
      transactionTypeCounts: transactionTypeCounts.reduce((acc, item) => {
        acc[item.transactionType] = item._count.transactionType;
        return acc;
      }, {} as Record<TransactionType, number>),
      entityTypeCounts: entityTypeCounts.reduce((acc, item) => {
        acc[item.entityType] = item._count.entityType;
        return acc;
      }, {} as Record<string, number>),
      totalPointsTransacted,
      averageTransactionAmount,
    };
  }

  async findLargeTransactions(
    amountThreshold: number, 
    dateFrom?: Date, 
    dateTo?: Date, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<TransactionHistory>> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const where: any = {
      amount: { gte: amountThreshold },
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transactionHistory.findMany({
        where,
        orderBy: [
          { amount: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.transactionHistory.count({ where }),
    ]);

    return {
      data: transactions.map(this.toDomainEntity),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toDomainEntity(prismaTransactionHistory: PrismaTransactionHistory): TransactionHistory {
    return new TransactionHistory({
      id: prismaTransactionHistory.id,
      memberId: prismaTransactionHistory.memberId,
      transactionType: prismaTransactionHistory.transactionType,
      entityType: prismaTransactionHistory.entityType,
      entityId: prismaTransactionHistory.entityId,
      amount: prismaTransactionHistory.amount ? Number(prismaTransactionHistory.amount) : undefined,
      description: prismaTransactionHistory.description,
      metadata: prismaTransactionHistory.metadata as Record<string, any> || undefined,
      balanceBefore: prismaTransactionHistory.balanceBefore ? Number(prismaTransactionHistory.balanceBefore) : undefined,
      balanceAfter: prismaTransactionHistory.balanceAfter ? Number(prismaTransactionHistory.balanceAfter) : undefined,
      traceId: prismaTransactionHistory.traceId || undefined,
      createdAt: prismaTransactionHistory.createdAt,
    });
  }
}