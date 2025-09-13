import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsPositive, MinLength, MaxLength, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePrivilegeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pointCost!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  validityDays?: number;
}

export class UpdatePrivilegeDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pointCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PrivilegeFiltersDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface PrivilegeResponseDto {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  isActive: boolean;
  validityDays?: number;
  createdAt: Date;
  updatedAt: Date;
}