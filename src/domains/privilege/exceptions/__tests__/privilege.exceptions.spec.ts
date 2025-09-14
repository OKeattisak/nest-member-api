import {
  PrivilegeNotFoundException,
  PrivilegeAlreadyExistsException,
  PrivilegeNotAvailableException,
  PrivilegeAlreadyOwnedException,
  PrivilegeExchangeFailedException,
  InvalidPrivilegeCostException,
  MemberPrivilegeNotFoundException,
  MemberPrivilegeAlreadyInactiveException,
  PrivilegeExpirationException,
} from '../privilege.exceptions';

describe('Privilege Domain Exceptions', () => {
  describe('PrivilegeNotFoundException', () => {
    it('should create exception with identifier', () => {
      const exception = new PrivilegeNotFoundException('privilege-123');
      
      expect(exception.message).toBe("Privilege with identifier 'privilege-123' not found");
      expect(exception.code).toBe('PRIVILEGE_NOT_FOUND');
    });
  });

  describe('PrivilegeAlreadyExistsException', () => {
    it('should create exception with privilege name', () => {
      const exception = new PrivilegeAlreadyExistsException('VIP Access');
      
      expect(exception.message).toBe("Privilege with name 'VIP Access' already exists");
      expect(exception.code).toBe('PRIVILEGE_ALREADY_EXISTS');
    });
  });

  describe('PrivilegeNotAvailableException', () => {
    it('should create exception with privilege name and reason', () => {
      const exception = new PrivilegeNotAvailableException('VIP Access', 'Currently disabled');
      
      expect(exception.message).toBe("Privilege 'VIP Access' is not available: Currently disabled");
      expect(exception.code).toBe('PRIVILEGE_NOT_AVAILABLE');
      expect(exception.details).toEqual({
        privilegeName: 'VIP Access',
        reason: 'Currently disabled',
      });
    });
  });

  describe('PrivilegeAlreadyOwnedException', () => {
    it('should create exception with privilege name and member ID', () => {
      const exception = new PrivilegeAlreadyOwnedException('VIP Access', 'member-123');
      
      expect(exception.message).toBe("Member 'member-123' already owns privilege 'VIP Access'");
      expect(exception.code).toBe('PRIVILEGE_ALREADY_OWNED');
      expect(exception.details).toEqual({
        privilegeName: 'VIP Access',
        memberId: 'member-123',
      });
    });
  });

  describe('PrivilegeExchangeFailedException', () => {
    it('should create exception with exchange details', () => {
      const exception = new PrivilegeExchangeFailedException('VIP Access', 'member-123', 'Insufficient points');
      
      expect(exception.message).toBe("Failed to exchange privilege 'VIP Access' for member 'member-123': Insufficient points");
      expect(exception.code).toBe('PRIVILEGE_EXCHANGE_FAILED');
      expect(exception.details).toEqual({
        privilegeName: 'VIP Access',
        memberId: 'member-123',
        reason: 'Insufficient points',
      });
    });
  });

  describe('InvalidPrivilegeCostException', () => {
    it('should create exception with cost and reason', () => {
      const exception = new InvalidPrivilegeCostException(-100, 'Cost cannot be negative');
      
      expect(exception.message).toBe("Invalid privilege cost '-100': Cost cannot be negative");
      expect(exception.code).toBe('INVALID_PRIVILEGE_COST');
      expect(exception.details).toEqual({
        cost: -100,
        reason: 'Cost cannot be negative',
      });
    });
  });

  describe('MemberPrivilegeNotFoundException', () => {
    it('should create exception with member privilege ID', () => {
      const exception = new MemberPrivilegeNotFoundException('mp-123');
      
      expect(exception.message).toBe("Member privilege with ID 'mp-123' not found");
      expect(exception.code).toBe('MEMBER_PRIVILEGE_NOT_FOUND');
    });
  });

  describe('MemberPrivilegeAlreadyInactiveException', () => {
    it('should create exception with member privilege ID', () => {
      const exception = new MemberPrivilegeAlreadyInactiveException('mp-123');
      
      expect(exception.message).toBe("Member privilege 'mp-123' is already inactive");
      expect(exception.code).toBe('MEMBER_PRIVILEGE_ALREADY_INACTIVE');
    });
  });

  describe('PrivilegeExpirationException', () => {
    it('should create exception with reason', () => {
      const exception = new PrivilegeExpirationException('Job processing failed');
      
      expect(exception.message).toBe('Privilege expiration processing failed: Job processing failed');
      expect(exception.code).toBe('PRIVILEGE_EXPIRATION_ERROR');
    });
  });

  describe('Exception inheritance', () => {
    it('should extend Error correctly', () => {
      const exception = new PrivilegeNotFoundException('123');
      
      expect(exception).toBeInstanceOf(Error);
      expect(exception.stack).toBeDefined();
    });

    it('should have correct name property', () => {
      const exception = new PrivilegeExchangeFailedException('VIP', 'member', 'reason');
      
      expect(exception.name).toBe('PrivilegeExchangeFailedException');
    });
  });
});