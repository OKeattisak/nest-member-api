import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsPositive, MinLength, MaxLength, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrivilegeDto {
  @ApiProperty({
    description: 'Name of the privilege (3-100 characters)',
    example: 'Premium Access',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Detailed description of the privilege (max 500 characters)',
    example: 'Access to premium features and exclusive content',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @ApiProperty({
    description: 'Point cost required to exchange for this privilege (must be positive)',
    example: 500,
    minimum: 1,
    type: 'number'
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pointCost!: number;

  @ApiPropertyOptional({
    description: 'Number of days the privilege remains valid (minimum 1 day). If not provided, privilege is permanent.',
    example: 30,
    minimum: 1,
    type: 'number'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  validityDays?: number;
}

export class UpdatePrivilegeDto {
  @ApiPropertyOptional({
    description: 'Updated name of the privilege (3-100 characters)',
    example: 'Premium Plus Access',
    minLength: 3,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the privilege (max 500 characters)',
    example: 'Enhanced premium access with additional features',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated point cost for the privilege (must be positive)',
    example: 750,
    minimum: 1,
    type: 'number'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pointCost?: number;

  @ApiPropertyOptional({
    description: 'Updated validity period in days (minimum 1 day)',
    example: 45,
    minimum: 1,
    type: 'number'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({
    description: 'Whether the privilege is active and available for exchange',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PrivilegeFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by exact privilege name',
    example: 'Premium Access'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search term to filter privileges by name or description',
    example: 'premium'
  })
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