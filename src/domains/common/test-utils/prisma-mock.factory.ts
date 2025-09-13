import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Type-safe mock factory for Prisma client methods
 * Provides Jest-compatible mocks for all Prisma operations
 */

// Define mock types for each Prisma model delegate
export interface MockMemberDelegate {
  findUnique: jest.MockedFunction<any>;
  findFirst: jest.MockedFunction<any>;
  findMany: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  upsert: jest.MockedFunction<any>;
  count: jest.MockedFunction<any>;
  aggregate: jest.MockedFunction<any>;
  groupBy: jest.MockedFunction<any>;
  updateMany: jest.MockedFunction<any>;
  deleteMany: jest.MockedFunction<any>;
}

export interface MockPointDelegate {
  findUnique: jest.MockedFunction<any>;
  findFirst: jest.MockedFunction<any>;
  findMany: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  createMany: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  upsert: jest.MockedFunction<any>;
  count: jest.MockedFunction<any>;
  aggregate: jest.MockedFunction<any>;
  groupBy: jest.MockedFunction<any>;
  updateMany: jest.MockedFunction<any>;
  deleteMany: jest.MockedFunction<any>;
}

export interface MockPrivilegeDelegate {
  findUnique: jest.MockedFunction<any>;
  findFirst: jest.MockedFunction<any>;
  findMany: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  upsert: jest.MockedFunction<any>;
  count: jest.MockedFunction<any>;
  aggregate: jest.MockedFunction<any>;
  groupBy: jest.MockedFunction<any>;
  updateMany: jest.MockedFunction<any>;
  deleteMany: jest.MockedFunction<any>;
}

export interface MockMemberPrivilegeDelegate {
  findUnique: jest.MockedFunction<any>;
  findFirst: jest.MockedFunction<any>;
  findMany: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  upsert: jest.MockedFunction<any>;
  count: jest.MockedFunction<any>;
  aggregate: jest.MockedFunction<any>;
  groupBy: jest.MockedFunction<any>;
  updateMany: jest.MockedFunction<any>;
  deleteMany: jest.MockedFunction<any>;
}

export interface MockAdminDelegate {
  findUnique: jest.MockedFunction<any>;
  findFirst: jest.MockedFunction<any>;
  findMany: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  upsert: jest.MockedFunction<any>;
  count: jest.MockedFunction<any>;
  aggregate: jest.MockedFunction<any>;
  groupBy: jest.MockedFunction<any>;
  updateMany: jest.MockedFunction<any>;
  deleteMany: jest.MockedFunction<any>;
}

// Complete mock type for PrismaService
export interface MockPrismaService {
  member: MockMemberDelegate;
  point: MockPointDelegate;
  privilege: MockPrivilegeDelegate;
  memberPrivilege: MockMemberPrivilegeDelegate;
  admin: MockAdminDelegate;
  $connect: jest.MockedFunction<any>;
  $disconnect: jest.MockedFunction<any>;
  $transaction: jest.MockedFunction<any>;
  $executeRaw: jest.MockedFunction<any>;
  $queryRaw: jest.MockedFunction<any>;
}

/**
 * Creates a mock delegate with all common Prisma methods
 */
function createMockDelegate(): any {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };
}

/**
 * Factory class for creating type-safe Prisma mocks
 */
export class PrismaMockFactory {
  /**
   * Creates a complete mock PrismaService with all model delegates
   */
  static createMockPrismaService(): MockPrismaService {
    return {
      member: createMockDelegate(),
      point: createMockDelegate(),
      privilege: createMockDelegate(),
      memberPrivilege: createMockDelegate(),
      admin: createMockDelegate(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(),
    };
  }

  /**
   * Creates a mock for a specific model delegate
   */
  static createMockDelegate(): any {
    return createMockDelegate();
  }

  /**
   * Helper method to mock a method with a resolved value
   */
  static mockResolvedValue<T>(mockFn: jest.MockedFunction<any>, value: T): void {
    mockFn.mockResolvedValue(value);
  }

  /**
   * Helper method to mock a method with a rejected value
   */
  static mockRejectedValue(mockFn: jest.MockedFunction<any>, error: any): void {
    mockFn.mockRejectedValue(error);
  }

  /**
   * Helper method to mock a method with an implementation
   */
  static mockImplementation(mockFn: jest.MockedFunction<any>, implementation: (...args: any[]) => any): void {
    mockFn.mockImplementation(implementation);
  }

  /**
   * Helper method to reset all mocks in a PrismaService mock
   */
  static resetAllMocks(mockPrismaService: MockPrismaService): void {
    // Reset model delegate mocks
    Object.values(mockPrismaService.member).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });

    Object.values(mockPrismaService.point).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });

    Object.values(mockPrismaService.privilege).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });

    Object.values(mockPrismaService.memberPrivilege).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });

    Object.values(mockPrismaService.admin).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });

    // Reset service-level mocks
    mockPrismaService.$connect.mockReset();
    mockPrismaService.$disconnect.mockReset();
    mockPrismaService.$transaction.mockReset();
    mockPrismaService.$executeRaw.mockReset();
    mockPrismaService.$queryRaw.mockReset();
  }

  /**
   * Helper method to clear all mock calls and instances
   */
  static clearAllMocks(mockPrismaService: MockPrismaService): void {
    // Clear model delegate mocks
    Object.values(mockPrismaService.member).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });

    Object.values(mockPrismaService.point).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });

    Object.values(mockPrismaService.privilege).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });

    Object.values(mockPrismaService.memberPrivilege).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });

    Object.values(mockPrismaService.admin).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });

    // Clear service-level mocks
    mockPrismaService.$connect.mockClear();
    mockPrismaService.$disconnect.mockClear();
    mockPrismaService.$transaction.mockClear();
    mockPrismaService.$executeRaw.mockClear();
    mockPrismaService.$queryRaw.mockClear();
  }
}

/**
 * Convenience function to create a mock PrismaService
 * This is the main function that should be used in tests
 */
export function createMockPrismaService(): MockPrismaService {
  return PrismaMockFactory.createMockPrismaService();
}

/**
 * Type guard to check if a value is a MockPrismaService
 */
export function isMockPrismaService(value: any): value is MockPrismaService {
  return value && 
         typeof value === 'object' &&
         value.member &&
         value.point &&
         value.privilege &&
         value.memberPrivilege &&
         value.admin;
}