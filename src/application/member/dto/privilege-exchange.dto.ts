export interface ExchangePrivilegeRequest {
  memberId: string;
  privilegeId: string;
}

export interface ExchangePrivilegeResponse {
  memberPrivilegeId: string;
  privilege: {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
  };
  exchangedAt: Date;
  remainingPoints: number;
}

export interface GetAvailablePrivilegesRequest {
  memberId: string;
  category?: string;
}

export interface AvailablePrivilege {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  isAvailable: boolean;
  validUntil?: Date;
}

export interface GetMemberPrivilegesRequest {
  memberId: string;
  status?: 'ACTIVE' | 'USED' | 'EXPIRED';
}

export interface MemberPrivilege {
  id: string;
  privilege: {
    id: string;
    name: string;
    description: string;
    category: string;
  };
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  exchangedAt: Date;
  usedAt?: Date;
  expiresAt?: Date;
}