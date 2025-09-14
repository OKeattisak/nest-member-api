import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, Length, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { IsValidPointAmount } from '@/common/decorators/validation.decorators';

export class CreatePrivilegeDto {
  @IsString({ message: 'Privilege name must be a string' })
  @IsNotEmpty({ message: 'Privilege name is required' })
  @Length(1, 200, { message: 'Privilege name must be between 1 and 200 characters' })
  @Transform(({ value }) => value?.trim())
  name!: string;

  @IsString({ message: 'Privilege description must be a string' })
  @IsNotEmpty({ message: 'Privilege description is required' })
  @Length(1, 1000, { message: 'Privilege description must be between 1 and 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Point cost must be a number with at most 2 decimal places' })
  @Type(() => Number)
  @IsValidPointAmount()
  pointCost!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Validity days must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Validity days must be at least 1' })
  @Max(3650, { message: 'Validity days cannot exceed 3650 (10 years)' })
  validityDays?: number;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean = true;
}