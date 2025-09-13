import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AddPointsDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(3650) // Max 10 years
  expirationDays?: number;
}

export class DeductPointsDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export interface PointBalanceResponseDto {
  memberId: string;
  totalEarned: number;
  totalDeducted: number;
  totalExpired: number;
  totalExchanged: number;
  availableBalance: number;
  lastUpdated: Date;
}

export interface PointTransactionResponseDto {
  id: string;
  memberId: string;
  amount: number;
  signedAmount: number;
  type: string;
  description: string;
  expiresAt?: Date;
  isExpired: boolean;
  createdAt: Date;
}