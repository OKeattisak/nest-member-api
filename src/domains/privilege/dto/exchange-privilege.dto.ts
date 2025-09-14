import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { MemberExists, PrivilegeExists } from '../../../common/decorators/validation.decorators';

export class ExchangePrivilegeDto {
  @IsString({ message: 'Member ID must be a string' })
  @IsNotEmpty({ message: 'Member ID is required' })
  @IsUUID('4', { message: 'Member ID must be a valid UUID' })
  @MemberExists({ message: 'Member not found or inactive' })
  memberId!: string;

  @IsString({ message: 'Privilege ID must be a string' })
  @IsNotEmpty({ message: 'Privilege ID is required' })
  @IsUUID('4', { message: 'Privilege ID must be a valid UUID' })
  @PrivilegeExists({ message: 'Privilege not found or inactive' })
  privilegeId!: string;
}