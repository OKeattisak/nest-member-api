import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  emailOrUsername!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export interface AdminLoginResponseDto {
  id: string;
  email: string;
  username: string;
  role: string;
  accessToken: string;
  expiresIn: number;
}