import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// Simplified DTO for testing without database dependencies
class SimpleMemberRegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @IsNotEmpty({ message: 'Username is required' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
  @Transform(({ value }) => value?.trim())
  username!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @IsNotEmpty({ message: 'First name is required' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, apostrophes, and hyphens' })
  @Transform(({ value }) => value?.trim())
  lastName!: string;
}

class SimpleMemberLoginDto {
  @IsString({ message: 'Email or username must be a string' })
  @IsNotEmpty({ message: 'Email or username is required' })
  @Transform(({ value }) => value?.trim())
  emailOrUsername!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

describe('Member Auth DTOs - Basic Validation', () => {
  describe('SimpleMemberRegisterDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(SimpleMemberRegisterDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(SimpleMemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('email');
    });

    it('should fail validation with short username', async () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'ab',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(SimpleMemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('username');
    });

    it('should fail validation with invalid username characters', async () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'test user!',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(SimpleMemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('username');
    });

    it('should fail validation with short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(SimpleMemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('password');
    });

    it('should transform email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(SimpleMemberRegisterDto, data);
      expect(dto.email).toBe('test@example.com');
    });

    it('should trim whitespace from fields', () => {
      const data = {
        email: '  test@example.com  ',
        username: '  testuser  ',
        password: 'StrongPass123!',
        firstName: '  John  ',
        lastName: '  Doe  ',
      };

      const dto = plainToClass(SimpleMemberRegisterDto, data);
      expect(dto.email).toBe('test@example.com');
      expect(dto.username).toBe('testuser');
      expect(dto.firstName).toBe('John');
      expect(dto.lastName).toBe('Doe');
    });
  });

  describe('SimpleMemberLoginDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        emailOrUsername: 'test@example.com',
        password: 'password123',
      };

      const dto = plainToClass(SimpleMemberLoginDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty emailOrUsername', async () => {
      const invalidData = {
        emailOrUsername: '',
        password: 'password123',
      };

      const dto = plainToClass(SimpleMemberLoginDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('emailOrUsername');
    });

    it('should trim whitespace from emailOrUsername', () => {
      const data = {
        emailOrUsername: '  test@example.com  ',
        password: 'password123',
      };

      const dto = plainToClass(SimpleMemberLoginDto, data);
      expect(dto.emailOrUsername).toBe('test@example.com');
    });
  });
});