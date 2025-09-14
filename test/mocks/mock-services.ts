import { TestDataFactory } from '../utils/test-data-factory';

export const mockMemberService = {
  registerMember: jest.fn(),
  authenticateMember: jest.fn(),
  getMemberById: jest.fn(),
  updateMemberProfile: jest.fn(),
  deactivateMember: jest.fn(),
  softDeleteMember: jest.fn(),
  getMemberByEmail: jest.fn(),
  getMemberByUsername: jest.fn(),
};

export const mockAdminService = {
  authenticateAdmin: jest.fn(),
  createAdmin: jest.fn(),
  getAdminById: jest.fn(),
  updateAdmin: jest.fn(),
  deactivateAdmin: jest.fn(),
};

export const mockPointService = {
  addPoints: jest.fn(),
  deductPoints: jest.fn(),
  getPointHistory: jest.fn(),
  getAvailableBalance: jest.fn(),
  processExpiredPoints: jest.fn(),
  calculatePointBalance: jest.fn(),
};

export const mockPrivilegeService = {
  createPrivilege: jest.fn(),
  updatePrivilege: jest.fn(),
  deletePrivilege: jest.fn(),
  getPrivilegeById: jest.fn(),
  getAllPrivileges: jest.fn(),
  exchangePrivilege: jest.fn(),
  getMemberPrivileges: jest.fn(),
  revokePrivilege: jest.fn(),
};

export const mockJwtService = {
  generateAdminToken: jest.fn(),
  generateMemberToken: jest.fn(),
  verifyAdminToken: jest.fn(),
  verifyMemberToken: jest.fn(),
};

export const mockPasswordService = {
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
};

export const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logSystemStartup: jest.fn(),
  logDatabaseQuery: jest.fn(),
  logApiRequest: jest.fn(),
  logApiResponse: jest.fn(),
};

// Mock implementations with realistic return values
export const mockServiceImplementations = {
  memberService: {
    registerMember: jest.fn().mockImplementation(async (data) => ({
      id: 'test-member-id',
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    
    authenticateMember: jest.fn().mockImplementation(async ({ emailOrUsername, password }) => ({
      isAuthenticated: true,
      member: {
        id: 'test-member-id',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })),
    
    getMemberById: jest.fn().mockImplementation(async (id) => ({
      id,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  },

  adminService: {
    authenticateAdmin: jest.fn().mockImplementation(async ({ emailOrUsername, password }) => ({
      isAuthenticated: true,
      admin: {
        id: 'test-admin-id',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })),
  },

  pointService: {
    addPoints: jest.fn().mockResolvedValue(undefined),
    deductPoints: jest.fn().mockResolvedValue(undefined),
    getAvailableBalance: jest.fn().mockResolvedValue(1000),
    getPointHistory: jest.fn().mockImplementation(async (memberId, pagination) => ({
      data: [
        {
          id: 'point-1',
          memberId,
          amount: 100,
          type: 'EARNED',
          description: 'Test points',
          createdAt: new Date(),
        },
      ],
      meta: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    })),
  },

  privilegeService: {
    getAllPrivileges: jest.fn().mockResolvedValue([
      {
        id: 'privilege-1',
        name: 'Premium Access',
        description: 'Premium access privilege',
        pointCost: 500,
        isActive: true,
        validityDays: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    
    exchangePrivilege: jest.fn().mockResolvedValue({
      id: 'member-privilege-1',
      memberId: 'test-member-id',
      privilegeId: 'privilege-1',
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    }),
  },

  jwtService: {
    generateAdminToken: jest.fn().mockResolvedValue({
      accessToken: 'mock-admin-jwt-token',
      refreshToken: 'mock-admin-refresh-token',
    }),
    
    generateMemberToken: jest.fn().mockResolvedValue({
      accessToken: 'mock-member-jwt-token',
      refreshToken: 'mock-member-refresh-token',
    }),
  },
};

// Helper function to reset all mocks
export function resetAllMocks() {
  Object.values(mockMemberService).forEach(mock => mock.mockReset());
  Object.values(mockAdminService).forEach(mock => mock.mockReset());
  Object.values(mockPointService).forEach(mock => mock.mockReset());
  Object.values(mockPrivilegeService).forEach(mock => mock.mockReset());
  Object.values(mockJwtService).forEach(mock => mock.mockReset());
  Object.values(mockPasswordService).forEach(mock => mock.mockReset());
  Object.values(mockLoggerService).forEach(mock => mock.mockReset());
  
  // Reset implementations
  Object.values(mockServiceImplementations.memberService).forEach(mock => mock.mockReset());
  Object.values(mockServiceImplementations.adminService).forEach(mock => mock.mockReset());
  Object.values(mockServiceImplementations.pointService).forEach(mock => mock.mockReset());
  Object.values(mockServiceImplementations.privilegeService).forEach(mock => mock.mockReset());
  Object.values(mockServiceImplementations.jwtService).forEach(mock => mock.mockReset());
}