import { Admin } from '@prisma/client';
import { PaginationOptions, PaginatedResult } from '../../member/repositories/member.repository.interface';

export interface AdminFilters {
  email?: string;
  username?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateAdminData {
  email: string;
  username: string;
  passwordHash: string;
  role: string;
}

export interface UpdateAdminData {
  email?: string;
  username?: string;
  passwordHash?: string;
  role?: string;
  isActive?: boolean;
}

export interface IAdminRepository {
  findById(id: string): Promise<Admin | null>;
  findByEmail(email: string): Promise<Admin | null>;
  findByUsername(username: string): Promise<Admin | null>;
  create(data: CreateAdminData): Promise<Admin>;
  update(id: string, data: UpdateAdminData): Promise<Admin>;
  findMany(filters: AdminFilters, pagination: PaginationOptions): Promise<PaginatedResult<Admin>>;
  findActiveById(id: string): Promise<Admin | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}