import { IsString, IsNumber, IsNotEmpty, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class DeductPointsDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Max(999999.99, { message: 'Amount cannot exceed 999,999.99' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description: string;
}