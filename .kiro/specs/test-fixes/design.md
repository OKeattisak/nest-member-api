# Design Document

## Overview

The test suite failures are caused by three distinct technical issues that require targeted solutions:

1. **Database Constraint Violations**: The test cleanup process violates foreign key constraints because it attempts to delete parent records before child records
2. **TypeScript Mock Typing Issues**: Unit tests fail to compile because Prisma client methods are not properly mocked with Jest-compatible types
3. **Integration Test Data Issues**: Integration tests fail because test data is not properly seeded or persisted between test operations

This design addresses each issue with specific technical solutions while maintaining test isolation and reliability.

## Architecture

### Database Cleanup Strategy

The current cleanup order in `test-database.setup.ts` is correct in theory but fails due to timing and transaction issues. The solution involves:

- **Cascade Deletion Approach**: Modify the cleanup to handle foreign key constraints properly
- **Transaction Isolation**: Ensure cleanup operations are properly isolated
- **Dependency-Aware Ordering**: Maintain strict deletion order based on schema relationships

### Mock Type System

The unit test mocking system needs to bridge Jest mocking capabilities with Prisma's complex type system:

- **Type-Safe Mock Factory**: Create utility functions that properly type Prisma method mocks
- **Generic Mock Helpers**: Implement reusable mock creators for common Prisma operations
- **Compilation Compatibility**: Ensure TypeScript compiler accepts the mock implementations

### Test Data Management

Integration tests require reliable data seeding and persistence:

- **Atomic Test Operations**: Ensure test data creation and cleanup are atomic
- **Relationship Integrity**: Maintain proper foreign key relationships in test data
- **Isolation Guarantees**: Prevent test data from interfering between test cases

## Components and Interfaces

### 1. Enhanced Database Cleanup Component

**Location**: `src/domains/common/test-utils/test-database.setup.ts`

**Responsibilities**:
- Execute database cleanup in dependency-safe order
- Handle foreign key constraint violations gracefully
- Provide transaction-safe cleanup operations

**Key Methods**:
```typescript
async function cleanupDatabase(prisma: PrismaService): Promise<void>
async function cleanupWithRetry(prisma: PrismaService, maxRetries: number): Promise<void>
```

### 2. Prisma Mock Factory Component

**Location**: `src/domains/common/test-utils/prisma-mock.factory.ts` (new file)

**Responsibilities**:
- Provide type-safe mock implementations for Prisma client methods
- Create reusable mock patterns for common operations
- Maintain compatibility with Jest mocking system

**Key Interfaces**:
```typescript
interface PrismaMockFactory {
  createMockPrismaService(): MockPrismaService;
  mockMethod<T>(method: any, returnValue: T): void;
}

type MockPrismaService = {
  [K in keyof PrismaService]: jest.MockedFunction<PrismaService[K]>;
}
```

### 3. Test Data Seeding Component

**Location**: `src/domains/common/test-utils/test-data.factory.ts` (new file)

**Responsibilities**:
- Create consistent test data with proper relationships
- Ensure foreign key constraints are satisfied
- Provide cleanup-safe test data creation

**Key Methods**:
```typescript
async function createTestMemberWithRelations(prisma: PrismaService, options?: TestMemberOptions): Promise<TestMemberData>
async function createTestPrivilegeWithRelations(prisma: PrismaService, options?: TestPrivilegeOptions): Promise<TestPrivilegeData>
```

## Data Models

### Test Data Structures

```typescript
interface TestMemberData {
  member: Member;
  points: Point[];
  privileges: MemberPrivilege[];
}

interface TestPrivilegeData {
  privilege: Privilege;
  memberPrivileges: MemberPrivilege[];
}

interface TestCleanupOrder {
  tables: string[];
  dependencies: Record<string, string[]>;
}
```

### Mock Configuration

```typescript
interface MockConfiguration {
  returnValues: Record<string, any>;
  callCounts: Record<string, number>;
  implementations: Record<string, Function>;
}
```

## Error Handling

### Database Constraint Violations

- **Retry Logic**: Implement exponential backoff for constraint violation retries
- **Dependency Resolution**: Automatically resolve deletion order based on schema analysis
- **Graceful Degradation**: Continue cleanup even if some operations fail

### Mock Type Errors

- **Runtime Type Checking**: Validate mock return types match expected Prisma types
- **Compilation Fallbacks**: Provide type assertion fallbacks for complex Prisma types
- **Error Reporting**: Clear error messages for mock configuration issues

### Test Data Integrity

- **Relationship Validation**: Verify all foreign key relationships before test execution
- **Cleanup Verification**: Ensure test data is properly cleaned up after each test
- **Isolation Checks**: Detect and prevent test data leakage between tests

## Testing Strategy

### Unit Test Fixes

1. **Mock Factory Integration**: Replace direct mock assignments with factory-created mocks
2. **Type Safety Verification**: Ensure all mocks maintain proper TypeScript types
3. **Compilation Testing**: Verify all unit tests compile without TypeScript errors

### Integration Test Fixes

1. **Data Seeding Reliability**: Ensure test data is consistently created and available
2. **Cleanup Verification**: Verify database cleanup works without constraint violations
3. **Assertion Accuracy**: Fix test assertions to match actual data behavior

### End-to-End Validation

1. **Full Suite Execution**: Run complete test suite to verify all fixes work together
2. **Performance Monitoring**: Ensure fixes don't significantly impact test execution time
3. **Regression Prevention**: Add safeguards to prevent similar issues in the future

## Implementation Approach

### Phase 1: Database Cleanup Fix
- Analyze foreign key dependencies in schema
- Implement proper deletion order with constraint handling
- Add retry logic for transient constraint violations

### Phase 2: Mock Type System
- Create type-safe mock factory utilities
- Update all unit tests to use new mock system
- Verify TypeScript compilation success

### Phase 3: Integration Test Data
- Fix test data seeding to ensure proper relationships
- Update test assertions to match corrected data behavior
- Verify all integration tests pass

### Phase 4: Validation and Cleanup
- Run full test suite to verify all fixes
- Optimize test execution performance
- Document new testing patterns and utilities