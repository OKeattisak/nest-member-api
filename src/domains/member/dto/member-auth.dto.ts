import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class MemberRegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @IsNotEmpty({ message: 'Username is required' })
  username!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;
}

export class MemberLoginDto {
  @IsString({ message: 'Email or username must be a string' })
  @IsNotEmpty({ message: 'Email or username is required' })
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