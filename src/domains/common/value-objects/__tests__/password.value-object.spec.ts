import { Password } from '../password.value-object';

describe('Password Value Object', () => {
  describe('constructor', () => {
    it('should create a valid password', () => {
      const password = new Password('ValidPass123!');
      expect(password.getValue()).toBe('ValidPass123!');
    });

    it('should throw error for null password', () => {
      expect(() => new Password(null as any)).toThrow('Password is required and must be a string');
    });

    it('should throw error for undefined password', () => {
      expect(() => new Password(undefined as any)).toThrow('Password is required and must be a string');
    });

    it('should throw error for non-string password', () => {
      expect(() => new Password(123 as any)).toThrow('Password is required and must be a string');
    });

    it('should throw error for password shorter than 8 characters', () => {
      expect(() => new Password('Short1!')).toThrow('Password must be at least 8 characters long');
    });

    it('should throw error for password longer than 128 characters', () => {
      const longPassword = 'A'.repeat(126) + '1a!'; // 129 characters total
      expect(() => new Password(longPassword)).toThrow('Password cannot exceed 128 characters');
    });

    it('should throw error for password without uppercase letter', () => {
      expect(() => new Password('lowercase123!')).toThrow('Password must contain at least one uppercase letter');
    });

    it('should throw error for password without lowercase letter', () => {
      expect(() => new Password('UPPERCASE123!')).toThrow('Password must contain at least one lowercase letter');
    });

    it('should throw error for password without digit', () => {
      expect(() => new Password('NoDigitsHere!')).toThrow('Password must contain at least one digit');
    });

    it('should throw error for password without special character', () => {
      expect(() => new Password('NoSpecialChar123')).toThrow('Password must contain at least one special character');
    });

    it('should accept password with all required character types', () => {
      const validPasswords = [
        'ValidPass123!',
        'Another1@',
        'Complex#Pass9',
        'Str0ng$Password',
        'Test123_Pass'
      ];

      validPasswords.forEach(validPassword => {
        expect(() => new Password(validPassword)).not.toThrow();
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal passwords', () => {
      const password1 = new Password('ValidPass123!');
      const password2 = new Password('ValidPass123!');
      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false for different passwords', () => {
      const password1 = new Password('ValidPass123!');
      const password2 = new Password('DifferentPass456@');
      expect(password1.equals(password2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return protected string instead of actual password', () => {
      const password = new Password('ValidPass123!');
      expect(password.toString()).toBe('[PROTECTED]');
    });
  });
});