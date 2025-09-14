import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { DatabaseTestUtils } from './database-test-utils';
import { JwtService } from '../../src/infrastructure/auth/jwt.service';

export interface TestContext {
  app: INestApplication;
  module: TestingModule;
  prisma: PrismaService;
  dbUtils: DatabaseTestUtils;
  jwtService: JwtService;
}

export class TestSetup {
  static async createTestingApp(): Promise<TestContext> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    
    // Apply the same configuration as in main.ts
    const { ValidationPipe } = await import('@nestjs/common');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    const prisma = app.get<PrismaService>(PrismaService);
    const jwtService = app.get<JwtService>(JwtService);
    const dbUtils = new DatabaseTestUtils(prisma);

    return {
      app,
      module: moduleFixture,
      prisma,
      dbUtils,
      jwtService,
    };
  }

  static async cleanupTestingApp(context: TestContext): Promise<void> {
    await context.dbUtils.cleanDatabase();
    await context.app.close();
  }

  /**
   * Generate a valid admin JWT token for testing
   */
  static async generateAdminToken(jwtService: JwtService, adminId: string, role: string = 'ADMIN'): Promise<string> {
    const tokens = await jwtService.generateAdminToken(adminId, role as any);
    return tokens.accessToken;
  }

  /**
   * Generate a valid member JWT token for testing
   */
  static async generateMemberToken(jwtService: JwtService, memberId: string): Promise<string> {
    const tokens = await jwtService.generateMemberToken(memberId);
    return tokens.accessToken;
  }

  /**
   * Create authorization header for admin requests
   */
  static createAdminAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Create authorization header for member requests
   */
  static createMemberAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }
}

/**
 * Global test setup function to be used in jest setup files
 */
export async function setupTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_member_service';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret';
  process.env.MEMBER_JWT_SECRET = 'test-member-jwt-secret';
}

/**
 * Global test teardown function
 */
export async function teardownTestEnvironment() {
  // Cleanup any global resources if needed
}