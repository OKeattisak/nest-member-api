import { Injectable } from '@nestjs/common';
import { Admin, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  IAdminRepository,
  CreateAdminData,
  AdminFilters,
  PaginationOptions,
  PaginatedResult,
} from './admin.repository.interface';
import { UpdateAdminData } from '../entities/admin.entity';

@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({
      where: { username },
    });
  }

  async create(data: CreateAdminData): Promise<Admin> {
    return this.prisma.admin.create({
      data,
    });
  }

  async update(id: string, data: UpdateAdminData): Promise<Admin> {
    return this.prisma.admin.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async findMany(
    filters: AdminFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Admin>> {
    const where: Prisma.AdminWhereInput = {};

    // Apply filters
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.username) {
      where.username = { contains: filters.username, mode: 'insensitive' };
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Global search across multiple fields
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.admin.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.admin.count({ where }),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async findActiveById(id: string): Promise<Admin | null> {
    return this.prisma.admin.findFirst({
      where: {
        id,
        isActive: true,
      },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.admin.count({
      where: { email },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.admin.count({
      where: { username },
    });
    return count > 0;
  }
}