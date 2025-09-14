import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestSetup, TestContext } from './utils/test-setup';
import { TestDataFactory } from './utils/test-data-factory';

describe('Member Point Management (e2e)', () => {
  let context: TestContext;
  let memberToken: string;
  let adminToken: string;
  let testMember: any;
  let testAdmin: any;

  beforeAll(async () => {
    context = await TestSetup.createTestingApp();
  });

  afterAll(async () => {
    await TestSetup.cleanupTestingApp(context);
  });

  beforeEach(async () => {
    await context.dbUtils.cleanDatabase();
    
    // Create test member and admin
    const memberData = TestDataFactory.createMemberData();
    const adminData = TestDataFactory.createAdminData();
    
    testMember = await context.dbUtils.createTestMember(memberData);
    testAdmin = await context.dbUtils.createTestAdmin(adminData);
    
    memberToken = await TestSetup.generateMemberToken(context.jwtService, testMember.id);
    adminToken = await TestSetup.generateAdminToken(context.jwtService, testAdmin.id, testAdmin.role);
  });

  describe('Admin Point Management', () => {
    describe('/admin/points/add (POST)', () => {
      it('should allow admin to add points to member', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/admin/points/add')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberId: testMember.id,
            amount: 500,
            description: 'Bonus points for activity',
            expirationDays: 365,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringContaining('Points added successfully'),
        });

        // Verify points were added
        const balance = await context.dbUtils.calculateAvailablePoints(testMember.id);
        expect(balance).toBe(500);
      });

      it('should validate point amount is positive', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/admin/points/add')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberId: testMember.id,
            amount: -100,
            description: 'Invalid negative points',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate member exists', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/admin/points/add')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberId: 'non-existent-member-id',
            amount: 100,
            description: 'Points for non-existent member',
          })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('/admin/points/deduct (POST)', () => {
      beforeEach(async () => {
        // Add some points first
        await context.dbUtils.createTestPoints(testMember.id, 1, {
          amount: 1000,
          type: 'EARNED',
        });
      });

      it('should allow admin to deduct points from member', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/admin/points/deduct')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberId: testMember.id,
            amount: 200,
            description: 'Point deduction for violation',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringContaining('Points deducted successfully'),
        });

        // Verify points were deducted
        const balance = await context.dbUtils.calculateAvailablePoints(testMember.id);
        expect(balance).toBe(800);
      });

      it('should fail when deducting more points than available', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/admin/points/deduct')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberId: testMember.id,
            amount: 2000, // More than available
            description: 'Excessive deduction',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INSUFFICIENT_POINTS');
      });
    });
  });

  describe('Member Point Queries', () => {
    beforeEach(async () => {
      // Create various point transactions
      await context.dbUtils.createTestPoints(testMember.id, 3, {
        amount: 100,
        type: 'EARNED',
        description: 'Daily login bonus',
      });
      
      await context.dbUtils.createTestPoints(testMember.id, 1, {
        amount: -50,
        type: 'DEDUCTED',
        description: 'Point exchange',
      });
    });

    describe('/member/points/balance (GET)', () => {
      it('should return member point balance', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/points/balance')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            availableBalance: expect.any(Number),
            totalEarned: expect.any(Number),
            totalSpent: expect.any(Number),
          },
        });

        expect(response.body.data.availableBalance).toBe(250); // 300 - 50
      });

      it('should require authentication', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/points/balance')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('/member/points/history (GET)', () => {
      it('should return paginated point history', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/points/history')
          .set('Authorization', `Bearer ${memberToken}`)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              amount: expect.any(Number),
              type: expect.any(String),
              description: expect.any(String),
              createdAt: expect.any(String),
            }),
          ]),
          meta: {
            pagination: {
              page: 1,
              limit: 10,
              total: expect.any(Number),
              totalPages: expect.any(Number),
              hasNext: expect.any(Boolean),
              hasPrev: false,
            },
          },
        });
      });

      it('should support filtering by point type', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/points/history')
          .set('Authorization', `Bearer ${memberToken}`)
          .query({ type: 'EARNED' })
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((point: any) => {
          expect(point.type).toBe('EARNED');
        });
      });

      it('should support date range filtering', async () => {
        const today = new Date().toISOString().split('T')[0];
        const response = await request(context.app.getHttpServer())
          .get('/member/points/history')
          .set('Authorization', `Bearer ${memberToken}`)
          .query({ 
            startDate: today,
            endDate: today,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Point Expiration', () => {
    it('should handle expired points correctly', async () => {
      // Create expired points
      await context.dbUtils.createTestPoints(testMember.id, 1, {
        amount: 500,
        type: 'EARNED',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        isExpired: true,
      });

      // Create active points
      await context.dbUtils.createTestPoints(testMember.id, 1, {
        amount: 300,
        type: 'EARNED',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isExpired: false,
      });

      const response = await request(context.app.getHttpServer())
        .get('/member/points/balance')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Should only count non-expired points
      expect(response.body.data.availableBalance).toBe(300);
    });

    it('should process point expiration job', async () => {
      // This would test the background job for point expiration
      // Create points that should expire
      await context.dbUtils.createTestPoints(testMember.id, 1, {
        amount: 200,
        type: 'EARNED',
        expiresAt: new Date(Date.now() - 1000), // Just expired
        isExpired: false,
      });

      // Trigger expiration job (admin only)
      const response = await request(context.app.getHttpServer())
        .post('/admin/jobs/expire-points')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify points were expired
      const balance = await context.dbUtils.calculateAvailablePoints(testMember.id);
      expect(balance).toBe(0);
    });
  });

  describe('FIFO Point Deduction', () => {
    beforeEach(async () => {
      // Create points with different creation times to test FIFO
      const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const newDate = new Date(); // Now

      // Older points (should be deducted first)
      await context.prisma.point.create({
        data: {
          memberId: testMember.id,
          amount: 100,
          type: 'EARNED',
          description: 'Old points',
          createdAt: oldDate,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isExpired: false,
        },
      });

      // Newer points (should be deducted last)
      await context.prisma.point.create({
        data: {
          memberId: testMember.id,
          amount: 200,
          type: 'EARNED',
          description: 'New points',
          createdAt: newDate,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isExpired: false,
        },
      });
    });

    it('should deduct points in FIFO order', async () => {
      // Deduct 150 points (should take all 100 from old points and 50 from new points)
      const response = await request(context.app.getHttpServer())
        .post('/admin/points/deduct')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: testMember.id,
          amount: 150,
          description: 'FIFO test deduction',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify remaining balance
      const balance = await context.dbUtils.calculateAvailablePoints(testMember.id);
      expect(balance).toBe(150); // 300 - 150 = 150

      // Verify transaction history shows correct deductions
      const history = await request(context.app.getHttpServer())
        .get('/member/points/history')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const deductions = history.body.data.filter((p: any) => p.type === 'DEDUCTED');
      expect(deductions).toHaveLength(1);
      expect(deductions[0].amount).toBe(-150);
    });
  });
});