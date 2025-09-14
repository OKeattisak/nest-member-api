import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestSetup, TestContext } from './utils/test-setup';
import { TestDataFactory } from './utils/test-data-factory';

describe('Complete Admin Workflow (e2e)', () => {
  let context: TestContext;
  let adminToken: string;
  let testAdmin: any;

  beforeAll(async () => {
    context = await TestSetup.createTestingApp();
  });

  afterAll(async () => {
    await TestSetup.cleanupTestingApp(context);
  });

  beforeEach(async () => {
    await context.dbUtils.cleanDatabase();
    
    // Create test admin
    const adminData = TestDataFactory.createAdminData();
    testAdmin = await context.dbUtils.createTestAdmin(adminData);
    adminToken = await TestSetup.generateAdminToken(context.jwtService, testAdmin.id, testAdmin.role);
  });

  describe('Complete Admin Management Workflow', () => {
    it('should complete full admin workflow: member management, point operations, and privilege setup', async () => {
      // Step 1: Admin creates a new member
      const memberData = TestDataFactory.createMemberData();
      const createMemberResponse = await request(context.app.getHttpServer())
        .post('/admin/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: memberData.email,
          username: memberData.username,
          password: memberData.password,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
        })
        .expect(201);

      expect(createMemberResponse.body.success).toBe(true);
      const createdMember = createMemberResponse.body.data;

      // Step 2: Admin views all members
      const membersListResponse = await request(context.app.getHttpServer())
        .get('/admin/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(membersListResponse.body.success).toBe(true);
      expect(membersListResponse.body.data).toContainEqual(
        expect.objectContaining({
          id: createdMember.id,
          email: createdMember.email,
        })
      );

      // Step 3: Admin adds points to the member
      const addPointsResponse = await request(context.app.getHttpServer())
        .post('/admin/points/add')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: createdMember.id,
          amount: 1000,
          description: 'Welcome bonus points',
          expirationDays: 365,
        })
        .expect(201);

      expect(addPointsResponse.body.success).toBe(true);

      // Step 4: Admin creates a privilege
      const privilegeData = TestDataFactory.createPrivilegeData();
      const createPrivilegeResponse = await request(context.app.getHttpServer())
        .post('/admin/privileges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: privilegeData.name,
          description: privilegeData.description,
          pointCost: 500,
          validityDays: 30,
        })
        .expect(201);

      expect(createPrivilegeResponse.body.success).toBe(true);
      const createdPrivilege = createPrivilegeResponse.body.data;

      // Step 5: Admin views member's point balance
      const memberPointsResponse = await request(context.app.getHttpServer())
        .get(`/admin/members/${createdMember.id}/points`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(memberPointsResponse.body.success).toBe(true);
      expect(memberPointsResponse.body.data.availableBalance).toBe(1000);

      // Step 6: Admin manually grants privilege to member
      const grantPrivilegeResponse = await request(context.app.getHttpServer())
        .post('/admin/privileges/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: createdMember.id,
          privilegeId: createdPrivilege.id,
          validityDays: 30,
        })
        .expect(201);

      expect(grantPrivilegeResponse.body.success).toBe(true);

      // Step 7: Admin views member's privileges
      const memberPrivilegesResponse = await request(context.app.getHttpServer())
        .get(`/admin/members/${createdMember.id}/privileges`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(memberPrivilegesResponse.body.success).toBe(true);
      expect(memberPrivilegesResponse.body.data).toContainEqual(
        expect.objectContaining({
          privilegeId: createdPrivilege.id,
          isActive: true,
        })
      );

      // Step 8: Admin deducts points from member
      const deductPointsResponse = await request(context.app.getHttpServer())
        .post('/admin/points/deduct')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: createdMember.id,
          amount: 200,
          description: 'Administrative adjustment',
        })
        .expect(200);

      expect(deductPointsResponse.body.success).toBe(true);

      // Step 9: Admin views updated member details
      const memberDetailsResponse = await request(context.app.getHttpServer())
        .get(`/admin/members/${createdMember.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(memberDetailsResponse.body.success).toBe(true);
      expect(memberDetailsResponse.body.data.id).toBe(createdMember.id);

      // Step 10: Admin views point transaction history
      const pointHistoryResponse = await request(context.app.getHttpServer())
        .get(`/admin/members/${createdMember.id}/points/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(pointHistoryResponse.body.success).toBe(true);
      expect(pointHistoryResponse.body.data.length).toBeGreaterThan(0);

      // Verify we have both addition and deduction transactions
      const transactions = pointHistoryResponse.body.data;
      const additionTransaction = transactions.find((t: any) => t.type === 'EARNED' && t.amount === 1000);
      const deductionTransaction = transactions.find((t: any) => t.type === 'DEDUCTED' && t.amount === -200);

      expect(additionTransaction).toBeDefined();
      expect(deductionTransaction).toBeDefined();

      // Step 11: Admin updates member information
      const updateMemberResponse = await request(context.app.getHttpServer())
        .put(`/admin/members/${createdMember.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated First Name',
          lastName: 'Updated Last Name',
        })
        .expect(200);

      expect(updateMemberResponse.body.success).toBe(true);
      expect(updateMemberResponse.body.data.firstName).toBe('Updated First Name');

      // Step 12: Admin updates privilege information
      const updatePrivilegeResponse = await request(context.app.getHttpServer())
        .put(`/admin/privileges/${createdPrivilege.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Privilege Name',
          pointCost: 600,
          description: 'Updated privilege description',
        })
        .expect(200);

      expect(updatePrivilegeResponse.body.success).toBe(true);
      expect(updatePrivilegeResponse.body.data.name).toBe('Updated Privilege Name');
      expect(updatePrivilegeResponse.body.data.pointCost).toBe(600);
    });

    it('should handle bulk operations efficiently', async () => {
      // Create multiple members
      const memberPromises = Array.from({ length: 5 }, async (_, index) => {
        const memberData = TestDataFactory.createMemberData({
          email: `member${index}@example.com`,
          username: `member${index}`,
        });

        return await request(context.app.getHttpServer())
          .post('/admin/members')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: memberData.email,
            username: memberData.username,
            password: memberData.password,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
          })
          .expect(201);
      });

      const memberResponses = await Promise.all(memberPromises);
      const createdMembers = memberResponses.map(response => response.body.data);

      // Bulk add points to all members
      const bulkPointsPromises = createdMembers.map(member =>
        request(context.app.getHttpServer())
          .post('/admin/points/add')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberId: member.id,
            amount: 500,
            description: 'Bulk point addition',
          })
          .expect(201)
      );

      const bulkPointsResponses = await Promise.all(bulkPointsPromises);
      bulkPointsResponses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Verify all members have points
      const balancePromises = createdMembers.map(member =>
        request(context.app.getHttpServer())
          .get(`/admin/members/${member.id}/points`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
      );

      const balanceResponses = await Promise.all(balancePromises);
      balanceResponses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.availableBalance).toBe(500);
      });

      // Test pagination with all created members
      const paginatedResponse = await request(context.app.getHttpServer())
        .get('/admin/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(paginatedResponse.body.success).toBe(true);
      expect(paginatedResponse.body.data.length).toBe(3);
      expect(paginatedResponse.body.meta.pagination.total).toBe(5);
      expect(paginatedResponse.body.meta.pagination.totalPages).toBe(2);
      expect(paginatedResponse.body.meta.pagination.hasNext).toBe(true);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test member not found
      const nonExistentMemberResponse = await request(context.app.getHttpServer())
        .get('/admin/members/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(nonExistentMemberResponse.body.success).toBe(false);

      // Test adding points to non-existent member
      const addPointsToNonExistentResponse = await request(context.app.getHttpServer())
        .post('/admin/points/add')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: 'non-existent-member-id',
          amount: 100,
          description: 'Test points',
        })
        .expect(404);

      expect(addPointsToNonExistentResponse.body.success).toBe(false);

      // Test privilege not found
      const nonExistentPrivilegeResponse = await request(context.app.getHttpServer())
        .get('/admin/privileges/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(nonExistentPrivilegeResponse.body.success).toBe(false);

      // Test unauthorized access (no token)
      const unauthorizedResponse = await request(context.app.getHttpServer())
        .get('/admin/members')
        .expect(401);

      expect(unauthorizedResponse.body.success).toBe(false);
    });

    it('should maintain data consistency across operations', async () => {
      // Create member
      const memberData = TestDataFactory.createMemberData();
      const member = await context.dbUtils.createTestMember(memberData);

      // Add points
      await request(context.app.getHttpServer())
        .post('/admin/points/add')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: member.id,
          amount: 1000,
          description: 'Initial points',
        })
        .expect(201);

      // Create privilege
      const privilege = await context.dbUtils.createTestPrivilege({
        pointCost: 300,
      });

      // Grant privilege (should deduct points)
      await request(context.app.getHttpServer())
        .post('/admin/privileges/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: member.id,
          privilegeId: privilege.id,
          deductPoints: true,
        })
        .expect(201);

      // Verify point balance is correct
      const balanceResponse = await request(context.app.getHttpServer())
        .get(`/admin/members/${member.id}/points`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(balanceResponse.body.data.availableBalance).toBe(700); // 1000 - 300

      // Verify privilege was granted
      const privilegesResponse = await request(context.app.getHttpServer())
        .get(`/admin/members/${member.id}/privileges`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(privilegesResponse.body.data).toContainEqual(
        expect.objectContaining({
          privilegeId: privilege.id,
          isActive: true,
        })
      );

      // Verify transaction history shows both operations
      const historyResponse = await request(context.app.getHttpServer())
        .get(`/admin/members/${member.id}/points/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const transactions = historyResponse.body.data;
      expect(transactions).toContainEqual(
        expect.objectContaining({
          type: 'EARNED',
          amount: 1000,
        })
      );
      expect(transactions).toContainEqual(
        expect.objectContaining({
          type: 'EXCHANGED',
          amount: -300,
        })
      );
    });
  });

  describe('Admin Dashboard Analytics', () => {
    beforeEach(async () => {
      // Create test data for analytics
      const scenario = await context.dbUtils.createCompleteTestScenario();
    });

    it('should provide system overview statistics', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/admin/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalMembers: expect.any(Number),
          activeMembers: expect.any(Number),
          totalPointsIssued: expect.any(Number),
          totalPrivilegesExchanged: expect.any(Number),
          totalPrivileges: expect.any(Number),
          activePrivileges: expect.any(Number),
        },
      });
    });

    it('should provide member activity analytics', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/admin/analytics/member-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          newRegistrations: expect.any(Number),
          activeUsers: expect.any(Number),
          pointTransactions: expect.any(Number),
          privilegeExchanges: expect.any(Number),
        },
      });
    });

    it('should provide point system analytics', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/admin/analytics/points')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalPointsInCirculation: expect.any(Number),
          averagePointBalance: expect.any(Number),
          pointsExpiredThisMonth: expect.any(Number),
          topPointEarners: expect.any(Array),
        },
      });
    });
  });
});