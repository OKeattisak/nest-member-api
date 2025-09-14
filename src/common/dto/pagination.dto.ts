import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SortableDto {
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be either "asc" or "desc"' })
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class PaginationWithSortDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be either "asc" or "desc"' })
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class SearchDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}

export class DateRangeDto {
  @IsOptional()
  @IsString({ message: 'Start date must be a string' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'End date must be a string' })
  endDate?: string;
}