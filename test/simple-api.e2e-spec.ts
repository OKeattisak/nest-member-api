import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Simple API Test (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have Swagger documentation available', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(response.body).toHaveProperty('openapi');
    expect(response.body).toHaveProperty('info');
    expect(response.body.info.title).toBe('Member Service System API');
  });

  it('should return 404 for non-existent routes', async () => {
    await request(app.getHttpServer())
      .get('/non-existent-route')
      .expect(404);
  });
});