import { TestingModule } from '@nestjs/testing';
import { PointType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { PointRepository } from './point.repository';
import { MemberRepository } from '@/domains/member/repositories/member.repository';
import { createTestingModule, cleanupDatabase, createTestMember } from '@/domains/common/test-utils/test-database.setup';

describe('PointRepository', () => {
  let module: TestingModule;
  let repository: PointRepository;
  let memberRepository: MemberRepository;
  let prisma: PrismaService;
  let testMemberId: string;

  beforeAll(async () => {
    module = await createTestingModule([PointRepository, MemberRepository]);
    repository = module.get<PointRepository>(PointRepository);
    memberRepository = module.get<MemberRepository>(MemberRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    
    // Create a test member for point operations
    const member = await memberRepository.create(createTestMember());
    testMemberId = member.id;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await module.close();
  });

  describe('create', () => {
    it('should create a new point record', async () => {
      const pointData = {
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Test points',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      const point = await repository.create(pointData);

      expect(point).toBeDefined();
      expect(point.memberId).toBe(testMemberId);
      expect(Number(point.amount)).toBe(100);
      expect(point.type).toBe(PointType.EARNED);
      expect(point.description).toBe('Test points');
      expect(point.expiresAt).toBeDefined();
      expect(point.isExpired).toBe(false);
    });
  });

  describe('createMany', () => {
    it('should create multiple point records', async () => {
      const pointsData = [
        {
          memberId: testMemberId,
          amount: 50,
          type: PointType.EARNED,
          description: 'First batch',
        },
        {
          memberId: testMemberId,
          amount: -25,
          type: PointType.DEDUCTED,
          description: 'Deduction',
        },
      ];

      const points = await repository.createMany(pointsData);

      expect(points).toHaveLength(2);
      expect(points.some(p => Number(p.amount) === 50)).toBe(true);
      expect(points.some(p => Number(p.amount) === -25)).toBe(true);
    });
  });

  describe('findByMemberId', () => {
    it('should find all points for a member', async () => {
      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Test points 1',
      });

      await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Test points 2',
      });

      const points = await repository.findByMemberId(testMemberId);

      expect(points).toHaveLength(2);
      expect(points.every(p => p.memberId === testMemberId)).toBe(true);
    });
  });

  describe('getAvailableBalance', () => {
    it('should calculate available balance correctly', async () => {
      // Add earned points
      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Earned points',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'More earned points',
      });

      // Add deducted points
      await repository.create({
        memberId: testMemberId,
        amount: -25,
        type: PointType.DEDUCTED,
        description: 'Used points',
      });

      const balance = await repository.getAvailableBalance(testMemberId);
      expect(balance).toBe(125); // 100 + 50 - 25
    });

    it('should exclude expired points from balance', async () => {
      // Add expired points
      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Expired points',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });

      // Add valid points
      await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Valid points',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const balance = await repository.getAvailableBalance(testMemberId);
      expect(balance).toBe(50); // Only valid points
    });
  });

  describe('getAvailablePoints', () => {
    it('should return available points in FIFO order', async () => {
      // Create points with different timestamps
      const firstPoint = await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'First points',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const secondPoint = await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Second points',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const availablePoints = await repository.getAvailablePoints(testMemberId);

      expect(availablePoints).toHaveLength(2);
      expect(availablePoints[0]?.id).toBe(firstPoint.id); // First created should be first
      expect(availablePoints[1]?.id).toBe(secondPoint.id);
    });
  });

  describe('deductPoints', () => {
    beforeEach(async () => {
      // Set up available points for deduction tests
      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'First batch',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Second batch',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    });

    it('should deduct points using FIFO logic', async () => {
      const deductedPoints = await repository.deductPoints(testMemberId, 75, 'Test deduction');

      expect(deductedPoints).toHaveLength(2); // Should create 2 deduction records
      // The exact amounts depend on the FIFO order, but total should be 75
      const totalDeducted = deductedPoints.reduce((sum, point) => sum + Math.abs(Number(point.amount)), 0);
      expect(totalDeducted).toBe(75);

      const balance = await repository.getAvailableBalance(testMemberId);
      expect(balance).toBe(75); // 150 - 75 = 75
    });

    it('should throw error for insufficient points', async () => {
      await expect(
        repository.deductPoints(testMemberId, 200, 'Insufficient test')
      ).rejects.toThrow('Insufficient points');
    });
  });

  describe('findExpiredPoints', () => {
    it('should find expired points', async () => {
      // Create expired point
      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Expired points',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });

      // Create valid point
      await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Valid points',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const expiredPoints = await repository.findExpiredPoints();

      expect(expiredPoints).toHaveLength(1);
      expect(Number(expiredPoints[0]?.amount)).toBe(100);
      expect(expiredPoints[0]?.description).toBe('Expired points');
    });
  });

  describe('expirePoints', () => {
    it('should mark points as expired', async () => {
      const point = await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'To be expired',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      await repository.expirePoints([point.id]);

      const expiredPoint = await repository.findById(point.id);
      expect(expiredPoint!.isExpired).toBe(true);
    });
  });

  describe('findPointHistory', () => {
    it('should return paginated point history', async () => {
      // Create multiple points
      for (let i = 0; i < 5; i++) {
        await repository.create({
          memberId: testMemberId,
          amount: 10 * (i + 1),
          type: PointType.EARNED,
          description: `Points ${i + 1}`,
        });
      }

      const result = await repository.findPointHistory(testMemberId, { page: 1, limit: 3 });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('findPointsByType', () => {
    it('should find points by type', async () => {
      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Earned',
      });

      await repository.create({
        memberId: testMemberId,
        amount: -50,
        type: PointType.DEDUCTED,
        description: 'Deducted',
      });

      const earnedPoints = await repository.findPointsByType(testMemberId, PointType.EARNED);
      const deductedPoints = await repository.findPointsByType(testMemberId, PointType.DEDUCTED);

      expect(earnedPoints).toHaveLength(1);
      expect(deductedPoints).toHaveLength(1);
      expect(Number(earnedPoints[0]?.amount)).toBe(100);
      expect(Number(deductedPoints[0]?.amount)).toBe(-50);
    });
  });

  describe('getTotalEarnedPoints', () => {
    it('should calculate total earned points', async () => {
      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'First earned',
      });

      await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Second earned',
      });

      await repository.create({
        memberId: testMemberId,
        amount: -25,
        type: PointType.DEDUCTED,
        description: 'Deducted',
      });

      const totalEarned = await repository.getTotalEarnedPoints(testMemberId);
      expect(totalEarned).toBe(150); // Only earned points, not deducted
    });
  });

  describe('findExpiringPoints', () => {
    it('should find points expiring within specified days', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await repository.create({
        memberId: testMemberId,
        amount: 100,
        type: PointType.EARNED,
        description: 'Expiring tomorrow',
        expiresAt: tomorrow,
      });

      await repository.create({
        memberId: testMemberId,
        amount: 50,
        type: PointType.EARNED,
        description: 'Expiring next week',
        expiresAt: nextWeek,
      });

      await repository.create({
        memberId: testMemberId,
        amount: 25,
        type: PointType.EARNED,
        description: 'Expiring next month',
        expiresAt: nextMonth,
      });

      const expiringIn7Days = await repository.findExpiringPoints(7);
      const expiringIn2Days = await repository.findExpiringPoints(2);

      expect(expiringIn7Days).toHaveLength(2); // Tomorrow and next week
      expect(expiringIn2Days).toHaveLength(1); // Only tomorrow
    });
  });
});