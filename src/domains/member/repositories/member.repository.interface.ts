import { Member } from '@prisma/client';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemberFilters {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateMemberData {
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

export interface UpdateMemberData {
  email?: string;
  username?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface IMemberRepository {
  findById(id: string): Promise<Member | null>;
  findByEmail(email: string): Promise<Member | null>;
  findByUsername(username: string): Promise<Member | null>;
  create(data: CreateMemberData): Promise<Member>;
  update(id: string, data: UpdateMemberData): Promise<Member>;
  softDelete(id: string): Promise<void>;
  findMany(filters: MemberFilters, pagination: PaginationOptions): Promise<PaginatedResult<Member>>;
  findActiveById(id: string): Promise<Member | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}