import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength, IsInt, Min, Max, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsEmailUnique, IsUsernameUnique, IsStrongPassword } from '../../../common/decorators/validation.decorators';

export class CreateMemberDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmailUnique({ message: 'Email is already registered' })
  email!: string;

  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
  @Transform(({ value }) => value?.trim())
  @IsUsernameUnique({ message: 'Username is already taken' })
  username!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword()
  password!: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  lastName!: string;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}

export class MemberFiltersDto {
  @IsOptional()
  @IsString({ message: 'Email filter must be a string' })
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsOptional()
  @IsString({ message: 'Username filter must be a string' })
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsOptional()
  @IsString({ message: 'First name filter must be a string' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name filter must be a string' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive filter must be a boolean' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @MaxLength(100, { message: 'Search term cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;
}

export interface MemberResponseDto {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}