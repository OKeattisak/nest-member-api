import { IsString, IsNotEmpty } from 'class-validator';

export class ExchangePrivilegeDto {
  @IsString({ message: 'Privilege ID must be a string' })
  @IsNotEmpty({ message: 'Privilege ID is required' })
  privilegeId!: string;
}

export class AvailablePrivilegeResponseDto {
  id!: string;
  name!: string;
  description!: string;
  pointCost!: number;
  validityDays?: number;
  isActive!: boolean;
}

export class MemberPrivilegeResponseDto {
  id!: string;
  privilegeId!: string;
  privilegeName!: string;
  privilegeDescription!: string;
  pointCost!: number;
  grantedAt!: Date;
  expiresAt?: Date;
  isActive!: boolean;
  isExpired!: boolean;
  daysRemaining?: number;
}

export class PrivilegeExchangeResponseDto {
  memberPrivilegeId!: string;
  privilegeName!: string;
  pointsDeducted!: number;
  expiresAt?: Date;
  exchangedAt!: Date;
}