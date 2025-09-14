import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MemberPrivilegeController } from '../member-privilege.controller';
import { PrivilegeService } from '@/domains/privilege/services/privilege.service';
import { MemberJwtGuard } from '@/common/guards/member-jwt.guard';
import { Privilege } from '@/domains/privilege/entities/privilege.entity';

describe('MemberPrivilegeController (Integration)', () => {
  let app: INestApplication;
  let privilegeService: jest.Mocked<PrivilegeService>;

  const mockPrivilege = new Privilege({
    id: 'privilege-1',
    name: 'Premium Access',
    description: 'Access to premium features',
    pointCost: 100,
    isActive: true,
    validityDays: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockAvailablePrivileges = [mockPrivilege];

  const mockMemberPrivilege = {
    id: 'member-privilege-1',
    privilegeId: 'privilege-1',
    privilegeName: 'Premium Access',
    privilegeDescription: 'Access to premium features',
    pointCost: 100,
    grantedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    isExpired: false,
    daysRemaining: 30,
  };

  const mockExchangeResult = {
    memberPrivilegeId: 'member-privilege-1',
    privilegeName: 'Premium Access',
    pointsDeducted: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    exchangedAt: new Date(),
  };

  const mockMemberJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const mockPrivilegeService = {
      getAvailablePrivileges: jest.fn(),
      exchangePrivilege: jest.fn(),
      getMemberPrivileges: jest.fn(),
      getActiveMemberPrivileges: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberPrivilegeController],
      providers: [
        {
          provide: PrivilegeService,
          useValue: mockPrivilegeService,
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

    privilegeService = module.get(PrivilegeService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /member/privileges/available', () => {
    it('should get available privileges successfully', async () => {
      privilegeService.getAvailablePrivileges.mockResolvedValue(mockAvailablePrivileges);

      const response = await request(app.getHttpServer())
        .get('/member/privileges/available')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          {
            id: mockPrivilege.id,
            name: mockPrivilege.name,
            description: mockPrivilege.description,
            pointCost: mockPrivilege.pointCost,
            validityDays: mockPrivilege.validityDays,
            isActive: mockPrivilege.isActive,
          },
        ],
        message: 'Available privileges retrieved successfully',
      });

      expect(privilegeService.getAvailablePrivileges).toHaveBeenCalled();
    });

    it('should return empty array when no privileges available', async () => {
      privilegeService.getAvailablePrivileges.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/member/privileges/available')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should return 500 when service fails', async () => {
      privilegeService.getAvailablePrivileges.mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app.getHttpServer())
        .get('/member/privileges/available')
        .expect(500);
    });
  });

  describe('POST /member/privileges/exchange', () => {
    it('should exchange privilege successfully', async () => {
      const exchangeDto = {
        privilegeId: 'privilege-1',
      };

      privilegeService.exchangePrivilege.mockResolvedValue(mockExchangeResult);

      const response = await request(app.getHttpServer())
        .post('/member/privileges/exchange')
        .send(exchangeDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          memberPrivilegeId: mockExchangeResult.memberPrivilegeId,
          privilegeName: mockExchangeResult.privilegeName,
          pointsDeducted: mockExchangeResult.pointsDeducted,
        },
        message: 'Privilege exchanged successfully',
      });

      expect(privilegeService.exchangePrivilege).toHaveBeenCalledWith({
        memberId: 'member-1',
        privilegeId: exchangeDto.privilegeId,
      });
    });

    it('should return 400 for missing privilegeId', async () => {
      const exchangeDto = {};

      await request(app.getHttpServer())
        .post('/member/privileges/exchange')
        .send(exchangeDto)
        .expect(400);
    });

    it('should return 400 for empty privilegeId', async () => {
      const exchangeDto = {
        privilegeId: '',
      };

      await request(app.getHttpServer())
        .post('/member/privileges/exchange')
        .send(exchangeDto)
        .expect(400);
    });

    it('should return 500 for insufficient points', async () => {
      const exchangeDto = {
        privilegeId: 'privilege-1',
      };

      privilegeService.exchangePrivilege.mockRejectedValue(
        new Error('Insufficient points')
      );

      await request(app.getHttpServer())
        .post('/member/privileges/exchange')
        .send(exchangeDto)
        .expect(500);
    });
  });

  describe('GET /member/privileges/my-privileges', () => {
    it('should get member privileges successfully', async () => {
      privilegeService.getMemberPrivileges.mockResolvedValue([mockMemberPrivilege]);

      const response = await request(app.getHttpServer())
        .get('/member/privileges/my-privileges')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          {
            id: mockMemberPrivilege.id,
            privilegeId: mockMemberPrivilege.privilegeId,
            privilegeName: mockMemberPrivilege.privilegeName,
            privilegeDescription: mockMemberPrivilege.privilegeDescription,
            pointCost: mockMemberPrivilege.pointCost,
            isActive: mockMemberPrivilege.isActive,
            isExpired: mockMemberPrivilege.isExpired,
            daysRemaining: mockMemberPrivilege.daysRemaining,
          },
        ],
        message: 'Member privileges retrieved successfully',
      });

      expect(privilegeService.getMemberPrivileges).toHaveBeenCalledWith('member-1');
    });

    it('should return empty array when member has no privileges', async () => {
      privilegeService.getMemberPrivileges.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/member/privileges/my-privileges')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should return 500 when service fails', async () => {
      privilegeService.getMemberPrivileges.mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app.getHttpServer())
        .get('/member/privileges/my-privileges')
        .expect(500);
    });
  });

  describe('GET /member/privileges/active', () => {
    it('should get active member privileges successfully', async () => {
      privilegeService.getActiveMemberPrivileges.mockResolvedValue([mockMemberPrivilege]);

      const response = await request(app.getHttpServer())
        .get('/member/privileges/active')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          {
            id: mockMemberPrivilege.id,
            privilegeId: mockMemberPrivilege.privilegeId,
            privilegeName: mockMemberPrivilege.privilegeName,
            privilegeDescription: mockMemberPrivilege.privilegeDescription,
            pointCost: mockMemberPrivilege.pointCost,
            isActive: mockMemberPrivilege.isActive,
            isExpired: mockMemberPrivilege.isExpired,
            daysRemaining: mockMemberPrivilege.daysRemaining,
          },
        ],
        message: 'Active member privileges retrieved successfully',
      });

      expect(privilegeService.getActiveMemberPrivileges).toHaveBeenCalledWith('member-1');
    });

    it('should return empty array when member has no active privileges', async () => {
      privilegeService.getActiveMemberPrivileges.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/member/privileges/active')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should return 500 when service fails', async () => {
      privilegeService.getActiveMemberPrivileges.mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app.getHttpServer())
        .get('/member/privileges/active')
        .expect(500);
    });
  });
});