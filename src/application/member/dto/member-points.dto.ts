export interface GetMemberPointsRequest {
  memberId: string;
  page?: number;
  limit?: number;
}

export interface PointTransaction {
  id: string;
  type: 'EARNED' | 'SPENT' | 'EXPIRED';
  amount: number;
  description: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface MemberPointsResponse {
  totalPoints: number;
  availablePoints: number;
  expiringPoints: number;
  transactions: PointTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}