import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, Length } from 'class-validator';

export class CreatePrivilegeDto {
  @IsString()
  @Length(1, 200, { message: 'Privilege name must be between 1 and 200 characters' })
  name: string;

  @IsString()
  @Length(1, 1000, { message: 'Privilege description must be between 1 and 1000 characters' })
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Point cost must be a number with at most 2 decimal places' })
  @Min(0.01, { message: 'Point cost must be greater than 0' })
  @Max(999999.99, { message: 'Point cost cannot exceed 999,999.99' })
  pointCost: number;

  @IsOptional()
  @IsNumber({}, { message: 'Validity days must be a number' })
  @Min(1, { message: 'Validity days must be at least 1' })
  @Max(3650, { message: 'Validity days cannot exceed 3650 (10 years)' })
  validityDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}