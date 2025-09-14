import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Controller, Post, Body } from '@nestjs/common';
import * as request from 'supertest';
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { CustomValidationPipe } from '../pipes/validation.pipe';

class TestValidationDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @Transform(({ value }) => value?.trim())
  name!: string;
}

@Controller('test-validation')
class TestValidationController {
  @Post()
  testValidation(@Body() dto: TestValidationDto) {
    return { success: true, data: dto };
  }
}

describe('Validation Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestValidationController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should accept valid data', async () => {
    const validData = {
      email: 'test@example.com',
      name: 'John Doe',
    };

    const response = await request(app.getHttpServer())
      .post('/test-validation')
      .send(validData)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: {
        email: 'test@example.com',
        name: 'John Doe',
      },
    });
  });

  it('should transform data correctly', async () => {
    const dataWithTransforms = {
      email: '  TEST@EXAMPLE.COM  ',
      name: '  John Doe  ',
    };

    const response = await request(app.getHttpServer())
      .post('/test-validation')
      .send(dataWithTransforms)
      .expect(201);

    expect(response.body.data.email).toBe('test@example.com');
    expect(response.body.data.name).toBe('John Doe');
  });

  it('should reject invalid data with proper error format', async () => {
    const invalidData = {
      email: 'invalid-email',
      name: 'Jo',
    };

    const response = await request(app.getHttpServer())
      .post('/test-validation')
      .send(invalidData)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          email: expect.arrayContaining([expect.any(String)]),
          name: expect.arrayContaining([expect.any(String)]),
        },
      },
    });
  });

  it('should reject data with extra properties', async () => {
    const dataWithExtra = {
      email: 'test@example.com',
      name: 'John Doe',
      extraProperty: 'should be removed',
    };

    const response = await request(app.getHttpServer())
      .post('/test-validation')
      .send(dataWithExtra)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject empty required fields', async () => {
    const emptyData = {
      email: '',
      name: '',
    };

    const response = await request(app.getHttpServer())
      .post('/test-validation')
      .send(emptyData)
      .expect(400);

    expect(response.body.error.details).toHaveProperty('email');
    expect(response.body.error.details).toHaveProperty('name');
  });
});