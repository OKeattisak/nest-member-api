import { Privilege, PrivilegeProps, UpdatePrivilegeData } from '../privilege.entity';
import { PointAmount } from '../../../common/value-objects';

describe('Privilege Entity', () => {
  const validPrivilegeProps: PrivilegeProps = {
    id: 'privilege-123',
    name: 'Premium Access',
    description: 'Access to premium features',
    pointCost: 100,
    isActive: true,
    validityDays: 30,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  describe('constructor', () => {
    it('should create a valid privilege', () => {
      const privilege = new Privilege(validPrivilegeProps);
      expect(privilege.id).toBe('privilege-123');
      expect(privilege.name).toBe('Premium Access');
      expect(privilege.description).toBe('Access to premium features');
      expect(privilege.pointCost).toBe(100);
      expect(privilege.isActive).toBe(true);
      expect(privilege.validityDays).toBe(30);
      expect(privilege.hasExpiration).toBe(true);
      expect(privilege.isPermanent).toBe(false);
    });

    it('should create privilege without validity days', () => {
      const props = { ...validPrivilegeProps, validityDays: undefined };
      const privilege = new Privilege(props);
      expect(privilege.validityDays).toBeUndefined();
      expect(privilege.hasExpiration).toBe(false);
      expect(privilege.isPermanent).toBe(true);
    });

    it('should throw error for empty ID', () => {
      const props = { ...validPrivilegeProps, id: '' };
      expect(() => new Privilege(props)).toThrow('Privilege ID is required');
    });

    it('should throw error for empty name', () => {
      const props = { ...validPrivilegeProps, name: '' };
      expect(() => new Privilege(props)).toThrow('Privilege name is required');
    });

    it('should throw error for name exceeding 200 characters', () => {
      const props = { ...validPrivilegeProps, name: 'a'.repeat(201) };
      expect(() => new Privilege(props)).toThrow('Privilege name cannot exceed 200 characters');
    });

    it('should throw error for empty description', () => {
      const props = { ...validPrivilegeProps, description: '' };
      expect(() => new Privilege(props)).toThrow('Privilege description is required');
    });

    it('should throw error for description exceeding 1000 characters', () => {
      const props = { ...validPrivilegeProps, description: 'a'.repeat(1001) };
      expect(() => new Privilege(props)).toThrow('Privilege description cannot exceed 1000 characters');
    });

    it('should throw error for validity days less than or equal to 0', () => {
      const props = { ...validPrivilegeProps, validityDays: 0 };
      expect(() => new Privilege(props)).toThrow('Validity days must be greater than 0');
    });

    it('should throw error for validity days exceeding 3650', () => {
      const props = { ...validPrivilegeProps, validityDays: 3651 };
      expect(() => new Privilege(props)).toThrow('Validity days cannot exceed 3650 days (10 years)');
    });
  });

  describe('updateCost', () => {
    let privilege: Privilege;

    beforeEach(() => {
      privilege = new Privilege(validPrivilegeProps);
    });

    it('should update point cost', () => {
      privilege.updateCost(150);
      expect(privilege.pointCost).toBe(150);
    });

    it('should throw error when updating cost of inactive privilege', () => {
      const inactivePrivilege = new Privilege({ ...validPrivilegeProps, isActive: false });
      expect(() => inactivePrivilege.updateCost(150))
        .toThrow('Cannot update cost of inactive privilege');
    });

    it('should throw error when new cost is same as current cost', () => {
      expect(() => privilege.updateCost(100))
        .toThrow('New cost must be different from current cost');
    });
  });

  describe('activate and deactivate', () => {
    it('should activate inactive privilege', () => {
      const inactivePrivilege = new Privilege({ ...validPrivilegeProps, isActive: false });
      inactivePrivilege.activate();
      expect(inactivePrivilege.isActive).toBe(true);
    });

    it('should throw error when activating already active privilege', () => {
      const privilege = new Privilege(validPrivilegeProps);
      expect(() => privilege.activate()).toThrow('Privilege is already active');
    });

    it('should deactivate active privilege', () => {
      const privilege = new Privilege(validPrivilegeProps);
      privilege.deactivate();
      expect(privilege.isActive).toBe(false);
    });

    it('should throw error when deactivating already inactive privilege', () => {
      const inactivePrivilege = new Privilege({ ...validPrivilegeProps, isActive: false });
      expect(() => inactivePrivilege.deactivate()).toThrow('Privilege is already inactive');
    });
  });

  describe('update', () => {
    let privilege: Privilege;

    beforeEach(() => {
      privilege = new Privilege(validPrivilegeProps);
    });

    it('should update name', () => {
      const updateData: UpdatePrivilegeData = { name: 'VIP Access' };
      privilege.update(updateData);
      expect(privilege.name).toBe('VIP Access');
    });

    it('should update description', () => {
      const updateData: UpdatePrivilegeData = { description: 'VIP features access' };
      privilege.update(updateData);
      expect(privilege.description).toBe('VIP features access');
    });

    it('should update point cost', () => {
      const updateData: UpdatePrivilegeData = { pointCost: 200 };
      privilege.update(updateData);
      expect(privilege.pointCost).toBe(200);
    });

    it('should update validity days', () => {
      const updateData: UpdatePrivilegeData = { validityDays: 60 };
      privilege.update(updateData);
      expect(privilege.validityDays).toBe(60);
    });

    it('should update multiple fields', () => {
      const updateData: UpdatePrivilegeData = {
        name: 'VIP Access',
        description: 'VIP features access',
        pointCost: 200,
        validityDays: 60
      };
      privilege.update(updateData);
      expect(privilege.name).toBe('VIP Access');
      expect(privilege.description).toBe('VIP features access');
      expect(privilege.pointCost).toBe(200);
      expect(privilege.validityDays).toBe(60);
    });

    it('should trim whitespace from name and description', () => {
      const updateData: UpdatePrivilegeData = {
        name: '  VIP Access  ',
        description: '  VIP features access  '
      };
      privilege.update(updateData);
      expect(privilege.name).toBe('VIP Access');
      expect(privilege.description).toBe('VIP features access');
    });

    it('should throw error when updating inactive privilege', () => {
      const inactivePrivilege = new Privilege({ ...validPrivilegeProps, isActive: false });
      expect(() => inactivePrivilege.update({ name: 'New Name' }))
        .toThrow('Cannot update inactive privilege');
    });

    it('should throw error for empty name', () => {
      expect(() => privilege.update({ name: '' }))
        .toThrow('Privilege name cannot be empty');
    });

    it('should throw error for name exceeding 200 characters', () => {
      expect(() => privilege.update({ name: 'a'.repeat(201) }))
        .toThrow('Privilege name cannot exceed 200 characters');
    });

    it('should throw error for empty description', () => {
      expect(() => privilege.update({ description: '' }))
        .toThrow('Privilege description cannot be empty');
    });

    it('should throw error for description exceeding 1000 characters', () => {
      expect(() => privilege.update({ description: 'a'.repeat(1001) }))
        .toThrow('Privilege description cannot exceed 1000 characters');
    });

    it('should throw error for validity days less than or equal to 0', () => {
      expect(() => privilege.update({ validityDays: 0 }))
        .toThrow('Validity days must be greater than 0');
    });

    it('should throw error for validity days exceeding 3650', () => {
      expect(() => privilege.update({ validityDays: 3651 }))
        .toThrow('Validity days cannot exceed 3650 days (10 years)');
    });

    it('should not update timestamp when no changes are made', () => {
      const originalUpdatedAt = privilege.updatedAt;
      privilege.update({ name: privilege.name }); // Same name
      expect(privilege.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('canBeExchanged', () => {
    it('should return true for active privilege', () => {
      const privilege = new Privilege(validPrivilegeProps);
      expect(privilege.canBeExchanged()).toBe(true);
    });

    it('should return false for inactive privilege', () => {
      const inactivePrivilege = new Privilege({ ...validPrivilegeProps, isActive: false });
      expect(inactivePrivilege.canBeExchanged()).toBe(false);
    });
  });

  describe('calculateExpirationDate', () => {
    it('should calculate expiration date for privilege with validity days', () => {
      const privilege = new Privilege(validPrivilegeProps);
      const grantedAt = new Date('2023-01-01');
      const expirationDate = privilege.calculateExpirationDate(grantedAt);
      
      const expectedDate = new Date('2023-01-31'); // 30 days later
      expect(expirationDate).toEqual(expectedDate);
    });

    it('should return null for permanent privilege', () => {
      const permanentPrivilege = new Privilege({ ...validPrivilegeProps, validityDays: undefined });
      const expirationDate = permanentPrivilege.calculateExpirationDate();
      expect(expirationDate).toBeNull();
    });

    it('should use current date when no granted date provided', () => {
      const privilege = new Privilege(validPrivilegeProps);
      const expirationDate = privilege.calculateExpirationDate();
      expect(expirationDate).toBeInstanceOf(Date);
    });
  });

  describe('isAffordable', () => {
    it('should return true when available points are sufficient', () => {
      const privilege = new Privilege(validPrivilegeProps);
      const availablePoints = new PointAmount(150);
      expect(privilege.isAffordable(availablePoints)).toBe(true);
    });

    it('should return true when available points are exactly equal to cost', () => {
      const privilege = new Privilege(validPrivilegeProps);
      const availablePoints = new PointAmount(100);
      expect(privilege.isAffordable(availablePoints)).toBe(true);
    });

    it('should return false when available points are insufficient', () => {
      const privilege = new Privilege(validPrivilegeProps);
      const availablePoints = new PointAmount(50);
      expect(privilege.isAffordable(availablePoints)).toBe(false);
    });
  });

  describe('getRequiredPoints', () => {
    it('should return the point cost as PointAmount', () => {
      const privilege = new Privilege(validPrivilegeProps);
      const requiredPoints = privilege.getRequiredPoints();
      expect(requiredPoints.getValue()).toBe(100);
    });
  });

  describe('factory method', () => {
    it('should create privilege with factory method', () => {
      const privilege = Privilege.create(
        'privilege-1',
        'Test Privilege',
        'Test description',
        50,
        15
      );
      
      expect(privilege.id).toBe('privilege-1');
      expect(privilege.name).toBe('Test Privilege');
      expect(privilege.description).toBe('Test description');
      expect(privilege.pointCost).toBe(50);
      expect(privilege.validityDays).toBe(15);
      expect(privilege.isActive).toBe(true);
    });

    it('should create permanent privilege with factory method', () => {
      const privilege = Privilege.create(
        'privilege-1',
        'Permanent Privilege',
        'Permanent access',
        100
      );
      
      expect(privilege.validityDays).toBeUndefined();
      expect(privilege.isPermanent).toBe(true);
    });

    it('should trim whitespace in factory method', () => {
      const privilege = Privilege.create(
        'privilege-1',
        '  Test Privilege  ',
        '  Test description  ',
        50
      );
      
      expect(privilege.name).toBe('Test Privilege');
      expect(privilege.description).toBe('Test description');
    });
  });
});