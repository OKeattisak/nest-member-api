import { BadRequestException } from '@nestjs/common';
import { CustomValidationPipe } from '../validation.pipe';
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

describe('CustomValidationPipe', () => {
  let pipe: CustomValidationPipe;

  beforeEach(() => {
    pipe = new CustomValidationPipe();
  });

  it('should transform valid data successfully', async () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const result = await pipe.transform(validData, {
      type: 'body',
      metatype: TestDto,
    });

    expect(result).toBeInstanceOf(TestDto);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.password).toBe('password123');
  });

  it('should throw BadRequestException for invalid data', async () => {
    const invalidData = {
      name: '',
      email: 'invalid-email',
      password: 'short',
    };

    await expect(
      pipe.transform(invalidData, {
        type: 'body',
        metatype: TestDto,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should format validation errors correctly', async () => {
    const invalidData = {
      name: '',
      email: 'invalid-email',
      password: 'short',
    };

    try {
      await pipe.transform(invalidData, {
        type: 'body',
        metatype: TestDto,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.objectContaining({
            name: expect.arrayContaining([expect.any(String)]),
            email: expect.arrayContaining([expect.any(String)]),
            password: expect.arrayContaining([expect.any(String)]),
          }),
        },
      });
    }
  });

  it('should pass through data for primitive types', async () => {
    const result = await pipe.transform('test', {
      type: 'param',
      metatype: String,
    });

    expect(result).toBe('test');
  });

  it('should pass through data when no metatype is provided', async () => {
    const data = { test: 'value' };
    const result = await pipe.transform(data, {
      type: 'body',
    });

    expect(result).toEqual(data);
  });

  it('should reject non-whitelisted properties', async () => {
    const dataWithExtra = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      extraProperty: 'should be removed',
    };

    await expect(
      pipe.transform(dataWithExtra, {
        type: 'body',
        metatype: TestDto,
      })
    ).rejects.toThrow(BadRequestException);
  });
});