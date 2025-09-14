import {
  MemberAlreadyExistsException,
  MemberNotFoundException,
  MemberInactiveException,
  InvalidCredentialsException,
  WeakPasswordException,
  PasswordMismatchException,
  MemberProfileUpdateException,
} from '../member.exceptions';

describe('Member Domain Exceptions', () => {
  describe('MemberAlreadyExistsException', () => {
    it('should create exception for email conflict', () => {
      const exception = new MemberAlreadyExistsException('test@example.com', 'email');
      
      expect(exception.message).toBe("Member with email 'test@example.com' already exists");
      expect(exception.code).toBe('MEMBER_ALREADY_EXISTS');
      expect(exception.name).toBe('MemberAlreadyExistsException');
    });

    it('should create exception for username conflict', () => {
      const exception = new MemberAlreadyExistsException('testuser', 'username');
      
      expect(exception.message).toBe("Member with username 'testuser' already exists");
      expect(exception.code).toBe('MEMBER_ALREADY_EXISTS');
    });
  });

  describe('MemberNotFoundException', () => {
    it('should create exception with identifier', () => {
      const exception = new MemberNotFoundException('123');
      
      expect(exception.message).toBe("Member with identifier '123' not found");
      expect(exception.code).toBe('MEMBER_NOT_FOUND');
    });
  });

  describe('MemberInactiveException', () => {
    it('should create exception with member ID', () => {
      const exception = new MemberInactiveException('member-123');
      
      expect(exception.message).toBe("Member 'member-123' is inactive or deleted");
      expect(exception.code).toBe('MEMBER_INACTIVE');
    });
  });

  describe('InvalidCredentialsException', () => {
    it('should create exception with default message', () => {
      const exception = new InvalidCredentialsException();
      
      expect(exception.message).toBe('Invalid credentials provided');
      expect(exception.code).toBe('INVALID_CREDENTIALS');
    });

    it('should create exception with custom message', () => {
      const exception = new InvalidCredentialsException('Custom message');
      
      expect(exception.message).toBe('Custom message');
      expect(exception.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('WeakPasswordException', () => {
    it('should create exception with password errors', () => {
      const errors = ['Too short', 'Missing uppercase'];
      const exception = new WeakPasswordException(errors);
      
      expect(exception.message).toBe('Password does not meet strength requirements: Too short, Missing uppercase');
      expect(exception.code).toBe('WEAK_PASSWORD');
      expect(exception.details).toEqual({ errors });
    });
  });

  describe('PasswordMismatchException', () => {
    it('should create exception with default message', () => {
      const exception = new PasswordMismatchException();
      
      expect(exception.message).toBe('Current password is incorrect');
      expect(exception.code).toBe('PASSWORD_MISMATCH');
    });
  });

  describe('MemberProfileUpdateException', () => {
    it('should create exception with reason', () => {
      const exception = new MemberProfileUpdateException('Invalid data');
      
      expect(exception.message).toBe('Failed to update member profile: Invalid data');
      expect(exception.code).toBe('MEMBER_PROFILE_UPDATE_FAILED');
    });
  });

  describe('Exception inheritance', () => {
    it('should extend Error correctly', () => {
      const exception = new MemberNotFoundException('123');
      
      expect(exception).toBeInstanceOf(Error);
      expect(exception.stack).toBeDefined();
    });

    it('should have correct name property', () => {
      const exception = new WeakPasswordException(['test']);
      
      expect(exception.name).toBe('WeakPasswordException');
    });
  });
});