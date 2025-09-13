import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AdminPrivilegeController } from '../admin-privilege.controller';
import { PrivilegeService } from '../../../domains/privilege/services/privilege.service';
import { AdminJwtGuard } from '../../../common/guards/admin-jwt.guard';
import { Privilege } from '../../../domains/privilege/entities/privilege.entity';

describe('AdminPrivilegeController (Integration)', () => {
  let app: INestApplication;
  let privilegeService: jest.Mocked<PrivilegeService>;

  const mockAdminUser = {
    id: 'admin-1',
    role: 'ADMIN',
    type: 'admin',
  };

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

  const mockPrivilegesResult = {
    data: [mockPrivilege],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const mockPrivilegeService = {
      createPrivilege: jest.fn(),
      getPrivileges: jest.fn(),
      getPrivilegeById: jest.fn(),
      updatePrivilege: jest.fn(),
      activatePrivilege: jest.fn(),
      deactivatePrivilege: jest.fn(),
      deletePrivilege: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPrivilegeController],
      providers: [
        {
          provide: PrivilegeService,
          useValue: mockPrivilegeService,
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

    privilegeService = module.get(PrivilegeService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /admin/privileges', () => {
    it('should create a new privilege', async () => {
      const createPrivilegeDto = {
        name: 'VIP Access',
        description: 'VIP member benefits',
        pointCost: 200,
        validityDays: 60,
      };

      privilegeService.createPrivilege.mockResolvedValue(mockPrivilege);

      const response = await request(app.getHttpServer())
        .post('/admin/privileges')
        .send(createPrivilegeDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockPrivilege.id,
          name: mockPrivilege.name,
          description: mockPrivilege.description,
          pointCost: mockPrivilege.pointCost,
          isActive: mockPrivilege.isActive,
          validityDays: mockPrivilege.validityDays,
        },
        message: 'Privilege created successfully',
      });

      expect(privilegeService.createPrivilege).toHaveBeenCalledWith({
        name: createPrivilegeDto.name,
        description: createPrivilegeDto.description,
        pointCost: createPrivilegeDto.pointCost,
        validityDays: createPrivilegeDto.validityDays,
      });
    });

    it('should return 400 for invalid input', async () => {
      const createPrivilegeDto = {
        name: '', // Empty name
        description: '',
        pointCost: -100, // Negative cost
      };

      await request(app.getHttpServer())
        .post('/admin/privileges')
        .send(createPrivilegeDto)
        .expect(400);
    });
  });

  describe('GET /admin/privileges', () => {
    it('should get privileges with pagination', async () => {
      privilegeService.getPrivileges.mockResolvedValue(mockPrivilegesResult);

      const response = await request(app.getHttpServer())
        .get('/admin/privileges?page=1&limit=10&isActive=true')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          {
            id: mockPrivilege.id,
            name: mockPrivilege.name,
            description: mockPrivilege.description,
            pointCost: mockPrivilege.pointCost,
            isActive: mockPrivilege.isActive,
            validityDays: mockPrivilege.validityDays,
          },
        ],
        message: 'Privileges retrieved successfully',
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

      expect(privilegeService.getPrivileges).toHaveBeenCalledWith(
        {
          name: undefined,
          isActive: true,
          search: undefined,
        },
        {
          page: 1,
          limit: 10,
        }
      );
    });
  });

  describe('GET /admin/privileges/:id', () => {
    it('should get privilege by id', async () => {
      privilegeService.getPrivilegeById.mockResolvedValue(mockPrivilege);

      const response = await request(app.getHttpServer())
        .get(`/admin/privileges/${mockPrivilege.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockPrivilege.id,
          name: mockPrivilege.name,
          description: mockPrivilege.description,
          pointCost: mockPrivilege.pointCost,
          isActive: mockPrivilege.isActive,
          validityDays: mockPrivilege.validityDays,
        },
        message: 'Privilege retrieved successfully',
      });

      expect(privilegeService.getPrivilegeById).toHaveBeenCalledWith(mockPrivilege.id);
    });
  });

  describe('PUT /admin/privileges/:id', () => {
    it('should update privilege', async () => {
      const updatePrivilegeDto = {
        name: 'Updated Premium Access',
        pointCost: 150,
      };

      const updatedPrivilege = new Privilege({
        id: mockPrivilege.id,
        name: updatePrivilegeDto.name,
        description: mockPrivilege.description,
        pointCost: updatePrivilegeDto.pointCost,
        isActive: mockPrivilege.isActive,
        validityDays: mockPrivilege.validityDays,
        createdAt: mockPrivilege.createdAt,
        updatedAt: new Date(),
      });

      privilegeService.updatePrivilege.mockResolvedValue(updatedPrivilege);

      const response = await request(app.getHttpServer())
        .put(`/admin/privileges/${mockPrivilege.id}`)
        .send(updatePrivilegeDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockPrivilege.id,
          name: updatePrivilegeDto.name,
          pointCost: updatePrivilegeDto.pointCost,
        },
        message: 'Privilege updated successfully',
      });

      expect(privilegeService.updatePrivilege).toHaveBeenCalledWith(
        mockPrivilege.id,
        {
          name: updatePrivilegeDto.name,
          description: undefined,
          pointCost: updatePrivilegeDto.pointCost,
          validityDays: undefined,
          isActive: undefined,
        }
      );
    });
  });

  describe('PUT /admin/privileges/:id/activate', () => {
    it('should activate privilege', async () => {
      const activatedPrivilege = new Privilege({
        id: mockPrivilege.id,
        name: mockPrivilege.name,
        description: mockPrivilege.description,
        pointCost: mockPrivilege.pointCost,
        isActive: true,
        validityDays: mockPrivilege.validityDays,
        createdAt: mockPrivilege.createdAt,
        updatedAt: new Date(),
      });

      privilegeService.activatePrivilege.mockResolvedValue(activatedPrivilege);

      const response = await request(app.getHttpServer())
        .put(`/admin/privileges/${mockPrivilege.id}/activate`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockPrivilege.id,
          isActive: true,
        },
        message: 'Privilege activated successfully',
      });

      expect(privilegeService.activatePrivilege).toHaveBeenCalledWith(mockPrivilege.id);
    });
  });

  describe('PUT /admin/privileges/:id/deactivate', () => {
    it('should deactivate privilege', async () => {
      const deactivatedPrivilege = new Privilege({
        id: mockPrivilege.id,
        name: mockPrivilege.name,
        description: mockPrivilege.description,
        pointCost: mockPrivilege.pointCost,
        isActive: false,
        validityDays: mockPrivilege.validityDays,
        createdAt: mockPrivilege.createdAt,
        updatedAt: new Date(),
      });

      privilegeService.deactivatePrivilege.mockResolvedValue(deactivatedPrivilege);

      const response = await request(app.getHttpServer())
        .put(`/admin/privileges/${mockPrivilege.id}/deactivate`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockPrivilege.id,
          isActive: false,
        },
        message: 'Privilege deactivated successfully',
      });

      expect(privilegeService.deactivatePrivilege).toHaveBeenCalledWith(mockPrivilege.id);
    });
  });

  describe('DELETE /admin/privileges/:id', () => {
    it('should delete privilege', async () => {
      privilegeService.deletePrivilege.mockResolvedValue();

      await request(app.getHttpServer())
        .delete(`/admin/privileges/${mockPrivilege.id}`)
        .expect(204);

      expect(privilegeService.deletePrivilege).toHaveBeenCalledWith(mockPrivilege.id);
    });
  });
});