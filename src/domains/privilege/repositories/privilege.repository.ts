import { Injectable } from '@nestjs/common';
import { Privilege, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  IPrivilegeRepository,
  CreatePrivilegeData,
  UpdatePrivilegeData,
  PrivilegeFilters,
} from './privilege.repository.interface';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';

@Injectable()
export class PrivilegeRepository implements IPrivilegeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Privilege | null> {
    return this.prisma.privilege.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Privilege | null> {
    return this.prisma.privilege.findUnique({
      where: { name },
    });
  }

  async create(data: CreatePrivilegeData): Promise<Privilege> {
    return this.prisma.privilege.create({
      data: {
        name: data.name,
        description: data.description,
        pointCost: new Prisma.Decimal(data.pointCost),
        validityDays: data.validityDays,
        isActive: data.isActive ?? true, // Use provided value or default to true
      },
    });
  }

  async update(id: string, data: UpdatePrivilegeData): Promise<Privilege> {
    const updateData: any = { ...data };

    if (data.pointCost !== undefined) {
      updateData.pointCost = new Prisma.Decimal(data.pointCost);
    }

    return this.prisma.privilege.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.privilege.delete({
      where: { id },
    });
  }

  async findMany(
    filters: PrivilegeFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Privilege>> {
    const where: Prisma.PrivilegeWhereInput = {};

    // Apply filters
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.pointCostMin !== undefined || filters.pointCostMax !== undefined) {
      where.pointCost = {};
      
      if (filters.pointCostMin !== undefined) {
        where.pointCost.gte = new Prisma.Decimal(filters.pointCostMin);
      }
      
      if (filters.pointCostMax !== undefined) {
        where.pointCost.lte = new Prisma.Decimal(filters.pointCostMax);
      }
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.privilege.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.privilege.count({ where }),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async findActivePrivileges(): Promise<Privilege[]> {
    return this.prisma.privilege.findMany({
      where: { isActive: true },
      orderBy: { pointCost: 'asc' },
    });
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.privilege.count({
      where: { name },
    });
    return count > 0;
  }
}