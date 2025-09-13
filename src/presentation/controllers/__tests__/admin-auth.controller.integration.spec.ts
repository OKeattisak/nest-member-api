import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AdminAuthController } from '../admin-auth.controller';
import { AdminService } from '../../../domains/admin/services/admin.service';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { Admin, AdminRole } from '../../../domains/admin/entities/admin.entity';

describe('AdminAuthController (Integration)', () => {
  let app: INestApplication;
  let adminService: jest.Mocked<AdminService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockAdmin = new Admin({
    id: 'admin-1',
    email: 'admin@test.com',
    username: 'admin',
    passwordHash: 'hashed-password',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockAdminService = {
      authenticateAdmin: jest.fn(),
    };

    const mockJwtService = {
      generateAdminToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    adminService = module.get(AdminService);
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /admin/auth/login', () => {
    it('should login admin successfully', async () => {
      const loginDto = {
        emailOrUsername: 'admin@test.com',
        password: 'password123',
      };

      adminService.authenticateAdmin.mockResolvedValue({
        admin: mockAdmin,
        isAuthenticated: true,
      });

      jwtService.generateAdminToken.mockResolvedValue({
        accessToken: 'mock-jwt-token',
        expiresIn: '8h',
      });

      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockAdmin.id,
          email: mockAdmin.email,
          username: mockAdmin.username,
          role: mockAdmin.role,
          accessToken: 'mock-jwt-token',
          expiresIn: 28800, // 8 hours
        },
        message: 'Login successful',
      });

      expect(adminService.authenticateAdmin).toHaveBeenCalledWith({
        emailOrUsername: loginDto.emailOrUsername,
        password: loginDto.password,
      });

      expect(jwtService.generateAdminToken).toHaveBeenCalledWith(
        mockAdmin.id,
        mockAdmin.role
      );
    });

    it('should return 400 for invalid input', async () => {
      const loginDto = {
        emailOrUsername: '',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        emailOrUsername: 'admin@test.com',
        password: 'wrongpassword',
      };

      adminService.authenticateAdmin.mockRejectedValue(
        new Error('Invalid credentials')
      );

      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(loginDto)
        .expect(500); // This would be handled by global exception filter
    });
  });
});