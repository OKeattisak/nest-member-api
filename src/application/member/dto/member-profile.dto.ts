import { IsUUID, IsOptional, MinLength, IsPhoneNumber, IsDateString } from 'class-validator';

export class GetMemberProfileRequest {
  @IsUUID(4, { message: 'Please provide a valid member ID' })
  memberId!: string;
}

export interface MemberProfileResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: Date;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateMemberProfileRequest {
  @IsUUID(4, { message: 'Please provide a valid member ID' })
  memberId!: string;

  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date' })
  dateOfBirth?: Date;
}