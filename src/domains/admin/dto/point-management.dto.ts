import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPointsDto {
  @ApiProperty({
    description: 'Unique identifier of the member to add points to',
    example: 'clm123456789',
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({
    description: 'Number of points to add (must be positive)',
    example: 500,
    minimum: 1,
    type: 'number'
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Description or reason for adding points',
    example: 'Monthly activity bonus',
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Number of days until points expire (1-3650 days, max 10 years). If not provided, points will not expire.',
    example: 365,
    minimum: 1,
    maximum: 3650,
    type: 'number'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(3650) // Max 10 years
  expirationDays?: number;
}

export class DeductPointsDto {
  @ApiProperty({
    description: 'Unique identifier of the member to deduct points from',
    example: 'clm123456789',
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({
    description: 'Number of points to deduct (must be positive). Points are deducted using FIFO logic.',
    example: 200,
    minimum: 1,
    type: 'number'
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Description or reason for deducting points',
    example: 'Penalty for policy violation',
    minLength: 1
  })
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