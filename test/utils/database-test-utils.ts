import { PrismaClient } from '@prisma/client';
import { TestDataFactory, TestMemberData, TestAdminData, TestPointData, TestPrivilegeData } from './test-data-factory';

export class DatabaseTestUtils {
  constructor(private prisma: PrismaClient) {}

  /**
   * Clean all test data from the database
   */
  async cleanDatabase(): Promise<void> {
    // Delete in order to respect foreign key constraints
    await this.prisma.memberPrivilege.deleteMany();
    await this.prisma.point.deleteMany();
    await this.prisma.privilege.deleteMany();
    await this.prisma.member.deleteMany();
    await this.prisma.admin.deleteMany();
  }

  /**
   * Create a test member in the database
   */
  async createTestMember(data?: Partial<TestMemberData>) {
    const memberData = TestDataFactory.createMemberData(data);
    
    return await this.prisma.member.create({
      data: {
        email: memberData.email,
        username: memberData.username,
        passwordHash: memberData.password, // In real tests, this should be hashed
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        isActive: memberData.isActive ?? true,
      },
    });
  }

  /**
   * Create a test admin in the database
   */
  async createTestAdmin(data?: Partial<TestAdminData>) {
    const adminData = TestDataFactory.createAdminData(data);
    
    return await this.prisma.admin.create({
      data: {
        email: adminData.email,
        username: adminData.username,
        passwordHash: adminData.password, // In real tests, this should be hashed
        role: adminData.role ?? 'ADMIN',
        isActive: adminData.isActive ?? true,
      },
    });
  }

  /**
   * Create test points for a member
   */
  async createTestPoints(memberId: string, count: number = 1, data?: Partial<TestPointData>) {
    const pointsData = TestDataFactory.createMultiplePoints(memberId, count, data);
    
    const points = [];
    for (const pointData of pointsData) {
      const point = await this.prisma.point.create({
        data: {
          memberId: pointData.memberId,
          amount: pointData.amount,
          type: pointData.type,
          description: pointData.description,
          expiresAt: pointData.expiresAt,
          isExpired: pointData.isExpired ?? false,
        },
      });
      points.push(point);
    }
    
    return points;
  }

  /**
   * Create a test privilege in the database
   */
  async createTestPrivilege(data?: Partial<TestPrivilegeData>) {
    const privilegeData = TestDataFactory.createPrivilegeData(data);
    
    return await this.prisma.privilege.create({
      data: {
        name: privilegeData.name,
        description: privilegeData.description,
        pointCost: privilegeData.pointCost,
        isActive: privilegeData.isActive ?? true,
        validityDays: privilegeData.validityDays,
      },
    });
  }

  /**
   * Create a member privilege relationship
   */
  async createMemberPrivilege(memberId: string, privilegeId: string, expiresAt?: Date) {
    return await this.prisma.memberPrivilege.create({
      data: {
        memberId,
        privilegeId,
        expiresAt,
        isActive: true,
      },
    });
  }

  /**
   * Get member with their points
   */
  async getMemberWithPoints(memberId: string) {
    return await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        points: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Get member with their privileges
   */
  async getMemberWithPrivileges(memberId: string) {
    return await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberPrivileges: {
          include: {
            privilege: true,
          },
        },
      },
    });
  }

  /**
   * Calculate total available points for a member (excluding expired)
   */
  async calculateAvailablePoints(memberId: string): Promise<number> {
    const result = await this.prisma.point.aggregate({
      where: {
        memberId,
        isExpired: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount?.toNumber() || 0;
  }

  /**
   * Create a complete test scenario with member, points, and privileges
   */
  async createCompleteTestScenario() {
    // Create test member
    const member = await this.createTestMember();
    
    // Create test admin
    const admin = await this.createTestAdmin();
    
    // Create some points for the member
    const points = await this.createTestPoints(member.id, 3, {
      amount: 1000,
      type: 'EARNED',
    });
    
    // Create test privileges
    const privilege1 = await this.createTestPrivilege({
      name: 'Premium Access',
      pointCost: 500,
    });
    
    const privilege2 = await this.createTestPrivilege({
      name: 'VIP Status',
      pointCost: 1500,
    });
    
    return {
      member,
      admin,
      points,
      privileges: [privilege1, privilege2],
    };
  }

  /**
   * Execute a function within a database transaction that will be rolled back
   */
  async executeInTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      const result = await fn(tx);
      // Force rollback by throwing an error
      throw new Error('ROLLBACK_TRANSACTION');
    }).catch((error) => {
      if (error.message === 'ROLLBACK_TRANSACTION') {
        // This is expected, return undefined or handle as needed
        return undefined as T;
      }
      throw error;
    });
  }
}