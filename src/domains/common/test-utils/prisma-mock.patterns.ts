import { MockPrismaService, PrismaMockFactory } from './prisma-mock.factory';
import { Member, Point, Privilege, MemberPrivilege, Admin, PointType, AdminRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Common mock patterns for Prisma operations
 * Provides reusable mock setups for typical database operations
 */

export interface MockMemberData {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockPointData {
  id: string;
  memberId: string;
  amount: Decimal;
  type: PointType;
  description: string;
  expiresAt: Date | null;
  isExpired: boolean;
  createdAt: Date;
}

export interface MockPrivilegeData {
  id: string;
  name: string;
  description: string;
  pointCost: Decimal;
  isActive: boolean;
  validityDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMemberPrivilegeData {
  id: string;
  memberId: string;
  privilegeId: string;
  grantedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface MockAdminData {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock patterns for common database operations
 */
export class PrismaMockPatterns {
  /**
   * Creates a mock member with default values
   */
  static createMockMember(overrides: Partial<MockMemberData> = {}): MockMemberData {
    return {
      id: 'member-id-1',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed-password',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      deletedAt: null,
      ...overrides,
    };
  }

  /**
   * Creates a mock point with default values
   */
  static createMockPoint(overrides: Partial<MockPointData> = {}): MockPointData {
    return {
      id: 'point-id-1',
      memberId: 'member-id-1',
      amount: new Decimal(100),
      type: PointType.EARNED,
      description: 'Test points',
      expiresAt: null,
      isExpired: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Creates a mock privilege with default values
   */
  static createMockPrivilege(overrides: Partial<MockPrivilegeData> = {}): MockPrivilegeData {
    return {
      id: 'privilege-id-1',
      name: 'Test Privilege',
      description: 'Test privilege description',
      pointCost: new Decimal(50),
      isActive: true,
      validityDays: 30,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Creates a mock member privilege with default values
   */
  static createMockMemberPrivilege(overrides: Partial<MockMemberPrivilegeData> = {}): MockMemberPrivilegeData {
    return {
      id: 'member-privilege-id-1',
      memberId: 'member-id-1',
      privilegeId: 'privilege-id-1',
      grantedAt: new Date('2024-01-01T00:00:00Z'),
      expiresAt: new Date('2024-02-01T00:00:00Z'),
      isActive: true,
      ...overrides,
    };
  }

  /**
   * Creates a mock admin with default values
   */
  static createMockAdmin(overrides: Partial<MockAdminData> = {}): MockAdminData {
    return {
      id: 'admin-id-1',
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: 'hashed-admin-password',
      role: AdminRole.ADMIN,
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Sets up a successful findUnique mock for any model
   */
  static mockFindUnique<T>(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, result: T | null): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate.findUnique) {
        PrismaMockFactory.mockResolvedValue(delegate.findUnique, result);
      }
    }
  }

  /**
   * Sets up a successful findMany mock for any model
   */
  static mockFindMany<T>(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, results: T[]): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate.findMany) {
        PrismaMockFactory.mockResolvedValue(delegate.findMany, results);
      }
    }
  }

  /**
   * Sets up a successful create mock for any model
   */
  static mockCreate<T>(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, result: T): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate.create) {
        PrismaMockFactory.mockResolvedValue(delegate.create, result);
      }
    }
  }

  /**
   * Sets up a successful update mock for any model
   */
  static mockUpdate<T>(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, result: T): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate.update) {
        PrismaMockFactory.mockResolvedValue(delegate.update, result);
      }
    }
  }

  /**
   * Sets up a successful delete mock for any model
   */
  static mockDelete<T>(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, result: T): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate.delete) {
        PrismaMockFactory.mockResolvedValue(delegate.delete, result);
      }
    }
  }

  /**
   * Sets up a successful count mock for any model
   */
  static mockCount(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, count: number): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate.count) {
        PrismaMockFactory.mockResolvedValue(delegate.count, count);
      }
    }
  }

  /**
   * Sets up a successful aggregate mock for any model
   */
  static mockAggregate<T>(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, result: T): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate.aggregate) {
        PrismaMockFactory.mockResolvedValue(delegate.aggregate, result);
      }
    }
  }

  /**
   * Sets up common member repository mocks for CRUD operations
   */
  static setupMemberCrudMocks(mockPrismaService: MockPrismaService): {
    mockMember: MockMemberData;
    mockMembers: MockMemberData[];
  } {
    const mockMember = this.createMockMember();
    const mockMembers = [mockMember];

    this.mockFindUnique(mockPrismaService, 'member', mockMember);
    this.mockFindMany(mockPrismaService, 'member', mockMembers);
    this.mockCreate(mockPrismaService, 'member', mockMember);
    this.mockUpdate(mockPrismaService, 'member', mockMember);
    this.mockDelete(mockPrismaService, 'member', mockMember);
    this.mockCount(mockPrismaService, 'member', 1);

    return { mockMember, mockMembers };
  }

  /**
   * Sets up common point repository mocks for CRUD operations
   */
  static setupPointCrudMocks(mockPrismaService: MockPrismaService): {
    mockPoint: MockPointData;
    mockPoints: MockPointData[];
  } {
    const mockPoint = this.createMockPoint();
    const mockPoints = [mockPoint];

    this.mockFindUnique(mockPrismaService, 'point', mockPoint);
    this.mockFindMany(mockPrismaService, 'point', mockPoints);
    this.mockCreate(mockPrismaService, 'point', mockPoint);
    this.mockUpdate(mockPrismaService, 'point', mockPoint);
    this.mockDelete(mockPrismaService, 'point', mockPoint);
    this.mockCount(mockPrismaService, 'point', 1);

    return { mockPoint, mockPoints };
  }

  /**
   * Sets up common privilege repository mocks for CRUD operations
   */
  static setupPrivilegeCrudMocks(mockPrismaService: MockPrismaService): {
    mockPrivilege: MockPrivilegeData;
    mockPrivileges: MockPrivilegeData[];
  } {
    const mockPrivilege = this.createMockPrivilege();
    const mockPrivileges = [mockPrivilege];

    this.mockFindUnique(mockPrismaService, 'privilege', mockPrivilege);
    this.mockFindMany(mockPrismaService, 'privilege', mockPrivileges);
    this.mockCreate(mockPrismaService, 'privilege', mockPrivilege);
    this.mockUpdate(mockPrismaService, 'privilege', mockPrivilege);
    this.mockDelete(mockPrismaService, 'privilege', mockPrivilege);
    this.mockCount(mockPrismaService, 'privilege', 1);

    return { mockPrivilege, mockPrivileges };
  }

  /**
   * Sets up common member privilege repository mocks for CRUD operations
   */
  static setupMemberPrivilegeCrudMocks(mockPrismaService: MockPrismaService): {
    mockMemberPrivilege: MockMemberPrivilegeData;
    mockMemberPrivileges: MockMemberPrivilegeData[];
  } {
    const mockMemberPrivilege = this.createMockMemberPrivilege();
    const mockMemberPrivileges = [mockMemberPrivilege];

    this.mockFindUnique(mockPrismaService, 'memberPrivilege', mockMemberPrivilege);
    this.mockFindMany(mockPrismaService, 'memberPrivilege', mockMemberPrivileges);
    this.mockCreate(mockPrismaService, 'memberPrivilege', mockMemberPrivilege);
    this.mockUpdate(mockPrismaService, 'memberPrivilege', mockMemberPrivilege);
    this.mockDelete(mockPrismaService, 'memberPrivilege', mockMemberPrivilege);
    this.mockCount(mockPrismaService, 'memberPrivilege', 1);

    return { mockMemberPrivilege, mockMemberPrivileges };
  }

  /**
   * Sets up error mocks for testing error scenarios
   */
  static mockError(mockPrismaService: MockPrismaService, model: keyof MockPrismaService, method: string, error: any): void {
    if (model in mockPrismaService && typeof mockPrismaService[model] === 'object') {
      const delegate = mockPrismaService[model] as any;
      if (delegate[method]) {
        PrismaMockFactory.mockRejectedValue(delegate[method], error);
      }
    }
  }

  /**
   * Resets all mocks to their initial state
   */
  static resetAllMocks(mockPrismaService: MockPrismaService): void {
    PrismaMockFactory.resetAllMocks(mockPrismaService);
  }

  /**
   * Clears all mock call history
   */
  static clearAllMocks(mockPrismaService: MockPrismaService): void {
    PrismaMockFactory.clearAllMocks(mockPrismaService);
  }
}