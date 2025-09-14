import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestSetup, TestContext } from './utils/test-setup';
import { TestDataFactory } from './utils/test-data-factory';

describe('Privilege Exchange (e2e)', () => {
  let context: TestContext;
  let memberToken: string;
  let adminToken: string;
  let testMember: any;
  let testAdmin: any;
  let testPrivilege: any;

  beforeAll(async () => {
    context = await TestSetup.createTestingApp();
  });

  afterAll(async () => {
    await TestSetup.cleanupTestingApp(context);
  });

  beforeEach(async () => {
    await context.dbUtils.cleanDatabase();
    
    // Create test data
    const memberData = TestDataFactory.createMemberData();
    const adminData = TestDataFactory.createAdminData();
    
    testMember = await context.dbUtils.createTestMember(memberData);
    testAdmin = await context.dbUtils.createTestAdmin(adminData);
    testPrivilege = await context.dbUtils.createTestPrivilege({
      name: 'Premium Access',
      pointCost: 500,
      validityDays: 30,
    });
    
    memberToken = await TestSetup.generateMemberToken(context.jwtService, testMember.id);
    adminToken = await TestSetup.generateAdminToken(context.jwtService, testAdmin.id, testAdmin.role);
    
    // Give member some points
    await context.dbUtils.createTestPoints(testMember.id, 1, {
      amount: 1000,
      type: 'EARNED',
    });
  });

  describe('Admin Privilege Management', () => {
    describe('/admin/privileges (POST)', () => {
      it('should allow admin to create new privilege', async () => {
        const privilegeData = TestDataFactory.createPrivilegeData();

        const response = await request(context.app.getHttpServer())
          .post('/admin/privileges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: privilegeData.name,
            description: privilegeData.description,
            pointCost: privilegeData.pointCost,
            validityDays: privilegeData.validityDays,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            name: privilegeData.name,
            description: privilegeData.description,
            pointCost: privilegeData.pointCost,
            validityDays: privilegeData.validityDays,
            isActive: true,
          },
        });
      });

      it('should validate privilege data', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/admin/privileges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '', // Invalid empty name
            pointCost: -100, // Invalid negative cost
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should prevent duplicate privilege names', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/admin/privileges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: testPrivilege.name, // Duplicate name
            description: 'Different description',
            pointCost: 300,
          })
          .expect(409);

        expect(response.body.success).toBe(false);
      });
    });

    describe('/admin/privileges (GET)', () => {
      beforeEach(async () => {
        // Create additional privileges
        await context.dbUtils.createTestPrivilege({
          name: 'VIP Status',
          pointCost: 1000,
        });
        await context.dbUtils.createTestPrivilege({
          name: 'Inactive Privilege',
          pointCost: 200,
          isActive: false,
        });
      });

      it('should return all privileges for admin', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/admin/privileges')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              pointCost: expect.any(Number),
              isActive: expect.any(Boolean),
            }),
          ]),
        });

        expect(response.body.data).toHaveLength(3); // Including inactive
      });

      it('should support filtering by active status', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/admin/privileges')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ isActive: true })
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((privilege: any) => {
          expect(privilege.isActive).toBe(true);
        });
      });
    });

    describe('/admin/privileges/:id (PUT)', () => {
      it('should allow admin to update privilege', async () => {
        const response = await request(context.app.getHttpServer())
          .put(`/admin/privileges/${testPrivilege.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Premium Access',
            pointCost: 600,
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: testPrivilege.id,
            name: 'Updated Premium Access',
            pointCost: 600,
            description: 'Updated description',
          },
        });
      });

      it('should handle non-existent privilege', async () => {
        const response = await request(context.app.getHttpServer())
          .put('/admin/privileges/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Name',
            pointCost: 400,
          })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Member Privilege Access', () => {
    describe('/member/privileges (GET)', () => {
      beforeEach(async () => {
        // Create additional active and inactive privileges
        await context.dbUtils.createTestPrivilege({
          name: 'VIP Status',
          pointCost: 1500,
          isActive: true,
        });
        await context.dbUtils.createTestPrivilege({
          name: 'Inactive Privilege',
          pointCost: 200,
          isActive: false,
        });
      });

      it('should return only active privileges for members', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/privileges')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              pointCost: expect.any(Number),
              isActive: true,
            }),
          ]),
        });

        // Should only show active privileges
        response.body.data.forEach((privilege: any) => {
          expect(privilege.isActive).toBe(true);
        });
      });

      it('should include affordability information', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/privileges')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((privilege: any) => {
          expect(privilege).toHaveProperty('canAfford');
          expect(typeof privilege.canAfford).toBe('boolean');
        });
      });
    });

    describe('/member/privileges/exchange (POST)', () => {
      it('should allow member to exchange points for privilege', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/member/privileges/exchange')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            privilegeId: testPrivilege.id,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            privilegeId: testPrivilege.id,
            grantedAt: expect.any(String),
            expiresAt: expect.any(String),
            isActive: true,
          },
          message: expect.stringContaining('Privilege exchanged successfully'),
        });

        // Verify points were deducted
        const balance = await context.dbUtils.calculateAvailablePoints(testMember.id);
        expect(balance).toBe(500); // 1000 - 500 = 500
      });

      it('should fail when member has insufficient points', async () => {
        // Create expensive privilege
        const expensivePrivilege = await context.dbUtils.createTestPrivilege({
          name: 'Expensive Privilege',
          pointCost: 2000, // More than member has
        });

        const response = await request(context.app.getHttpServer())
          .post('/member/privileges/exchange')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            privilegeId: expensivePrivilege.id,
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'INSUFFICIENT_POINTS',
            message: expect.stringContaining('Insufficient points'),
          },
        });
      });

      it('should fail for inactive privilege', async () => {
        const inactivePrivilege = await context.dbUtils.createTestPrivilege({
          name: 'Inactive Privilege',
          pointCost: 100,
          isActive: false,
        });

        const response = await request(context.app.getHttpServer())
          .post('/member/privileges/exchange')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            privilegeId: inactivePrivilege.id,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should fail for non-existent privilege', async () => {
        const response = await request(context.app.getHttpServer())
          .post('/member/privileges/exchange')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            privilegeId: 'non-existent-privilege-id',
          })
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      it('should prevent duplicate privilege exchange', async () => {
        // First exchange
        await request(context.app.getHttpServer())
          .post('/member/privileges/exchange')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            privilegeId: testPrivilege.id,
          })
          .expect(201);

        // Second exchange (should fail)
        const response = await request(context.app.getHttpServer())
          .post('/member/privileges/exchange')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            privilegeId: testPrivilege.id,
          })
          .expect(409);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'PRIVILEGE_ALREADY_OWNED',
            message: expect.stringContaining('already own this privilege'),
          },
        });
      });
    });

    describe('/member/privileges/my (GET)', () => {
      beforeEach(async () => {
        // Exchange a privilege
        await context.dbUtils.createMemberPrivilege(
          testMember.id,
          testPrivilege.id,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        );
      });

      it('should return member owned privileges', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/privileges/my')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              privilegeId: testPrivilege.id,
              grantedAt: expect.any(String),
              expiresAt: expect.any(String),
              isActive: true,
              privilege: expect.objectContaining({
                name: testPrivilege.name,
                description: testPrivilege.description,
              }),
            }),
          ]),
        });
      });

      it('should include expiration status', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/privileges/my')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((memberPrivilege: any) => {
          expect(memberPrivilege).toHaveProperty('isExpired');
          expect(typeof memberPrivilege.isExpired).toBe('boolean');
        });
      });

      it('should support filtering by active status', async () => {
        const response = await request(context.app.getHttpServer())
          .get('/member/privileges/my')
          .set('Authorization', `Bearer ${memberToken}`)
          .query({ isActive: true })
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((memberPrivilege: any) => {
          expect(memberPrivilege.isActive).toBe(true);
        });
      });
    });
  });

  describe('Privilege Expiration', () => {
    it('should handle expired privileges correctly', async () => {
      // Create expired privilege
      await context.dbUtils.createMemberPrivilege(
        testMember.id,
        testPrivilege.id,
        new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday (expired)
      );

      const response = await request(context.app.getHttpServer())
        .get('/member/privileges/my')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const expiredPrivilege = response.body.data.find((p: any) => p.privilegeId === testPrivilege.id);
      expect(expiredPrivilege.isExpired).toBe(true);
    });

    it('should process privilege expiration job', async () => {
      // Create privilege that should expire
      await context.dbUtils.createMemberPrivilege(
        testMember.id,
        testPrivilege.id,
        new Date(Date.now() - 1000) // Just expired
      );

      // Trigger expiration job (admin only)
      const response = await request(context.app.getHttpServer())
        .post('/admin/jobs/expire-privileges')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify privilege was deactivated
      const memberPrivileges = await request(context.app.getHttpServer())
        .get('/member/privileges/my')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const expiredPrivilege = memberPrivileges.body.data.find((p: any) => p.privilegeId === testPrivilege.id);
      expect(expiredPrivilege.isActive).toBe(false);
    });
  });

  describe('Complete Privilege Exchange Workflow', () => {
    it('should complete full privilege exchange workflow', async () => {
      // 1. Member views available privileges
      const availablePrivileges = await request(context.app.getHttpServer())
        .get('/member/privileges')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(availablePrivileges.body.success).toBe(true);
      expect(availablePrivileges.body.data.length).toBeGreaterThan(0);

      // 2. Member checks their point balance
      const balance = await request(context.app.getHttpServer())
        .get('/member/points/balance')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(balance.body.data.availableBalance).toBeGreaterThanOrEqual(testPrivilege.pointCost);

      // 3. Member exchanges points for privilege
      const exchange = await request(context.app.getHttpServer())
        .post('/member/privileges/exchange')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          privilegeId: testPrivilege.id,
        })
        .expect(201);

      expect(exchange.body.success).toBe(true);

      // 4. Verify points were deducted
      const newBalance = await request(context.app.getHttpServer())
        .get('/member/points/balance')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(newBalance.body.data.availableBalance).toBe(
        balance.body.data.availableBalance - testPrivilege.pointCost
      );

      // 5. Verify privilege appears in member's privileges
      const myPrivileges = await request(context.app.getHttpServer())
        .get('/member/privileges/my')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const exchangedPrivilege = myPrivileges.body.data.find((p: any) => p.privilegeId === testPrivilege.id);
      expect(exchangedPrivilege).toBeDefined();
      expect(exchangedPrivilege.isActive).toBe(true);

      // 6. Verify point transaction history
      const history = await request(context.app.getHttpServer())
        .get('/member/points/history')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const exchangeTransaction = history.body.data.find((p: any) => 
        p.type === 'EXCHANGED' && p.amount === -testPrivilege.pointCost
      );
      expect(exchangeTransaction).toBeDefined();
    });
  });
});