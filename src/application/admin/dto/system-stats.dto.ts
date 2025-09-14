export interface GetSystemStatsRequest {
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SystemStats {
  members: {
    total: number;
    newThisMonth: number;
    activeThisMonth: number;
  };
  points: {
    totalIssued: number;
    totalSpent: number;
    totalExpired: number;
    currentCirculation: number;
  };
  privileges: {
    totalAvailable: number;
    totalRedeemed: number;
    topRedeemed: {
      privilegeName: string;
      redemptions: number;
    }[];
  };
  trends: {
    memberRegistrations: {
      date: Date;
      count: number;
    }[];
    pointTransactions: {
      date: Date;
      earned: number;
      spent: number;
    }[];
    privilegeRedemptions: {
      date: Date;
      count: number;
    }[];
  };
}