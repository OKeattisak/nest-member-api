import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsEmailUnique, IsUsernameUnique, IsStrongPassword } from '@/common/decorators/validation.decorators';

export class MemberRegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmailUnique({ message: 'Email is already registered' })
  email!: string;

  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @IsNotEmpty({ message: 'Username is required' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
  @Transform(({ value }) => value?.trim())
  @IsUsernameUnique({ message: 'Username is already taken' })
  username!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword()
  password!: string;

  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @IsNotEmpty({ message: 'First name is required' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  lastName!: string;
}

export class MemberLoginDto {
  @IsString({ message: 'Email or username must be a string' })
  @IsNotEmpty({ message: 'Email or username is required' })
  @Transform(({ value }) => value?.trim())
  emailOrUsername!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class MemberLoginResponseDto {
  id!: string;
  email!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  accessToken!: string;
  expiresIn!: number;
}

export class MemberProfileResponseDto {
  id!: string;
  email!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}