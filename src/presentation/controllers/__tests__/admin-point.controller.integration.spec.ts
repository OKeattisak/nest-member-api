import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AdminPointController } from '../admin-point.controller';
import { PointService } from '../../../domains/point/services/point.service';
import { AdminJwtGuard } from '../../../common/guards/admin-jwt.guard';
import { PointType } from '@prisma/client';

describe('AdminPointController (Integration)', () => {
  let app: INestApplication;
  let pointService: jest.Mocked<PointService>;

  const mockAdminUser = {
    id: 'admin-1',
    role: 'ADMIN',
    type: 'admin',
  };

  const mockPointBalance = {
    memberId: 'member-1',
    totalEarned: 1000,
    totalDeducted: 200,
    totalExpired: 50,
    totalExchanged: 100,
    availableBalance: 650,
    lastUpdated: new Date(),
  };

  const mockPointHistory = {
    data: [
      {
        id: 'point-1',
        memberId: 'member-1',
        amount: 100,
        signedAmount: 100,
        type: PointType.EARNED,
        description: 'Points earned',
        expiresAt: new Date(),
        isExpired: false,
        createdAt: new Date(),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const mockPointService = {
      addPoints: jest.fn(),
      deductPoints: jest.fn(),
      getPointBalance: jest.fn(),
      getPointHistory: jest.fn(),
      getExpiringPoints: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPointController],
      providers: [
        {
          provide: PointService,
          useValue: mockPointService,
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

    pointService = module.get(PointService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /admin/points/add', () => {
    it('should add points to member', async () => {
      const addPointsDto = {
        memberId: 'member-1',
        amount: 100,
        description: 'Bonus points',
        expirationDays: 365,
      };

      pointService.addPoints.mockResolvedValue();

      const response = await request(app.getHttpServer())
        .post('/admin/points/add')
        .send(addPointsDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Successfully added 100 points' },
        message: 'Points added successfully',
      });

      expect(pointService.addPoints).toHaveBeenCalledWith({
        memberId: addPointsDto.memberId,
        amount: addPointsDto.amount,
        description: addPointsDto.description,
        expirationDays: addPointsDto.expirationDays,
      });
    });

    it('should return 400 for invalid input', async () => {
      const addPointsDto = {
        memberId: '',
        amount: -100, // Negative amount
        description: '',
      };

      await request(app.getHttpServer())
        .post('/admin/points/add')
        .send(addPointsDto)
        .expect(400);
    });
  });

  describe('POST /admin/points/deduct', () => {
    it('should deduct points from member', async () => {
      const deductPointsDto = {
        memberId: 'member-1',
        amount: 50,
        description: 'Point adjustment',
      };

      pointService.deductPoints.mockResolvedValue();

      const response = await request(app.getHttpServer())
        .post('/admin/points/deduct')
        .send(deductPointsDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Successfully deducted 50 points' },
        message: 'Points deducted successfully',
      });

      expect(pointService.deductPoints).toHaveBeenCalledWith({
        memberId: deductPointsDto.memberId,
        amount: deductPointsDto.amount,
        description: deductPointsDto.description,
      });
    });
  });

  describe('GET /admin/points/balance/:memberId', () => {
    it('should get point balance for member', async () => {
      pointService.getPointBalance.mockResolvedValue(mockPointBalance);

      const response = await request(app.getHttpServer())
        .get('/admin/points/balance/member-1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          memberId: mockPointBalance.memberId,
          totalEarned: mockPointBalance.totalEarned,
          totalDeducted: mockPointBalance.totalDeducted,
          totalExpired: mockPointBalance.totalExpired,
          totalExchanged: mockPointBalance.totalExchanged,
          availableBalance: mockPointBalance.availableBalance,
        },
        message: 'Point balance retrieved successfully',
      });

      expect(pointService.getPointBalance).toHaveBeenCalledWith('member-1');
    });
  });

  describe('GET /admin/points/history/:memberId', () => {
    it('should get point history for member', async () => {
      pointService.getPointHistory.mockResolvedValue(mockPointHistory);

      const response = await request(app.getHttpServer())
        .get('/admin/points/history/member-1?page=1&limit=10')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockPointHistory.data,
        message: 'Point history retrieved successfully',
        meta: {
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      });

      expect(pointService.getPointHistory).toHaveBeenCalledWith('member-1', {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('GET /admin/points/expiring', () => {
    it('should get expiring points', async () => {
      const mockExpiringPoints = [
        {
          id: 'point-1',
          memberId: 'member-1',
          amount: 100,
          signedAmount: 100,
          type: PointType.EARNED,
          description: 'Points expiring soon',
          expiresAt: new Date(),
          isExpired: false,
          createdAt: new Date(),
        },
      ];

      pointService.getExpiringPoints.mockResolvedValue(mockExpiringPoints);

      const response = await request(app.getHttpServer())
        .get('/admin/points/expiring?days=30')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockExpiringPoints,
        message: 'Expiring points retrieved successfully',
      });

      expect(pointService.getExpiringPoints).toHaveBeenCalledWith(30);
    });
  });
});