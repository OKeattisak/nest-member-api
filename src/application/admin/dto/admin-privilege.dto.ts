export interface CreatePrivilegeRequest {
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  validFrom?: Date;
  validUntil?: Date;
  maxRedemptions?: number;
  adminId: string;
}

export interface UpdatePrivilegeRequest {
  privilegeId: string;
  name?: string;
  description?: string;
  pointsCost?: number;
  category?: string;
  validFrom?: Date;
  validUntil?: Date;
  maxRedemptions?: number;
  isActive?: boolean;
  adminId: string;
}

export interface DeletePrivilegeRequest {
  privilegeId: string;
  adminId: string;
}

export interface GetAllPrivilegesRequest {
  page?: number;
  limit?: number;
  category?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'pointsCost' | 'createdAt' | 'redemptions';
  sortOrder?: 'asc' | 'desc';
}

export interface PrivilegeDetails {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  validFrom?: Date;
  validUntil?: Date;
  maxRedemptions?: number;
  currentRedemptions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAllPrivilegesResponse {
  privileges: PrivilegeDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}