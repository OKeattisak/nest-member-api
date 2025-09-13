import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MemberProfileController } from '../member-profile.controller';
import { MemberService } from '../../../domains/member/services/member.service';
import { MemberJwtGuard } from '../../../common/guards/member-jwt.guard';
import { Member } from '../../../domains/member/entities/member.entity';

describe('MemberProfileController (Integration)', () => {
  let app: INestApplication;
  let memberService: jest.Mocked<MemberService>;

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

  const mockMemberJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const mockMemberService = {
      getMemberById: jest.fn(),
      updateMemberProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberProfileController],
      providers: [
        {
          provide: MemberService,
          useValue: mockMemberService,
        },
      ],
    })
      .overrideGuard(MemberJwtGuard)
      .useValue(mockMemberJwtGuard)
      .compile();

    app = module.createNestApplication();
    
    // Mock the request user context BEFORE app.init()
    app.use((req: any, res: any, next: any) => {
      req.user = { id: 'member-1', type: 'member' };
      next();
    });
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    memberService = module.get(MemberService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /member/profile', () => {
    it('should get member profile successfully', async () => {
      memberService.getMemberById.mockResolvedValue(mockMember);

      const response = await request(app.getHttpServer())
        .get('/member/profile')
        .expect(200);

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
        message: 'Profile retrieved successfully',
      });

      expect(memberService.getMemberById).toHaveBeenCalledWith('member-1');
    });

    it('should return 500 when member not found', async () => {
      memberService.getMemberById.mockRejectedValue(
        new Error('Member not found')
      );

      await request(app.getHttpServer())
        .get('/member/profile')
        .expect(500);
    });
  });

  describe('PUT /member/profile', () => {
    it('should update member profile successfully', async () => {
      const updateDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'newusername',
      };

      const updatedMember = new Member({
        id: mockMember.id,
        email: mockMember.email,
        username: updateDto.username,
        passwordHash: mockMember.passwordHash,
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        isActive: mockMember.isActive,
        createdAt: mockMember.createdAt,
        updatedAt: new Date(),
      });

      memberService.updateMemberProfile.mockResolvedValue(updatedMember);

      const response = await request(app.getHttpServer())
        .put('/member/profile')
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: updatedMember.id,
          email: updatedMember.email,
          username: updatedMember.username,
          firstName: updatedMember.firstName,
          lastName: updatedMember.lastName,
          isActive: updatedMember.isActive,
        },
        message: 'Profile updated successfully',
      });

      expect(memberService.updateMemberProfile).toHaveBeenCalledWith('member-1', {
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        username: updateDto.username,
      });
    });

    it('should return 400 for invalid username length', async () => {
      const updateDto = {
        username: 'ab', // too short
      };

      await request(app.getHttpServer())
        .put('/member/profile')
        .send(updateDto)
        .expect(400);
    });

    it('should update profile with partial data', async () => {
      const updateDto = {
        firstName: 'Jane',
      };

      const updatedMember = new Member({
        id: mockMember.id,
        email: mockMember.email,
        username: mockMember.username,
        passwordHash: mockMember.passwordHash,
        firstName: updateDto.firstName,
        lastName: mockMember.lastName,
        isActive: mockMember.isActive,
        createdAt: mockMember.createdAt,
        updatedAt: new Date(),
      });

      memberService.updateMemberProfile.mockResolvedValue(updatedMember);

      const response = await request(app.getHttpServer())
        .put('/member/profile')
        .send(updateDto)
        .expect(200);

      expect(response.body.data.firstName).toBe(updateDto.firstName);
      expect(memberService.updateMemberProfile).toHaveBeenCalledWith('member-1', {
        firstName: updateDto.firstName,
        lastName: undefined,
        username: undefined,
      });
    });
  });

  describe('POST /member/profile/change-password', () => {
    it('should change password successfully', async () => {
      const changePasswordDto = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      memberService.changePassword.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/member/profile/change-password')
        .send(changePasswordDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: null,
        message: 'Password changed successfully',
      });

      expect(memberService.changePassword).toHaveBeenCalledWith(
        'member-1',
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );
    });

    it('should return 400 for short new password', async () => {
      const changePasswordDto = {
        currentPassword: 'oldpassword123',
        newPassword: '123', // too short
      };

      await request(app.getHttpServer())
        .post('/member/profile/change-password')
        .send(changePasswordDto)
        .expect(400);
    });

    it('should return 400 for missing fields', async () => {
      const changePasswordDto = {
        currentPassword: 'oldpassword123',
        // missing newPassword
      };

      await request(app.getHttpServer())
        .post('/member/profile/change-password')
        .send(changePasswordDto)
        .expect(400);
    });

    it('should return 500 for service error', async () => {
      const changePasswordDto = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      memberService.changePassword.mockRejectedValue(
        new Error('Current password is incorrect')
      );

      await request(app.getHttpServer())
        .post('/member/profile/change-password')
        .send(changePasswordDto)
        .expect(500);
    });
  });
});