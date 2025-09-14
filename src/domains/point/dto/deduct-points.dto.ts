import { IsString, IsNumber, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MemberExists, IsValidPointAmount } from '@/common/decorators/validation.decorators';

export class DeductPointsDto {
  @IsString({ message: 'Member ID must be a string' })
  @IsNotEmpty({ message: 'Member ID is required' })
  @IsUUID('4', { message: 'Member ID must be a valid UUID' })
  @MemberExists({ message: 'Member not found or inactive' })
  memberId!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a number with at most 2 decimal places' })
  @Type(() => Number)
  @IsValidPointAmount()
  amount!: number;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  description!: string;
}