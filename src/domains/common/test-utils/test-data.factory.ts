import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Member, Privilege, MemberPrivilege } from '@prisma/client';

export interface TestMemberOptions {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
}

export interface TestPrivilegeOptions {
    name?: string;
    description?: string;
    pointCost?: number;
    validityDays?: number;
    isActive?: boolean;
}

export interface TestMemberPrivilegeOptions {
    expiresAt?: Date;
    isActive?: boolean;
}

export interface TestMemberData {
    member: Member;
    points: any[];
    privileges: MemberPrivilege[];
}

export interface TestPrivilegeData {
    privilege: Privilege;
    memberPrivileges: MemberPrivilege[];
}

/**
 * Creates a test member with optional related data
 */
export async function createTestMemberWithRelations(
    prisma: PrismaService,
    options: TestMemberOptions = {}
): Promise<TestMemberData> {
    const memberData = {
        email: options.email || `test-${Date.now()}@example.com`,
        username: options.username || `testuser-${Date.now()}`,
        passwordHash: 'hashedpassword',
        firstName: options.firstName || 'Test',
        lastName: options.lastName || 'User',
        isActive: options.isActive ?? true,
    };

    const member = await prisma.member.create({
        data: memberData,
    });

    return {
        member,
        points: [],
        privileges: [],
    };
}

/**
 * Creates a test privilege with optional related data
 */
export async function createTestPrivilegeWithRelations(
    prisma: PrismaService,
    options: TestPrivilegeOptions = {}
): Promise<TestPrivilegeData> {
    const privilegeData = {
        name: options.name || `Test Privilege ${Date.now()}`,
        description: options.description || 'A test privilege',
        pointCost: options.pointCost || 100,
        validityDays: options.validityDays || 30,
        isActive: options.isActive ?? true,
    };

    const privilege = await prisma.privilege.create({
        data: privilegeData,
    });

    return {
        privilege,
        memberPrivileges: [],
    };
}

/**
 * Creates a member privilege relationship with proper foreign key constraints
 */
export async function createTestMemberPrivilege(
    prisma: PrismaService,
    memberId: string,
    privilegeId: string,
    options: TestMemberPrivilegeOptions = {}
): Promise<MemberPrivilege> {
    const memberPrivilegeData = {
        memberId,
        privilegeId,
        expiresAt: options.expiresAt,
        isActive: options.isActive ?? true,
    };

    return prisma.memberPrivilege.create({
        data: memberPrivilegeData,
    });
}

/**
 * Creates a complete test scenario with member, privilege, and their relationship
 */
export async function createTestMemberPrivilegeScenario(
    prisma: PrismaService,
    memberOptions: TestMemberOptions = {},
    privilegeOptions: TestPrivilegeOptions = {},
    relationOptions: TestMemberPrivilegeOptions = {}
): Promise<{
    member: Member;
    privilege: Privilege;
    memberPrivilege: MemberPrivilege;
}> {
    const memberData = await createTestMemberWithRelations(prisma, memberOptions);
    const privilegeData = await createTestPrivilegeWithRelations(prisma, privilegeOptions);

    const memberPrivilege = await createTestMemberPrivilege(
        prisma,
        memberData.member.id,
        privilegeData.privilege.id,
        relationOptions
    );

    return {
        member: memberData.member,
        privilege: privilegeData.privilege,
        memberPrivilege,
    };
}

/**
 * Creates multiple test privileges with different configurations for testing filtering
 */
export async function createTestPrivilegeSet(
    prisma: PrismaService
): Promise<Privilege[]> {
    const privileges = await Promise.all([
        createTestPrivilegeWithRelations(prisma, {
            name: 'Premium Access',
            pointCost: 100,
            isActive: true,
        }),
        createTestPrivilegeWithRelations(prisma, {
            name: 'VIP Status',
            pointCost: 200,
            isActive: true,
        }),
        createTestPrivilegeWithRelations(prisma, {
            name: 'Inactive Privilege',
            pointCost: 50,
            isActive: false,
        }),
    ]);

    return privileges.map(p => p.privilege);
}

/**
 * Creates test data for expiring privileges scenario
 */
export async function createExpiringPrivilegesScenario(
    prisma: PrismaService
): Promise<{
    member: Member;
    privileges: Privilege[];
    memberPrivileges: MemberPrivilege[];
}> {
    const memberData = await createTestMemberWithRelations(prisma);

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const privileges = await Promise.all([
        createTestPrivilegeWithRelations(prisma, { name: 'Tomorrow Privilege' }),
        createTestPrivilegeWithRelations(prisma, { name: 'Week Privilege' }),
        createTestPrivilegeWithRelations(prisma, { name: 'Month Privilege' }),
    ]);

    const memberPrivileges = await Promise.all([
        createTestMemberPrivilege(prisma, memberData.member.id, privileges[0].privilege.id, {
            expiresAt: tomorrow,
        }),
        createTestMemberPrivilege(prisma, memberData.member.id, privileges[1].privilege.id, {
            expiresAt: nextWeek,
        }),
        createTestMemberPrivilege(prisma, memberData.member.id, privileges[2].privilege.id, {
            expiresAt: nextMonth,
        }),
    ]);

    return {
        member: memberData.member,
        privileges: privileges.map(p => p.privilege),
        memberPrivileges,
    };
}