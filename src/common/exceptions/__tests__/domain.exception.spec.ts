import {
  ValidationException,
  NotFoundExceptionDomain,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BusinessRuleException,
} from '../domain.exception';

describe('Domain Exceptions', () => {
  describe('ValidationException', () => {
    it('should create exception with message and code', () => {
      const exception = new ValidationException('Validation failed');
      
      expect(exception.message).toBe('Validation failed');
      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.name).toBe('ValidationException');
    });

    it('should create exception with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const exception = new ValidationException('Validation failed', details);
      
      expect(exception.message).toBe('Validation failed');
      expect(exception.details).toEqual(details);
    });
  });

  describe('NotFoundExceptionDomain', () => {
    it('should create exception with resource name only', () => {
      const exception = new NotFoundExceptionDomain('User');
      
      expect(exception.message).toBe('User not found');
      expect(exception.code).toBe('NOT_FOUND');
    });

    it('should create exception with resource name and identifier', () => {
      const exception = new NotFoundExceptionDomain('User', '123');
      
      expect(exception.message).toBe("User with identifier '123' not found");
      expect(exception.code).toBe('NOT_FOUND');
    });
  });

  describe('UnauthorizedException', () => {
    it('should create exception with default message', () => {
      const exception = new UnauthorizedException();
      
      expect(exception.message).toBe('Unauthorized access');
      expect(exception.code).toBe('UNAUTHORIZED');
    });

    it('should create exception with custom message', () => {
      const exception = new UnauthorizedException('Invalid token');
      
      expect(exception.message).toBe('Invalid token');
      expect(exception.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenException', () => {
    it('should create exception with default message', () => {
      const exception = new ForbiddenException();
      
      expect(exception.message).toBe('Access forbidden');
      expect(exception.code).toBe('FORBIDDEN');
    });

    it('should create exception with custom message', () => {
      const exception = new ForbiddenException('Insufficient permissions');
      
      expect(exception.message).toBe('Insufficient permissions');
      expect(exception.code).toBe('FORBIDDEN');
    });
  });

  describe('ConflictException', () => {
    it('should create exception with message', () => {
      const exception = new ConflictException('Resource already exists');
      
      expect(exception.message).toBe('Resource already exists');
      expect(exception.code).toBe('CONFLICT');
    });
  });

  describe('BusinessRuleException', () => {
    it('should create exception with message', () => {
      const exception = new BusinessRuleException('Business rule violated');
      
      expect(exception.message).toBe('Business rule violated');
      expect(exception.code).toBe('BUSINESS_RULE_VIOLATION');
    });
  });

  describe('Exception inheritance', () => {
    it('should extend Error correctly', () => {
      const exception = new ValidationException('test');
      
      expect(exception).toBeInstanceOf(Error);
      expect(exception.stack).toBeDefined();
    });

    it('should have correct name property', () => {
      const exception = new BusinessRuleException('test');
      
      expect(exception.name).toBe('BusinessRuleException');
    });
  });
});