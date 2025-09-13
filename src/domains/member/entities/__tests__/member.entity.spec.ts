import { Member, MemberProps, UpdateProfileData } from '../member.entity';

describe('Member Entity', () => {
  const validMemberProps: MemberProps = {
    id: 'member-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  describe('constructor', () => {
    it('should create a valid member', () => {
      const member = new Member(validMemberProps);
      expect(member.id).toBe('member-123');
      expect(member.email).toBe('test@example.com');
      expect(member.username).toBe('testuser');
      expect(member.firstName).toBe('John');
      expect(member.lastName).toBe('Doe');
      expect(member.fullName).toBe('John Doe');
      expect(member.isActive).toBe(true);
      expect(member.isDeleted).toBe(false);
    });

    it('should throw error for empty ID', () => {
      const props = { ...validMemberProps, id: '' };
      expect(() => new Member(props)).toThrow('Member ID is required');
    });

    it('should throw error for empty username', () => {
      const props = { ...validMemberProps, username: '' };
      expect(() => new Member(props)).toThrow('Username is required');
    });

    it('should throw error for username shorter than 3 characters', () => {
      const props = { ...validMemberProps, username: 'ab' };
      expect(() => new Member(props)).toThrow('Username must be at least 3 characters long');
    });

    it('should throw error for username longer than 50 characters', () => {
      const props = { ...validMemberProps, username: 'a'.repeat(51) };
      expect(() => new Member(props)).toThrow('Username cannot exceed 50 characters');
    });

    it('should throw error for empty password hash', () => {
      const props = { ...validMemberProps, passwordHash: '' };
      expect(() => new Member(props)).toThrow('Password hash is required');
    });

    it('should throw error for empty first name', () => {
      const props = { ...validMemberProps, firstName: '' };
      expect(() => new Member(props)).toThrow('First name is required');
    });

    it('should throw error for first name longer than 100 characters', () => {
      const props = { ...validMemberProps, firstName: 'a'.repeat(101) };
      expect(() => new Member(props)).toThrow('First name cannot exceed 100 characters');
    });

    it('should throw error for empty last name', () => {
      const props = { ...validMemberProps, lastName: '' };
      expect(() => new Member(props)).toThrow('Last name is required');
    });

    it('should throw error for last name longer than 100 characters', () => {
      const props = { ...validMemberProps, lastName: 'a'.repeat(101) };
      expect(() => new Member(props)).toThrow('Last name cannot exceed 100 characters');
    });

    it('should handle deleted member', () => {
      const props = { ...validMemberProps, deletedAt: new Date() };
      const member = new Member(props);
      expect(member.isDeleted).toBe(true);
    });
  });

  describe('updateProfile', () => {
    let member: Member;

    beforeEach(() => {
      member = new Member(validMemberProps);
    });

    it('should update first name', () => {
      const updateData: UpdateProfileData = { firstName: 'Jane' };
      member.updateProfile(updateData);
      expect(member.firstName).toBe('Jane');
      expect(member.fullName).toBe('Jane Doe');
    });

    it('should update last name', () => {
      const updateData: UpdateProfileData = { lastName: 'Smith' };
      member.updateProfile(updateData);
      expect(member.lastName).toBe('Smith');
      expect(member.fullName).toBe('John Smith');
    });

    it('should update username', () => {
      const updateData: UpdateProfileData = { username: 'newusername' };
      member.updateProfile(updateData);
      expect(member.username).toBe('newusername');
    });

    it('should update multiple fields', () => {
      const updateData: UpdateProfileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith'
      };
      member.updateProfile(updateData);
      expect(member.firstName).toBe('Jane');
      expect(member.lastName).toBe('Smith');
      expect(member.username).toBe('janesmith');
      expect(member.fullName).toBe('Jane Smith');
    });

    it('should trim whitespace from fields', () => {
      const updateData: UpdateProfileData = {
        firstName: '  Jane  ',
        lastName: '  Smith  ',
        username: '  janesmith  '
      };
      member.updateProfile(updateData);
      expect(member.firstName).toBe('Jane');
      expect(member.lastName).toBe('Smith');
      expect(member.username).toBe('janesmith');
    });

    it('should throw error when updating deleted member', () => {
      const deletedMember = new Member({ ...validMemberProps, deletedAt: new Date() });
      expect(() => deletedMember.updateProfile({ firstName: 'Jane' }))
        .toThrow('Cannot update profile of deleted member');
    });

    it('should throw error when updating inactive member', () => {
      const inactiveMember = new Member({ ...validMemberProps, isActive: false });
      expect(() => inactiveMember.updateProfile({ firstName: 'Jane' }))
        .toThrow('Cannot update profile of inactive member');
    });

    it('should throw error for empty first name', () => {
      expect(() => member.updateProfile({ firstName: '' }))
        .toThrow('First name cannot be empty');
    });

    it('should throw error for first name exceeding 100 characters', () => {
      expect(() => member.updateProfile({ firstName: 'a'.repeat(101) }))
        .toThrow('First name cannot exceed 100 characters');
    });

    it('should throw error for empty username', () => {
      expect(() => member.updateProfile({ username: '' }))
        .toThrow('Username cannot be empty');
    });

    it('should throw error for username shorter than 3 characters', () => {
      expect(() => member.updateProfile({ username: 'ab' }))
        .toThrow('Username must be at least 3 characters long');
    });
  });

  describe('deactivate', () => {
    it('should deactivate active member', () => {
      const member = new Member(validMemberProps);
      member.deactivate();
      expect(member.isActive).toBe(false);
    });

    it('should throw error when deactivating deleted member', () => {
      const deletedMember = new Member({ ...validMemberProps, deletedAt: new Date() });
      expect(() => deletedMember.deactivate()).toThrow('Cannot deactivate deleted member');
    });

    it('should throw error when deactivating already inactive member', () => {
      const inactiveMember = new Member({ ...validMemberProps, isActive: false });
      expect(() => inactiveMember.deactivate()).toThrow('Member is already inactive');
    });
  });

  describe('activate', () => {
    it('should activate inactive member', () => {
      const inactiveMember = new Member({ ...validMemberProps, isActive: false });
      inactiveMember.activate();
      expect(inactiveMember.isActive).toBe(true);
    });

    it('should throw error when activating deleted member', () => {
      const deletedMember = new Member({ ...validMemberProps, deletedAt: new Date() });
      expect(() => deletedMember.activate()).toThrow('Cannot activate deleted member');
    });

    it('should throw error when activating already active member', () => {
      const member = new Member(validMemberProps);
      expect(() => member.activate()).toThrow('Member is already active');
    });
  });

  describe('softDelete', () => {
    it('should soft delete member', () => {
      const member = new Member(validMemberProps);
      member.softDelete();
      expect(member.isDeleted).toBe(true);
      expect(member.isActive).toBe(false);
      expect(member.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw error when deleting already deleted member', () => {
      const deletedMember = new Member({ ...validMemberProps, deletedAt: new Date() });
      expect(() => deletedMember.softDelete()).toThrow('Member is already deleted');
    });
  });

  describe('updatePasswordHash', () => {
    it('should update password hash', () => {
      const member = new Member(validMemberProps);
      const newHash = 'new-hashed-password';
      member.updatePasswordHash(newHash);
      expect(member.passwordHash).toBe(newHash);
    });

    it('should throw error when updating password of deleted member', () => {
      const deletedMember = new Member({ ...validMemberProps, deletedAt: new Date() });
      expect(() => deletedMember.updatePasswordHash('new-hash'))
        .toThrow('Cannot update password of deleted member');
    });

    it('should throw error when updating password of inactive member', () => {
      const inactiveMember = new Member({ ...validMemberProps, isActive: false });
      expect(() => inactiveMember.updatePasswordHash('new-hash'))
        .toThrow('Cannot update password of inactive member');
    });

    it('should throw error for empty password hash', () => {
      const member = new Member(validMemberProps);
      expect(() => member.updatePasswordHash(''))
        .toThrow('Password hash is required');
    });
  });

  describe('point calculation methods', () => {
    let member: Member;

    beforeEach(() => {
      member = new Member(validMemberProps);
    });

    it('should calculate total points', () => {
      const points = [
        { amount: 100, isExpired: false },
        { amount: 50, isExpired: true },
        { amount: -25, isExpired: false }
      ];
      const total = member.calculateTotalPoints(points);
      expect(total.getValue()).toBe(125);
    });

    it('should calculate available points excluding expired', () => {
      const points = [
        { amount: 100, isExpired: false },
        { amount: 50, isExpired: true },
        { amount: 75, isExpired: false }
      ];
      const available = member.calculateAvailablePoints(points);
      expect(available.getValue()).toBe(175);
    });

    it('should check if member can exchange points', () => {
      const member = new Member(validMemberProps);
      const requiredAmount = member.calculateTotalPoints([{ amount: 50, isExpired: false }]);
      const availableAmount = member.calculateTotalPoints([{ amount: 100, isExpired: false }]);
      
      expect(member.canExchangePoints(requiredAmount, availableAmount)).toBe(true);
    });

    it('should return false for point exchange when member is inactive', () => {
      const inactiveMember = new Member({ ...validMemberProps, isActive: false });
      const requiredAmount = inactiveMember.calculateTotalPoints([{ amount: 50, isExpired: false }]);
      const availableAmount = inactiveMember.calculateTotalPoints([{ amount: 100, isExpired: false }]);
      
      expect(inactiveMember.canExchangePoints(requiredAmount, availableAmount)).toBe(false);
    });

    it('should return false for point exchange when member is deleted', () => {
      const deletedMember = new Member({ ...validMemberProps, deletedAt: new Date() });
      const requiredAmount = deletedMember.calculateTotalPoints([{ amount: 50, isExpired: false }]);
      const availableAmount = deletedMember.calculateTotalPoints([{ amount: 100, isExpired: false }]);
      
      expect(deletedMember.canExchangePoints(requiredAmount, availableAmount)).toBe(false);
    });
  });
});