import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestSetup, TestContext } from './utils/test-setup';
import { TestDataFactory } from './utils/test-data-factory';

describe('Admin Authentication (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await TestSetup.createTestingApp();
  });

  afterAll(async () => {
    await TestSetup.cleanupTestingApp(context);
  });

  beforeEach(async () => {
    await context.dbUtils.cleanDatabase();
  });

  describe('/admin/auth/login (POST)', () => {
    it('should successfully login with valid credentials', async () => {
      // Create test admin
      const adminData = TestDataFactory.createAdminData();
      const admin = await context.dbUtils.createTestAdmin(adminData);

      const response = await request(context.app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          emailOrUsername: admin.email,
          password: adminData.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          accessToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
        message: 'Login successful',
        meta: {
          timestamp: expect.any(String),
          traceId: expect.any(String),
        },
      });

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.expiresIn).toBe(28800); // 8 hours
    });

    it('should fail login with invalid credentials', async () => {
      const response = await request(context.app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          emailOrUsername: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      });
    });

    it('should validate required fields', async () => {
      const response = await request(context.app.getHttpServer())
        .post('/admin/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should login with username instead of email', async () => {
      const adminData = TestDataFactory.createAdminData();
      const admin = await context.dbUtils.createTestAdmin(adminData);

      const response = await request(context.app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          emailOrUsername: admin.username,
          password: adminData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(admin.id);
    });

    it('should not login with inactive admin account', async () => {
      const adminData = TestDataFactory.createAdminData({ isActive: false });
      const admin = await context.dbUtils.createTestAdmin(adminData);

      const response = await request(context.app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          emailOrUsername: admin.email,
          password: adminData.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Validation', () => {
    it('should accept valid admin JWT token', async () => {
      const adminData = TestDataFactory.createAdminData();
      const admin = await context.dbUtils.createTestAdmin(adminData);
      const token = await TestSetup.generateAdminToken(context.jwtService, admin.id, admin.role);

      const response = await request(context.app.getHttpServer())
        .get('/admin/members')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/admin/members')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests without JWT token', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/admin/members')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});