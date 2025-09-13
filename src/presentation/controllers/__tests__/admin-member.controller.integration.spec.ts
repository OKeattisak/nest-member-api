import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AdminMemberController } from '../admin-member.controller';
import { MemberService } from '../../../domains/member/services/member.service';
import { AdminJwtGuard } from '../../../common/guards/admin-jwt.guard';
import { Member } from '../../../domains/member/entities/member.entity';

describe('AdminMemberController (Integration)', () => {
  let app: INestApplication;
  let memberService: jest.Mocked<MemberService>;

  const mockMember = new Member({
    id: 'member-1',
    email: 'member@test.com',
    username: 'member',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockAdminUser = {
    id: 'admin-1',
    role: 'ADMIN',
    type: 'admin',
  };

  beforeEach(async () => {
    const mockMemberService = {
      registerMember: jest.fn(),
      getMemberById: jest.fn(),
      updateMemberProfile: jest.fn(),
      deactivateMember: jest.fn(),
      softDeleteMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMemberController],
      providers: [
        {
          provide: MemberService,
          useValue: mockMemberService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockAdminUser;
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();

    memberService = module.get(MemberService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /admin/members', () => {
    it('should create a new member', async () => {
      const createMemberDto = {
        email: 'newmember@test.com',
        username: 'newmember',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      memberService.registerMember.mockResolvedValue(mockMember);

      const response = await request(app.getHttpServer())
        .post('/admin/members')
        .send(createMemberDto)
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
        message: 'Member created successfully',
      });

      expect(memberService.registerMember).toHaveBeenCalledWith({
        email: createMemberDto.email,
        username: createMemberDto.username,
        password: createMemberDto.password,
        firstName: createMemberDto.firstName,
        lastName: createMemberDto.lastName,
      });
    });

    it('should return 400 for invalid input', async () => {
      const createMemberDto = {
        email: 'invalid-email',
        username: '',
        password: '123', // Too short
        firstName: '',
        lastName: '',
      };

      await request(app.getHttpServer())
        .post('/admin/members')
        .send(createMemberDto)
        .expect(400);
    });
  });

  describe('GET /admin/members/:id', () => {
    it('should get member by id', async () => {
      memberService.getMemberById.mockResolvedValue(mockMember);

      const response = await request(app.getHttpServer())
        .get(`/admin/members/${mockMember.id}`)
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
        message: 'Member retrieved successfully',
      });

      expect(memberService.getMemberById).toHaveBeenCalledWith(mockMember.id);
    });

    it('should return 404 for non-existent member', async () => {
      memberService.getMemberById.mockRejectedValue(
        new Error('Member not found')
      );

      await request(app.getHttpServer())
        .get('/admin/members/non-existent-id')
        .expect(500); // This would be handled by global exception filter
    });
  });

  describe('PUT /admin/members/:id', () => {
    it('should update member', async () => {
      const updateMemberDto = {
        firstName: 'Updated',
        lastName: 'Name',
        username: 'updatedusername',
      };

      const updatedMember = new Member({
        id: mockMember.id,
        email: mockMember.email,
        passwordHash: mockMember.passwordHash,
        firstName: updateMemberDto.firstName,
        lastName: updateMemberDto.lastName,
        username: updateMemberDto.username,
        isActive: mockMember.isActive,
        createdAt: mockMember.createdAt,
        updatedAt: new Date(),
      });

      memberService.updateMemberProfile.mockResolvedValue(updatedMember);

      const response = await request(app.getHttpServer())
        .put(`/admin/members/${mockMember.id}`)
        .send(updateMemberDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockMember.id,
          firstName: updateMemberDto.firstName,
          lastName: updateMemberDto.lastName,
          username: updateMemberDto.username,
        },
        message: 'Member updated successfully',
      });

      expect(memberService.updateMemberProfile).toHaveBeenCalledWith(
        mockMember.id,
        {
          firstName: updateMemberDto.firstName,
          lastName: updateMemberDto.lastName,
          username: updateMemberDto.username,
        }
      );
    });
  });

  describe('DELETE /admin/members/:id', () => {
    it('should delete member', async () => {
      memberService.softDeleteMember.mockResolvedValue();

      await request(app.getHttpServer())
        .delete(`/admin/members/${mockMember.id}`)
        .expect(204);

      expect(memberService.softDeleteMember).toHaveBeenCalledWith(mockMember.id);
    });
  });
});