import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsDateString, IsPhoneNumber } from 'class-validator';

export class RegisterMemberRequest {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date' })
  dateOfBirth?: Date;
}

export interface RegisterMemberResponse {
  accessToken: string;
  refreshToken: string;
  member: {
    id: string;
    email: string;
    name: string;
    totalPoints: number;
  };
}