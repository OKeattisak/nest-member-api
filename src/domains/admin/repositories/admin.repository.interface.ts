import { Admin, AdminRole } from '@prisma/client';
import { UpdateAdminData } from '../entities/admin.entity';

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

export interface AdminFilters {
  email?: string;
  username?: string;
  role?: AdminRole;
  isActive?: boolean;
  search?: string;
}

export interface CreateAdminData {
  email: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
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