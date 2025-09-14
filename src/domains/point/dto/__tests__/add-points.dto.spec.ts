import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AddPointsDto } from '../add-points.dto';

describe('AddPointsDto', () => {
  it('should pass validation with valid data', async () => {
    const validData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.50,
      description: 'Bonus points for completing survey',
      expirationDays: 365,
    };

    const dto = plainToClass(AddPointsDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation without optional expirationDays', async () => {
    const validData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.50,
      description: 'Bonus points for completing survey',
    };

    const dto = plainToClass(AddPointsDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid UUID for memberId', async () => {
    const invalidData = {
      memberId: 'invalid-uuid',
      amount: 100.50,
      description: 'Bonus points',
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('memberId');
  });

  it('should fail validation with empty memberId', async () => {
    const invalidData = {
      memberId: '',
      amount: 100.50,
      description: 'Bonus points',
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('memberId');
  });

  it('should fail validation with negative amount', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: -10,
      description: 'Bonus points',
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('amount');
  });

  it('should fail validation with zero amount', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 0,
      description: 'Bonus points',
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('amount');
  });

  it('should fail validation with amount exceeding maximum', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 1000000,
      description: 'Bonus points',
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('amount');
  });

  it('should fail validation with more than 2 decimal places', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.123,
      description: 'Bonus points',
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('amount');
  });

  it('should fail validation with empty description', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.50,
      description: '',
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('description');
  });

  it('should fail validation with description exceeding maximum length', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.50,
      description: 'a'.repeat(501),
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('description');
  });

  it('should fail validation with expiration days less than 1', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.50,
      description: 'Bonus points',
      expirationDays: 0,
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('expirationDays');
  });

  it('should fail validation with expiration days exceeding maximum', async () => {
    const invalidData = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.50,
      description: 'Bonus points',
      expirationDays: 3651,
    };

    const dto = plainToClass(AddPointsDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('expirationDays');
  });

  it('should transform string amount to number', () => {
    const data = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: '100.50',
      description: 'Bonus points',
    };

    const dto = plainToClass(AddPointsDto, data);
    expect(typeof dto.amount).toBe('number');
    expect(dto.amount).toBe(100.50);
  });

  it('should trim whitespace from description', () => {
    const data = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100.50,
      description: '  Bonus points  ',
    };

    const dto = plainToClass(AddPointsDto, data);
    expect(dto.description).toBe('Bonus points');
  });
});