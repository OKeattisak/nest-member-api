export interface GetAllMembersRequest {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'email' | 'totalPoints' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MemberSummary {
  id: string;
  email: string;
  name: string;
  totalPoints: number;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface GetAllMembersResponse {
  members: MemberSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetMemberDetailsRequest {
  memberId: string;
}

export interface MemberDetails {
  id: string;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: Date;
  totalPoints: number;
  availablePoints: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  pointTransactions: {
    id: string;
    type: 'EARNED' | 'SPENT' | 'EXPIRED' | 'ADJUSTED';
    amount: number;
    description: string;
    createdAt: Date;
  }[];
  privileges: {
    id: string;
    privilegeName: string;
    status: 'ACTIVE' | 'USED' | 'EXPIRED';
    exchangedAt: Date;
  }[];
}

export interface AdjustMemberPointsRequest {
  memberId: string;
  amount: number;
  reason: string;
  adminId: string;
}