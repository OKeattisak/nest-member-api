import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginMemberRequest {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export interface LoginMemberResponse {
  accessToken: string;
  refreshToken: string;
  member: {
    id: string;
    email: string;
    name: string;
    totalPoints: number;
  };
}