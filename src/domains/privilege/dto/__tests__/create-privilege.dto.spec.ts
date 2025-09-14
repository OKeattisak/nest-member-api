import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreatePrivilegeDto } from '../create-privilege.dto';

describe('CreatePrivilegeDto', () => {
  it('should pass validation with valid data', async () => {
    const validData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge and priority support',
      pointCost: 500.00,
      validityDays: 30,
      isActive: true,
    };

    const dto = plainToClass(CreatePrivilegeDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation without optional fields', async () => {
    const validData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge and priority support',
      pointCost: 500.00,
    };

    const dto = plainToClass(CreatePrivilegeDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.isActive).toBe(true); // default value
  });

  it('should fail validation with empty name', async () => {
    const invalidData = {
      name: '',
      description: 'Access to VIP lounge',
      pointCost: 500.00,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('name');
  });

  it('should fail validation with name exceeding maximum length', async () => {
    const invalidData = {
      name: 'a'.repeat(201),
      description: 'Access to VIP lounge',
      pointCost: 500.00,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('name');
  });

  it('should fail validation with empty description', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: '',
      pointCost: 500.00,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('description');
  });

  it('should fail validation with description exceeding maximum length', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: 'a'.repeat(1001),
      pointCost: 500.00,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('description');
  });

  it('should fail validation with negative point cost', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge',
      pointCost: -100,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('pointCost');
  });

  it('should fail validation with zero point cost', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge',
      pointCost: 0,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('pointCost');
  });

  it('should fail validation with point cost exceeding maximum', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge',
      pointCost: 1000000,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('pointCost');
  });

  it('should fail validation with validity days less than 1', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge',
      pointCost: 500.00,
      validityDays: 0,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('validityDays');
  });

  it('should fail validation with validity days exceeding maximum', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge',
      pointCost: 500.00,
      validityDays: 3651,
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('validityDays');
  });

  it('should fail validation with non-boolean isActive', async () => {
    const invalidData = {
      name: 'VIP Access',
      description: 'Access to VIP lounge',
      pointCost: 500.00,
      isActive: 'true',
    };

    const dto = plainToClass(CreatePrivilegeDto, invalidData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('isActive');
  });

  it('should transform string point cost to number', () => {
    const data = {
      name: 'VIP Access',
      description: 'Access to VIP lounge',
      pointCost: '500.00',
    };

    const dto = plainToClass(CreatePrivilegeDto, data);
    expect(typeof dto.pointCost).toBe('number');
    expect(dto.pointCost).toBe(500.00);
  });

  it('should trim whitespace from name and description', () => {
    const data = {
      name: '  VIP Access  ',
      description: '  Access to VIP lounge  ',
      pointCost: 500.00,
    };

    const dto = plainToClass(CreatePrivilegeDto, data);
    expect(dto.name).toBe('VIP Access');
    expect(dto.description).toBe('Access to VIP lounge');
  });
});