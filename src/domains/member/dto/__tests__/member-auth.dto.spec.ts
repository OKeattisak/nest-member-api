import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MemberRegisterDto, MemberLoginDto } from '../member-auth.dto';

describe('Member Auth DTOs', () => {
  describe('MemberRegisterDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(MemberRegisterDto, validData);
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

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('email');
    });

    it('should fail validation with empty email', async () => {
      const invalidData = {
        email: '',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
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

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('username');
    });

    it('should fail validation with long username', async () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'a'.repeat(51),
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
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

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('username');
    });

    it('should fail validation with weak password', async () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('password');
    });

    it('should fail validation with invalid first name characters', async () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John123',
        lastName: 'Doe',
      };

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('firstName');
    });

    it('should fail validation with invalid last name characters', async () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe@123',
      };

      const dto = plainToClass(MemberRegisterDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('lastName');
    });

    it('should transform email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        username: 'testuser',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const dto = plainToClass(MemberRegisterDto, data);
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

      const dto = plainToClass(MemberRegisterDto, data);
      expect(dto.email).toBe('test@example.com');
      expect(dto.username).toBe('testuser');
      expect(dto.firstName).toBe('John');
      expect(dto.lastName).toBe('Doe');
    });
  });

  describe('MemberLoginDto', () => {
    it('should pass validation with valid email', async () => {
      const validData = {
        emailOrUsername: 'test@example.com',
        password: 'password123',
      };

      const dto = plainToClass(MemberLoginDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid username', async () => {
      const validData = {
        emailOrUsername: 'testuser',
        password: 'password123',
      };

      const dto = plainToClass(MemberLoginDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty emailOrUsername', async () => {
      const invalidData = {
        emailOrUsername: '',
        password: 'password123',
      };

      const dto = plainToClass(MemberLoginDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('emailOrUsername');
    });

    it('should fail validation with empty password', async () => {
      const invalidData = {
        emailOrUsername: 'test@example.com',
        password: '',
      };

      const dto = plainToClass(MemberLoginDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('password');
    });

    it('should trim whitespace from emailOrUsername', () => {
      const data = {
        emailOrUsername: '  test@example.com  ',
        password: 'password123',
      };

      const dto = plainToClass(MemberLoginDto, data);
      expect(dto.emailOrUsername).toBe('test@example.com');
    });
  });
});