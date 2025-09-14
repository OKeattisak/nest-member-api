import { IsString, MinLength, MaxLength, IsOptional, Matches, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStrongPassword } from '../../../common/decorators/validation.decorators';

export class UpdateMemberProfileDto {
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
}

export class ChangePasswordDto {
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @IsStrongPassword()
  newPassword!: string;
}