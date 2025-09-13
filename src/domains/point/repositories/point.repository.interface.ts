import { Point, PointType } from '@prisma/client';
import { PaginationOptions, PaginatedResult } from '../../member/repositories/member.repository.interface';

export interface CreatePointData {
  memberId: string;
  amount: number;
  type: PointType;
  description: string;
  expiresAt?: Date;
}

export interface PointFilters {
  memberId?: string;
  type?: PointType;
  isExpired?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AvailablePointsResult {
  id: string;
  amount: number;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface IPointRepository {
  findById(id: string): Promise<Point | null>;
  findByMemberId(memberId: string): Promise<Point[]>;
  create(data: CreatePointData): Promise<Point>;
  createMany(data: CreatePointData[]): Promise<Point[]>;
  findExpiredPoints(): Promise<Point[]>;
  expirePoints(pointIds: string[]): Promise<void>;
  getAvailableBalance(memberId: string): Promise<number>;
  getAvailablePoints(memberId: string): Promise<AvailablePointsResult[]>;
  deductPoints(memberId: string, amount: number, description: string): Promise<Point[]>;
  findPointHistory(memberId: string, pagination: PaginationOptions): Promise<PaginatedResult<Point>>;
  findPointsByType(memberId: string, type: PointType): Promise<Point[]>;
  getTotalEarnedPoints(memberId: string): Promise<number>;
  findExpiringPoints(days: number): Promise<Point[]>;
}