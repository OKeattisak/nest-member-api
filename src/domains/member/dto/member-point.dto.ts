import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PointType } from '@prisma/client';

export class PointHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;
}

export class PointBalanceResponseDto {
  memberId!: string;
  totalEarned!: number;
  totalDeducted!: number;
  totalExpired!: number;
  totalExchanged!: number;
  availableBalance!: number;
  lastUpdated!: Date;
}

export class PointTransactionResponseDto {
  id!: string;
  memberId!: string;
  amount!: number;
  signedAmount!: number;
  type!: PointType;
  description!: string;
  expiresAt?: Date;
  isExpired!: boolean;
  createdAt!: Date;
}