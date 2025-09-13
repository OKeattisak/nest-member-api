import { Email } from '../email.value-object';

describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create a valid email', () => {
      const email = new Email('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = new Email('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = new Email('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error for null email', () => {
      expect(() => new Email(null as any)).toThrow('Email is required and must be a string');
    });

    it('should throw error for undefined email', () => {
      expect(() => new Email(undefined as any)).toThrow('Email is required and must be a string');
    });

    it('should throw error for non-string email', () => {
      expect(() => new Email(123 as any)).toThrow('Email is required and must be a string');
    });

    it('should throw error for empty email', () => {
      expect(() => new Email('')).toThrow('Email cannot be empty');
    });

    it('should throw error for whitespace-only email', () => {
      expect(() => new Email('   ')).toThrow('Email cannot be empty');
    });

    it('should throw error for email exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => new Email(longEmail)).toThrow('Email cannot exceed 254 characters');
    });

    it('should throw error for invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test@example.',
        'test @example.com',
        'test@exam ple.com'
      ];

      invalidEmails.forEach(invalidEmail => {
        expect(() => new Email(invalidEmail)).toThrow('Invalid email format');
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('TEST@EXAMPLE.COM');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the email value', () => {
      const email = new Email('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});