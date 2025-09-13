import { IsString, IsUUID } from 'class-validator';

export class ExchangePrivilegeDto {
  @IsString()
  @IsUUID('4', { message: 'Member ID must be a valid UUID' })
  memberId: string;

  @IsString()
  @IsUUID('4', { message: 'Privilege ID must be a valid UUID' })
  privilegeId: string;
}