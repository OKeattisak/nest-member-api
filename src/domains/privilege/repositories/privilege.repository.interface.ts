import { Privilege, MemberPrivilege } from '@prisma/client';
import { PaginationOptions, PaginatedResult } from '@/domains/member/repositories/member.repository.interface';

export interface CreatePrivilegeData {
  name: string;
  description: string;
  pointCost: number;
  validityDays?: number;
  isActive?: boolean;
}

export interface UpdatePrivilegeData {
  name?: string;
  description?: string;
  pointCost?: number;
  validityDays?: number;
  isActive?: boolean;
}

export interface PrivilegeFilters {
  name?: string;
  isActive?: boolean;
  pointCostMin?: number;
  pointCostMax?: number;
  search?: string;
}

export interface CreateMemberPrivilegeData {
  memberId: string;
  privilegeId: string;
  expiresAt?: Date;
}

export interface MemberPrivilegeWithDetails extends MemberPrivilege {
  privilege: Privilege;
}

export interface IPrivilegeRepository {
  findById(id: string): Promise<Privilege | null>;
  findByName(name: string): Promise<Privilege | null>;
  create(data: CreatePrivilegeData): Promise<Privilege>;
  update(id: string, data: UpdatePrivilegeData): Promise<Privilege>;
  delete(id: string): Promise<void>;
  findMany(filters: PrivilegeFilters, pagination: PaginationOptions): Promise<PaginatedResult<Privilege>>;
  findActivePrivileges(): Promise<Privilege[]>;
  existsByName(name: string): Promise<boolean>;
}

export interface IMemberPrivilegeRepository {
  findById(id: string): Promise<MemberPrivilege | null>;
  create(data: CreateMemberPrivilegeData): Promise<MemberPrivilege>;
  findByMemberId(memberId: string): Promise<MemberPrivilegeWithDetails[]>;
  findByMemberAndPrivilege(memberId: string, privilegeId: string): Promise<MemberPrivilege | null>;
  findActiveMemberPrivileges(memberId: string): Promise<MemberPrivilegeWithDetails[]>;
  expireMemberPrivilege(id: string): Promise<void>;
  findExpiringPrivileges(days: number): Promise<MemberPrivilege[]>;
  deactivateMemberPrivilege(id: string): Promise<void>;
}