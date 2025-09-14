import { IsOptional, IsNumber, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PointType } from '../entities/point.entity';

export class PointHistoryQueryDto {
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @IsOptional()
  @IsEnum(PointType, { message: 'Type must be one of: EARNED, DEDUCTED, EXPIRED, EXCHANGED' })
  type?: PointType;

  @IsOptional()
  @IsString({ message: 'Start date must be a string' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'End date must be a string' })
  endDate?: string;
}