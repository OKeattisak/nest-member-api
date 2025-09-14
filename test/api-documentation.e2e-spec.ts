import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Documentation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same configuration as in main.ts for Swagger
    const { ValidationPipe } = await import('@nestjs/common');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Swagger Documentation', () => {
    it('should serve Swagger UI at /api/docs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);

      expect(response.text).toContain('Swagger UI');
      expect(response.text).toContain('Member Service System API');
    });

    it('should serve OpenAPI JSON specification', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Verify basic OpenAPI structure
      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('info');
      expect(spec).toHaveProperty('paths');
      expect(spec).toHaveProperty('components');

      // Verify API info
      expect(spec.info.title).toBe('Member Service System API');
      expect(spec.info.description).toContain('comprehensive member service system');
      expect(spec.info.version).toBe('1.0');

      // Verify security schemes
      expect(spec.components.securitySchemes).toHaveProperty('admin-auth');
      expect(spec.components.securitySchemes).toHaveProperty('member-auth');

      // Verify tags are present
      const tags = spec.tags.map((tag: any) => tag.name);
      expect(tags).toContain('Admin Auth');
      expect(tags).toContain('Admin Members');
      expect(tags).toContain('Member Auth');
      expect(tags).toContain('Member Profile');
      expect(tags).toContain('Member Points');
    });

    it('should document admin authentication endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Check admin login endpoint
      expect(spec.paths).toHaveProperty('/admin/auth/login');
      const adminLogin = spec.paths['/admin/auth/login'];
      expect(adminLogin).toHaveProperty('post');
      expect(adminLogin.post.tags).toContain('Admin Auth');
      expect(adminLogin.post.summary).toBe('Admin login');

      // Verify request body schema
      expect(adminLogin.post.requestBody).toBeDefined();
      expect(adminLogin.post.requestBody.content['application/json']).toBeDefined();

      // Verify response schemas
      expect(adminLogin.post.responses).toHaveProperty('200');
      expect(adminLogin.post.responses).toHaveProperty('401');
    });

    it('should document member authentication endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Check member registration endpoint
      expect(spec.paths).toHaveProperty('/member/auth/register');
      const memberRegister = spec.paths['/member/auth/register'];
      expect(memberRegister).toHaveProperty('post');
      expect(memberRegister.post.tags).toContain('Member Auth');
      expect(memberRegister.post.summary).toBe('Member registration');

      // Check member login endpoint
      expect(spec.paths).toHaveProperty('/member/auth/login');
      const memberLogin = spec.paths['/member/auth/login'];
      expect(memberLogin).toHaveProperty('post');
      expect(memberLogin.post.tags).toContain('Member Auth');
      expect(memberLogin.post.summary).toBe('Member login');
    });

    it('should document admin member management endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Check admin members endpoints
      expect(spec.paths).toHaveProperty('/admin/members');
      const adminMembers = spec.paths['/admin/members'];
      
      // GET /admin/members
      expect(adminMembers).toHaveProperty('get');
      expect(adminMembers.get.tags).toContain('Admin Members');
      expect(adminMembers.get.security).toContainEqual({ 'admin-auth': [] });

      // POST /admin/members
      expect(adminMembers).toHaveProperty('post');
      expect(adminMembers.post.tags).toContain('Admin Members');
      expect(adminMembers.post.security).toContainEqual({ 'admin-auth': [] });

      // Check individual member endpoint
      expect(spec.paths).toHaveProperty('/admin/members/{id}');
      const adminMemberById = spec.paths['/admin/members/{id}'];
      expect(adminMemberById).toHaveProperty('get');
      expect(adminMemberById.get.parameters).toContainEqual(
        expect.objectContaining({
          name: 'id',
          in: 'path',
          required: true
        })
      );
    });

    it('should document member profile endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Check member profile endpoints
      expect(spec.paths).toHaveProperty('/member/profile');
      const memberProfile = spec.paths['/member/profile'];
      
      // GET /member/profile
      expect(memberProfile).toHaveProperty('get');
      expect(memberProfile.get.tags).toContain('Member Profile');
      expect(memberProfile.get.security).toContainEqual({ 'member-auth': [] });
      expect(memberProfile.get.summary).toBe('Get member profile');

      // PUT /member/profile
      expect(memberProfile).toHaveProperty('put');
      expect(memberProfile.put.tags).toContain('Member Profile');
      expect(memberProfile.put.security).toContainEqual({ 'member-auth': [] });
      expect(memberProfile.put.summary).toBe('Update member profile');
    });

    it('should document member points endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Check member points balance endpoint
      expect(spec.paths).toHaveProperty('/member/points/balance');
      const pointsBalance = spec.paths['/member/points/balance'];
      expect(pointsBalance).toHaveProperty('get');
      expect(pointsBalance.get.tags).toContain('Member Points');
      expect(pointsBalance.get.security).toContainEqual({ 'member-auth': [] });

      // Check member points history endpoint
      expect(spec.paths).toHaveProperty('/member/points/history');
      const pointsHistory = spec.paths['/member/points/history'];
      expect(pointsHistory).toHaveProperty('get');
      expect(pointsHistory.get.tags).toContain('Member Points');
      expect(pointsHistory.get.security).toContainEqual({ 'member-auth': [] });

      // Verify query parameters for history endpoint
      const historyParams = pointsHistory.get.parameters;
      const paramNames = historyParams.map((p: any) => p.name);
      expect(paramNames).toContain('page');
      expect(paramNames).toContain('limit');
      expect(paramNames).toContain('type');
      expect(paramNames).toContain('startDate');
      expect(paramNames).toContain('endDate');
    });

    it('should include proper security definitions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Verify admin auth security scheme
      const adminAuth = spec.components.securitySchemes['admin-auth'];
      expect(adminAuth.type).toBe('http');
      expect(adminAuth.scheme).toBe('bearer');
      expect(adminAuth.bearerFormat).toBe('JWT');

      // Verify member auth security scheme
      const memberAuth = spec.components.securitySchemes['member-auth'];
      expect(memberAuth.type).toBe('http');
      expect(memberAuth.scheme).toBe('bearer');
      expect(memberAuth.bearerFormat).toBe('JWT');
    });

    it('should include proper response schemas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Check admin login response schema
      const adminLoginResponses = spec.paths['/admin/auth/login'].post.responses;
      
      // Success response
      expect(adminLoginResponses['200']).toBeDefined();
      const successResponse = adminLoginResponses['200'];
      expect(successResponse.description).toBe('Login successful');
      expect(successResponse.content['application/json'].schema).toBeDefined();

      // Error response
      expect(adminLoginResponses['401']).toBeDefined();
      const errorResponse = adminLoginResponses['401'];
      expect(errorResponse.description).toBe('Authentication failed');
    });

    it('should include request body examples', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Check admin login request body examples
      const adminLoginRequestBody = spec.paths['/admin/auth/login'].post.requestBody;
      expect(adminLoginRequestBody.content['application/json'].examples).toBeDefined();
      
      const example = adminLoginRequestBody.content['application/json'].examples.example1;
      expect(example.summary).toBe('Admin login example');
      expect(example.value).toHaveProperty('emailOrUsername');
      expect(example.value).toHaveProperty('password');
    });

    it('should validate OpenAPI specification format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;

      // Basic OpenAPI 3.0 validation
      expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/);
      expect(spec.info).toHaveProperty('title');
      expect(spec.info).toHaveProperty('version');
      expect(spec.paths).toBeDefined();
      expect(typeof spec.paths).toBe('object');

      // Verify all paths have valid HTTP methods
      Object.keys(spec.paths).forEach(path => {
        const pathItem = spec.paths[path];
        const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
        
        Object.keys(pathItem).forEach(method => {
          if (method !== 'parameters' && method !== 'summary' && method !== 'description') {
            expect(validMethods).toContain(method.toLowerCase());
          }
        });
      });
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent response format for successful requests', async () => {
      // This test would require actual endpoints to be working
      // For now, we'll just verify the documentation structure
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      
      // Verify that response schemas follow the standard format
      Object.keys(spec.paths).forEach(path => {
        const pathItem = spec.paths[path];
        Object.keys(pathItem).forEach(method => {
          if (typeof pathItem[method] === 'object' && pathItem[method].responses) {
            const responses = pathItem[method].responses;
            
            // Check success responses have proper structure
            Object.keys(responses).forEach(statusCode => {
              if (statusCode.startsWith('2')) { // 2xx success responses
                const response = responses[statusCode];
                if (response.content && response.content['application/json']) {
                  const schema = response.content['application/json'].schema;
                  if (schema && schema.properties) {
                    // Should have success property
                    expect(schema.properties).toHaveProperty('success');
                    // Should have data property for most endpoints
                    if (statusCode !== '204') {
                      expect(schema.properties).toHaveProperty('data');
                    }
                  }
                }
              }
            });
          }
        });
      });
    });
  });
});