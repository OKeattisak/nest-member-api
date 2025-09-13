# Prisma Mock Factory Utilities

This directory contains utilities for creating type-safe mocks of Prisma client methods in unit tests. These utilities solve the TypeScript compilation errors that occur when trying to mock Prisma client methods directly.

## Problem Solved

Previously, unit tests would fail with TypeScript errors like:
```
Property 'mockResolvedValue' does not exist on type 'Prisma__MemberClient<...>'
```

This happened because Prisma client methods return complex Prisma client types that don't have Jest mock methods.

## Solution

The mock factory provides:
1. **Type-safe mock interfaces** for all Prisma model delegates
2. **Reusable mock patterns** for common database operations
3. **Helper methods** for setting up and managing mocks
4. **Mock data factories** for creating consistent test data

## Files

- `prisma-mock.factory.ts` - Core mock factory and type definitions
- `prisma-mock.patterns.ts` - Reusable mock patterns and data factories
- `index.ts` - Exports all utilities for easy importing
- `prisma-mock.example.spec.ts` - Example usage (can be deleted after implementation)
- `README.md` - This documentation

## Basic Usage

### 1. Import the utilities

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { 
  createMockPrismaService, 
  MockPrismaService, 
  PrismaMockPatterns 
} from '../common/test-utils';
```

### 2. Set up the mock in your test

```typescript
describe('YourRepository Unit Tests', () => {
  let repository: YourRepository;
  let mockPrismaService: MockPrismaService;

  beforeEach(async () => {
    // Create mock PrismaService
    mockPrismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<YourRepository>(YourRepository);
  });

  afterEach(() => {
    // Clear mocks after each test
    PrismaMockPatterns.clearAllMocks(mockPrismaService);
  });
});
```

### 3. Use mock patterns in your tests

```typescript
it('should find member by id', async () => {
  // Create mock data
  const mockMember = PrismaMockPatterns.createMockMember({
    id: 'test-id',
    email: 'test@example.com',
  });

  // Set up the mock
  PrismaMockPatterns.mockFindUnique(mockPrismaService, 'member', mockMember);

  // Test your repository method
  const result = await repository.findById('test-id');

  // Assertions
  expect(result).toEqual(mockMember);
  expect(mockPrismaService.member.findUnique).toHaveBeenCalledWith({
    where: { id: 'test-id' },
  });
});
```

## Advanced Usage

### Setting up complete CRUD mocks

```typescript
it('should handle all CRUD operations', () => {
  // Set up all CRUD mocks at once
  const { mockMember, mockMembers } = PrismaMockPatterns.setupMemberCrudMocks(mockPrismaService);

  // All CRUD operations are now mocked:
  // - findUnique, findMany, create, update, delete, count
  
  expect(mockMember).toBeDefined();
  expect(mockMembers).toHaveLength(1);
});
```

### Mocking errors

```typescript
it('should handle database errors', async () => {
  const error = new Error('Database connection failed');
  
  // Mock an error
  PrismaMockPatterns.mockError(mockPrismaService, 'member', 'findUnique', error);

  // Test error handling
  await expect(repository.findById('test-id')).rejects.toThrow('Database connection failed');
});
```

### Custom mock data

```typescript
it('should work with custom mock data', async () => {
  // Create custom mock data
  const customMember = PrismaMockPatterns.createMockMember({
    id: 'custom-id',
    email: 'custom@example.com',
    firstName: 'Custom',
    lastName: 'User',
    isActive: false,
  });

  PrismaMockPatterns.mockFindUnique(mockPrismaService, 'member', customMember);

  const result = await repository.findById('custom-id');
  expect(result.isActive).toBe(false);
});
```

## Available Mock Patterns

### Data Factories
- `PrismaMockPatterns.createMockMember(overrides?)`
- `PrismaMockPatterns.createMockPoint(overrides?)`
- `PrismaMockPatterns.createMockPrivilege(overrides?)`
- `PrismaMockPatterns.createMockMemberPrivilege(overrides?)`
- `PrismaMockPatterns.createMockAdmin(overrides?)`

### Operation Mocks
- `PrismaMockPatterns.mockFindUnique(mockService, model, result)`
- `PrismaMockPatterns.mockFindMany(mockService, model, results)`
- `PrismaMockPatterns.mockCreate(mockService, model, result)`
- `PrismaMockPatterns.mockUpdate(mockService, model, result)`
- `PrismaMockPatterns.mockDelete(mockService, model, result)`
- `PrismaMockPatterns.mockCount(mockService, model, count)`
- `PrismaMockPatterns.mockAggregate(mockService, model, result)`

### CRUD Setup Helpers
- `PrismaMockPatterns.setupMemberCrudMocks(mockService)`
- `PrismaMockPatterns.setupPointCrudMocks(mockService)`
- `PrismaMockPatterns.setupPrivilegeCrudMocks(mockService)`
- `PrismaMockPatterns.setupMemberPrivilegeCrudMocks(mockService)`

### Mock Management
- `PrismaMockPatterns.resetAllMocks(mockService)` - Reset implementations and call history
- `PrismaMockPatterns.clearAllMocks(mockService)` - Clear call history only
- `PrismaMockPatterns.mockError(mockService, model, method, error)` - Mock errors

## Migration Guide

### Before (with TypeScript errors)
```typescript
const mockPrismaService = {
  member: {
    findUnique: jest.fn(),
    create: jest.fn(),
    // ... other methods
  },
} as any;

// This would cause TypeScript errors:
prismaService.member.findUnique.mockResolvedValue(mockMember as any);
```

### After (type-safe)
```typescript
const mockPrismaService = createMockPrismaService();

// This works without TypeScript errors:
PrismaMockPatterns.mockFindUnique(mockPrismaService, 'member', mockMember);
```

## Best Practices

1. **Use the factory**: Always use `createMockPrismaService()` instead of manual mock objects
2. **Use patterns**: Prefer `PrismaMockPatterns` methods over direct mock manipulation
3. **Clear mocks**: Always clear mocks in `afterEach` to prevent test interference
4. **Custom data**: Use the data factory methods with overrides for consistent test data
5. **Error testing**: Use `mockError` to test error scenarios
6. **CRUD helpers**: Use the CRUD setup helpers for comprehensive repository testing

## Type Safety

All mock utilities are fully typed and provide:
- IntelliSense support for all Prisma operations
- Type checking for mock data structures
- Compile-time verification of mock setups
- No need for `as any` type assertions

This ensures that your tests are both reliable and maintainable.