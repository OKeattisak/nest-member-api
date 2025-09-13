import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MemberPointController } from '../member-point.controller';
import { PointService } from '../../../domains/point/services/point.service';
import { MemberJwtGuard } from '../../../common/guards/member-jwt.guard';
import { PointType } from '@prisma/client';

describe('MemberPointController (Integration)', () => {
  let app: INestApplication;
  let pointService: jest.Mocked<PointService>;

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
        description: 'Welcome bonus',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isExpired: false,
        createdAt: new Date(),
      },
      {
        id: 'point-2',
        memberId: 'member-1',
        amount: 50,
        signedAmount: -50,
        type: PointType.DEDUCTED,
        description: 'Point deduction',
        expiresAt: undefined,
        isExpired: false,
        createdAt: new Date(),
      },
    ],
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  const mockMemberJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const mockPointService = {
      getPointBalance: jest.fn(),
      getPointHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberPointController],
      providers: [
        {
          provide: PointService,
          useValue: mockPointService,
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

    pointService = module.get(PointService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /member/points/balance', () => {
    it('should get point balance successfully', async () => {
      pointService.getPointBalance.mockResolvedValue(mockPointBalance);

      const response = await request(app.getHttpServer())
        .get('/member/points/balance')
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

    it('should return 500 when service fails', async () => {
      pointService.getPointBalance.mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app.getHttpServer())
        .get('/member/points/balance')
        .expect(500);
    });
  });

  describe('GET /member/points/history', () => {
    it('should get point history with default pagination', async () => {
      pointService.getPointHistory.mockResolvedValue(mockPointHistory);

      const response = await request(app.getHttpServer())
        .get('/member/points/history')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          {
            id: 'point-1',
            memberId: 'member-1',
            amount: 100,
            signedAmount: 100,
            type: PointType.EARNED,
            description: 'Welcome bonus',
            isExpired: false,
          },
          {
            id: 'point-2',
            memberId: 'member-1',
            amount: 50,
            signedAmount: -50,
            type: PointType.DEDUCTED,
            description: 'Point deduction',
            isExpired: false,
          },
        ],
        message: 'Point history retrieved successfully',
        meta: {
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
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

    it('should get point history with custom pagination', async () => {
      const customHistory = {
        ...mockPointHistory,
        page: 2,
        limit: 5,
        totalPages: 2, // Make it consistent with page 2
      };

      pointService.getPointHistory.mockResolvedValue(customHistory);

      const response = await request(app.getHttpServer())
        .get('/member/points/history?page=2&limit=5')
        .expect(200);

      expect(response.body.meta.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 2,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      });

      expect(pointService.getPointHistory).toHaveBeenCalledWith('member-1', {
        page: 2,
        limit: 5,
      });
    });

    it('should return 400 for invalid pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/member/points/history?page=0&limit=101')
        .expect(400);
    });

    it('should return 400 for non-numeric pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/member/points/history?page=abc&limit=xyz')
        .expect(400);
    });

    it('should return 500 when service fails', async () => {
      pointService.getPointHistory.mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app.getHttpServer())
        .get('/member/points/history')
        .expect(500);
    });
  });
});