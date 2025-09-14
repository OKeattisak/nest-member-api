import { Injectable } from '@nestjs/common';
import { MemberPrivilege, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  IMemberPrivilegeRepository,
  CreateMemberPrivilegeData,
  MemberPrivilegeWithDetails,
} from './privilege.repository.interface';

@Injectable()
export class MemberPrivilegeRepository implements IMemberPrivilegeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MemberPrivilege | null> {
    return this.prisma.memberPrivilege.findUnique({
      where: { id },
    });
  }

  async create(data: CreateMemberPrivilegeData): Promise<MemberPrivilege> {
    return this.prisma.memberPrivilege.create({
      data,
    });
  }

  async findByMemberId(memberId: string): Promise<MemberPrivilegeWithDetails[]> {
    return this.prisma.memberPrivilege.findMany({
      where: { memberId },
      include: { privilege: true },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async findByMemberAndPrivilege(
    memberId: string,
    privilegeId: string,
  ): Promise<MemberPrivilege | null> {
    return this.prisma.memberPrivilege.findUnique({
      where: {
        memberId_privilegeId: {
          memberId,
          privilegeId,
        },
      },
    });
  }

  async findActiveMemberPrivileges(memberId: string): Promise<MemberPrivilegeWithDetails[]> {
    const now = new Date();
    
    return this.prisma.memberPrivilege.findMany({
      where: {
        memberId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: { privilege: true },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async expireMemberPrivilege(id: string): Promise<void> {
    await this.prisma.memberPrivilege.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findExpiringPrivileges(days: number): Promise<MemberPrivilege[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.memberPrivilege.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gt: new Date(),
        },
        isActive: true,
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async deactivateMemberPrivilege(id: string): Promise<void> {
    await this.prisma.memberPrivilege.update({
      where: { id },
      data: { isActive: false },
    });
  }
}