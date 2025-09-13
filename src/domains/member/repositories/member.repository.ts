import { Injectable } from '@nestjs/common';
import { Member, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  IMemberRepository,
  CreateMemberData,
  UpdateMemberData,
  MemberFilters,
  PaginationOptions,
  PaginatedResult,
} from './member.repository.interface';

@Injectable()
export class MemberRepository implements IMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Member | null> {
    return this.prisma.member.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Member | null> {
    return this.prisma.member.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<Member | null> {
    return this.prisma.member.findUnique({
      where: { username },
    });
  }

  async create(data: CreateMemberData): Promise<Member> {
    return this.prisma.member.create({
      data,
    });
  }

  async update(id: string, data: UpdateMemberData): Promise<Member> {
    return this.prisma.member.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  async findMany(
    filters: MemberFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Member>> {
    const where: Prisma.MemberWhereInput = {
      deletedAt: null, // Only return non-deleted members
    };

    // Apply filters
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.username) {
      where.username = { contains: filters.username, mode: 'insensitive' };
    }

    if (filters.firstName) {
      where.firstName = { contains: filters.firstName, mode: 'insensitive' };
    }

    if (filters.lastName) {
      where.lastName = { contains: filters.lastName, mode: 'insensitive' };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Global search across multiple fields
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async findActiveById(id: string): Promise<Member | null> {
    return this.prisma.member.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.member.count({
      where: {
        email,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.member.count({
      where: {
        username,
        deletedAt: null,
      },
    });
    return count > 0;
  }
}