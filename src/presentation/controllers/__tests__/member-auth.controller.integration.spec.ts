import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MemberAuthController } from '../member-auth.controller';
import { MemberService } from '@/domains/member/services/member.service';
import { JwtService } from '@/infrastructure/auth/jwt.service';
import { Member } from '@/domains/member/entities/member.entity';

describe('MemberAuthController (Integration)', () => {
  let app: INestApplication;
  let memberService: jest.Mocked<MemberService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockMember = new Member({
    id: 'member-1',
    email: 'member@test.com',
    username: 'testmember',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockMemberService = {
      registerMember: jest.fn(),
      authenticateMember: jest.fn(),
    };

    const mockJwtService = {
      generateMemberToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberAuthController],
      providers: [
        {
          provide: MemberService,
          useValue: mockMemberService,
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

    memberService = module.get(MemberService);
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /member/auth/register', () => {
    it('should register member successfully', async () => {
      const registerDto = {
        email: 'newmember@test.com',
        username: 'newmember',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      memberService.registerMember.mockResolvedValue(mockMember);

      const response = await request(app.getHttpServer())
        .post('/member/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockMember.id,
          email: mockMember.email,
          username: mockMember.username,
          firstName: mockMember.firstName,
          lastName: mockMember.lastName,
          isActive: mockMember.isActive,
        },
        message: 'Registration successful',
      });

      expect(memberService.registerMember).toHaveBeenCalledWith({
        email: registerDto.email,
        username: registerDto.username,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
    });

    it('should return 400 for invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        username: 'newmember',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      await request(app.getHttpServer())
        .post('/member/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      const registerDto = {
        email: 'newmember@test.com',
        username: 'newmember',
        password: '123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      await request(app.getHttpServer())
        .post('/member/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const registerDto = {
        email: 'newmember@test.com',
        username: 'newmember',
        // missing password, firstName, lastName
      };

      await request(app.getHttpServer())
        .post('/member/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /member/auth/login', () => {
    it('should login member successfully', async () => {
      const loginDto = {
        emailOrUsername: 'member@test.com',
        password: 'password123',
      };

      memberService.authenticateMember.mockResolvedValue({
        member: mockMember,
        isAuthenticated: true,
      });

      jwtService.generateMemberToken.mockResolvedValue({
        accessToken: 'mock-jwt-token',
        expiresIn: '24h',
      });

      const response = await request(app.getHttpServer())
        .post('/member/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockMember.id,
          email: mockMember.email,
          username: mockMember.username,
          firstName: mockMember.firstName,
          lastName: mockMember.lastName,
          accessToken: 'mock-jwt-token',
          expiresIn: 86400, // 24 hours
        },
        message: 'Login successful',
      });

      expect(memberService.authenticateMember).toHaveBeenCalledWith({
        emailOrUsername: loginDto.emailOrUsername,
        password: loginDto.password,
      });

      expect(jwtService.generateMemberToken).toHaveBeenCalledWith(mockMember.id);
    });

    it('should return 400 for invalid input', async () => {
      const loginDto = {
        emailOrUsername: '',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/member/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 500 for authentication failure', async () => {
      const loginDto = {
        emailOrUsername: 'member@test.com',
        password: 'wrongpassword',
      };

      memberService.authenticateMember.mockRejectedValue(
        new Error('Invalid credentials')
      );

      await request(app.getHttpServer())
        .post('/member/auth/login')
        .send(loginDto)
        .expect(500); // This would be handled by global exception filter
    });
  });
});