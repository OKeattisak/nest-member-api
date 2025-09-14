import { faker } from '@faker-js/faker';
import { AdminRole } from '@prisma/client';

export interface TestMemberData {
  id?: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
}

export interface TestAdminData {
  id?: string;
  email: string;
  username: string;
  password: string;
  role?: AdminRole;
  isActive?: boolean;
}

export interface TestPointData {
  id?: string;
  memberId: string;
  amount: number;
  type: 'EARNED' | 'DEDUCTED' | 'EXPIRED' | 'EXCHANGED';
  description: string;
  expiresAt?: Date;
  isExpired?: boolean;
}

export interface TestPrivilegeData {
  id?: string;
  name: string;
  description: string;
  pointCost: number;
  isActive?: boolean;
  validityDays?: number;
}

export class TestDataFactory {
  static createMemberData(overrides: Partial<TestMemberData> = {}): TestMemberData {
    return {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'TestPassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      isActive: true,
      ...overrides,
    };
  }

  static createAdminData(overrides: Partial<TestAdminData> = {}): TestAdminData {
    return {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'AdminPassword123!',
      role: AdminRole.ADMIN,
      isActive: true,
      ...overrides,
    };
  }

  static createPointData(memberId: string, overrides: Partial<TestPointData> = {}): TestPointData {
    return {
      memberId,
      amount: faker.number.int({ min: 10, max: 1000 }),
      type: 'EARNED',
      description: faker.lorem.sentence(),
      expiresAt: faker.date.future(),
      isExpired: false,
      ...overrides,
    };
  }

  static createPrivilegeData(overrides: Partial<TestPrivilegeData> = {}): TestPrivilegeData {
    return {
      name: faker.commerce.productName(),
      description: faker.lorem.paragraph(),
      pointCost: faker.number.int({ min: 100, max: 5000 }),
      isActive: true,
      validityDays: faker.number.int({ min: 30, max: 365 }),
      ...overrides,
    };
  }

  static createMultipleMembers(count: number, overrides: Partial<TestMemberData> = {}): TestMemberData[] {
    return Array.from({ length: count }, () => this.createMemberData(overrides));
  }

  static createMultiplePoints(memberId: string, count: number, overrides: Partial<TestPointData> = {}): TestPointData[] {
    return Array.from({ length: count }, () => this.createPointData(memberId, overrides));
  }

  static createMultiplePrivileges(count: number, overrides: Partial<TestPrivilegeData> = {}): TestPrivilegeData[] {
    return Array.from({ length: count }, () => this.createPrivilegeData(overrides));
  }

  // Helper methods for specific test scenarios
  static createExpiredPoints(memberId: string, count: number): TestPointData[] {
    return this.createMultiplePoints(memberId, count, {
      type: 'EARNED',
      expiresAt: faker.date.past(),
      isExpired: true,
    });
  }

  static createActivePoints(memberId: string, count: number): TestPointData[] {
    return this.createMultiplePoints(memberId, count, {
      type: 'EARNED',
      expiresAt: faker.date.future(),
      isExpired: false,
    });
  }

  static createInactiveMembers(count: number): TestMemberData[] {
    return this.createMultipleMembers(count, { isActive: false });
  }

  static createSuperAdmin(): TestAdminData {
    return this.createAdminData({ role: AdminRole.SUPER_ADMIN });
  }
}