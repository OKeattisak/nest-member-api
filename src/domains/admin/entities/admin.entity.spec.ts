import { Admin, AdminRole, AdminProps, UpdateAdminData } from './admin.entity';

describe('Admin Entity', () => {
  const validAdminProps: AdminProps = {
    id: 'admin-123',
    email: 'admin@example.com',
    username: 'adminuser',
    passwordHash: 'hashedPassword123',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  describe('constructor', () => {
    it('should create admin with valid props', () => {
      const admin = new Admin(validAdminProps);

      expect(admin.id).toBe(validAdminProps.id);
      expect(admin.email).toBe(validAdminProps.email);
      expect(admin.username).toBe(validAdminProps.username);
      expect(admin.passwordHash).toBe(validAdminProps.passwordHash);
      expect(admin.role).toBe(validAdminProps.role);
      expect(admin.isActive).toBe(validAdminProps.isActive);
      expect(admin.createdAt).toBe(validAdminProps.createdAt);
      expect(admin.updatedAt).toBe(validAdminProps.updatedAt);
    });

    it('should throw error for empty ID', () => {
      const props = { ...validAdminProps, id: '' };
      
      expect(() => new Admin(props)).toThrow('Admin ID is required');
    });

    it('should throw error for empty username', () => {
      const props = { ...validAdminProps, username: '' };
      
      expect(() => new Admin(props)).toThrow('Username is required');
    });

    it('should throw error for short username', () => {
      const props = { ...validAdminProps, username: 'ab' };
      
      expect(() => new Admin(props)).toThrow('Username must be at least 3 characters long');
    });

    it('should throw error for long username', () => {
      const props = { ...validAdminProps, username: 'a'.repeat(51) };
      
      expect(() => new Admin(props)).toThrow('Username cannot exceed 50 characters');
    });

    it('should throw error for empty password hash', () => {
      const props = { ...validAdminProps, passwordHash: '' };
      
      expect(() => new Admin(props)).toThrow('Password hash is required');
    });

    it('should throw error for invalid role', () => {
      const props = { ...validAdminProps, role: 'INVALID_ROLE' as AdminRole };
      
      expect(() => new Admin(props)).toThrow('Invalid admin role');
    });

    it('should throw error for invalid email', () => {
      const props = { ...validAdminProps, email: 'invalid-email' };
      
      expect(() => new Admin(props)).toThrow('Invalid email format');
    });
  });

  describe('updateProfile', () => {
    it('should update username successfully', () => {
      const admin = new Admin(validAdminProps);
      const updateData: UpdateAdminData = { username: 'newusername' };
      const originalUpdatedAt = admin.updatedAt;

      admin.updateProfile(updateData);

      expect(admin.username).toBe('newusername');
      expect(admin.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should update role successfully', () => {
      const admin = new Admin(validAdminProps);
      const updateData: UpdateAdminData = { role: AdminRole.SUPER_ADMIN };

      admin.updateProfile(updateData);

      expect(admin.role).toBe(AdminRole.SUPER_ADMIN);
    });

    it('should throw error when updating inactive admin', () => {
      const props = { ...validAdminProps, isActive: false };
      const admin = new Admin(props);
      const updateData: UpdateAdminData = { username: 'newusername' };

      expect(() => admin.updateProfile(updateData)).toThrow('Cannot update profile of inactive admin');
    });

    it('should throw error for empty username', () => {
      const admin = new Admin(validAdminProps);
      const updateData: UpdateAdminData = { username: '' };

      expect(() => admin.updateProfile(updateData)).toThrow('Username cannot be empty');
    });

    it('should throw error for short username', () => {
      const admin = new Admin(validAdminProps);
      const updateData: UpdateAdminData = { username: 'ab' };

      expect(() => admin.updateProfile(updateData)).toThrow('Username must be at least 3 characters long');
    });

    it('should throw error for long username', () => {
      const admin = new Admin(validAdminProps);
      const updateData: UpdateAdminData = { username: 'a'.repeat(51) };

      expect(() => admin.updateProfile(updateData)).toThrow('Username cannot exceed 50 characters');
    });

    it('should throw error for invalid role', () => {
      const admin = new Admin(validAdminProps);
      const updateData: UpdateAdminData = { role: 'INVALID_ROLE' as AdminRole };

      expect(() => admin.updateProfile(updateData)).toThrow('Invalid admin role');
    });

    it('should trim whitespace from username', () => {
      const admin = new Admin(validAdminProps);
      const updateData: UpdateAdminData = { username: '  newusername  ' };

      admin.updateProfile(updateData);

      expect(admin.username).toBe('newusername');
    });
  });

  describe('deactivate', () => {
    it('should deactivate active admin', () => {
      const admin = new Admin(validAdminProps);
      const originalUpdatedAt = admin.updatedAt;

      admin.deactivate();

      expect(admin.isActive).toBe(false);
      expect(admin.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should throw error when deactivating inactive admin', () => {
      const props = { ...validAdminProps, isActive: false };
      const admin = new Admin(props);

      expect(() => admin.deactivate()).toThrow('Admin is already inactive');
    });
  });

  describe('activate', () => {
    it('should activate inactive admin', () => {
      const props = { ...validAdminProps, isActive: false };
      const admin = new Admin(props);
      const originalUpdatedAt = admin.updatedAt;

      admin.activate();

      expect(admin.isActive).toBe(true);
      expect(admin.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should throw error when activating active admin', () => {
      const admin = new Admin(validAdminProps);

      expect(() => admin.activate()).toThrow('Admin is already active');
    });
  });

  describe('updatePasswordHash', () => {
    it('should update password hash successfully', () => {
      const admin = new Admin(validAdminProps);
      const newPasswordHash = 'newHashedPassword123';
      const originalUpdatedAt = admin.updatedAt;

      admin.updatePasswordHash(newPasswordHash);

      expect(admin.passwordHash).toBe(newPasswordHash);
      expect(admin.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should throw error when updating password of inactive admin', () => {
      const props = { ...validAdminProps, isActive: false };
      const admin = new Admin(props);

      expect(() => admin.updatePasswordHash('newHash')).toThrow('Cannot update password of inactive admin');
    });

    it('should throw error for empty password hash', () => {
      const admin = new Admin(validAdminProps);

      expect(() => admin.updatePasswordHash('')).toThrow('Password hash is required');
    });
  });

  describe('role methods', () => {
    it('should check if admin has specific role', () => {
      const admin = new Admin(validAdminProps);

      expect(admin.hasRole(AdminRole.ADMIN)).toBe(true);
      expect(admin.hasRole(AdminRole.SUPER_ADMIN)).toBe(false);
    });

    it('should check if admin is super admin', () => {
      const regularAdmin = new Admin(validAdminProps);
      const superAdminProps = { ...validAdminProps, role: AdminRole.SUPER_ADMIN };
      const superAdmin = new Admin(superAdminProps);

      expect(regularAdmin.isSuperAdmin()).toBe(false);
      expect(superAdmin.isSuperAdmin()).toBe(true);
    });

    it('should check if admin can manage other admins', () => {
      const regularAdmin = new Admin(validAdminProps);
      const superAdminProps = { ...validAdminProps, role: AdminRole.SUPER_ADMIN };
      const superAdmin = new Admin(superAdminProps);

      expect(regularAdmin.canManageAdmins()).toBe(false);
      expect(superAdmin.canManageAdmins()).toBe(true);
    });
  });
});