import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestSetup, TestContext } from './utils/test-setup';
import { TestDataFactory } from './utils/test-data-factory';

describe('Member Authentication (e2e)', () => {
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

  describe('/member/auth/register (POST)', () => {
    it('should successfully register a new member', async () => {
      const memberData = TestDataFactory.createMemberData();

      const response = await request(context.app.getHttpServer())
        .post('/member/auth/register')
        .send({
          email: memberData.email,
          username: memberData.username,
          password: memberData.password,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          email: memberData.email,
          username: memberData.username,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        message: 'Registration successful',
      });
    });

    it('should fail registration with duplicate email', async () => {
      const memberData = TestDataFactory.createMemberData();
      
      // Create first member
      await context.dbUtils.createTestMember(memberData);

      // Try to register with same email
      const response = await request(context.app.getHttpServer())
        .post('/member/auth/register')
        .send({
          email: memberData.email,
          username: 'different-username',
          password: memberData.password,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should fail registration with duplicate username', async () => {
      const memberData = TestDataFactory.createMemberData();
      
      // Create first member
      await context.dbUtils.createTestMember(memberData);

      // Try to register with same username
      const response = await request(context.app.getHttpServer())
        .post('/member/auth/register')
        .send({
          email: 'different@example.com',
          username: memberData.username,
          password: memberData.password,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(context.app.getHttpServer())
        .post('/member/auth/register')
        .send({
          email: 'invalid-email',
          // missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const memberData = TestDataFactory.createMemberData();

      const response = await request(context.app.getHttpServer())
        .post('/member/auth/register')
        .send({
          ...memberData,
          email: 'invalid-email-format',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const memberData = TestDataFactory.createMemberData();

      const response = await request(context.app.getHttpServer())
        .post('/member/auth/register')
        .send({
          ...memberData,
          password: '123', // weak password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/member/auth/login (POST)', () => {
    it('should successfully login with valid credentials', async () => {
      const memberData = TestDataFactory.createMemberData();
      const member = await context.dbUtils.createTestMember(memberData);

      const response = await request(context.app.getHttpServer())
        .post('/member/auth/login')
        .send({
          emailOrUsername: member.email,
          password: memberData.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: member.id,
          email: member.email,
          username: member.username,
          firstName: member.firstName,
          lastName: member.lastName,
          accessToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
        message: 'Login successful',
      });

      expect(response.body.data.expiresIn).toBe(86400); // 24 hours
    });

    it('should login with username instead of email', async () => {
      const memberData = TestDataFactory.createMemberData();
      const member = await context.dbUtils.createTestMember(memberData);

      const response = await request(context.app.getHttpServer())
        .post('/member/auth/login')
        .send({
          emailOrUsername: member.username,
          password: memberData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(member.id);
    });

    it('should fail login with invalid credentials', async () => {
      const response = await request(context.app.getHttpServer())
        .post('/member/auth/login')
        .send({
          emailOrUsername: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not login with inactive member account', async () => {
      const memberData = TestDataFactory.createMemberData({ isActive: false });
      const member = await context.dbUtils.createTestMember(memberData);

      const response = await request(context.app.getHttpServer())
        .post('/member/auth/login')
        .send({
          emailOrUsername: member.email,
          password: memberData.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Member JWT Token Validation', () => {
    it('should accept valid member JWT token', async () => {
      const memberData = TestDataFactory.createMemberData();
      const member = await context.dbUtils.createTestMember(memberData);
      const token = await TestSetup.generateMemberToken(context.jwtService, member.id);

      const response = await request(context.app.getHttpServer())
        .get('/member/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/member/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests without JWT token', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/member/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});