# Test Documentation

This directory contains comprehensive test suites for the Member Service System API.

## Test Structure

### Unit Tests
Located in `src/**/*.spec.ts` files alongside the source code.
- Domain entity tests
- Service logic tests
- Utility function tests
- Guard and decorator tests

### Integration Tests
Located in `src/**/*.integration.spec.ts` files.
- Repository implementation tests
- Database operation tests
- Service integration tests

### End-to-End (E2E) Tests
Located in `test/**/*.e2e-spec.ts` files.
- Complete API workflow tests
- Authentication flow tests
- Business process tests

## Test Utilities

### Test Data Factory (`test/utils/test-data-factory.ts`)
Provides factory methods for creating test data:
- `TestDataFactory.createMemberData()` - Creates member test data
- `TestDataFactory.createAdminData()` - Creates admin test data
- `TestDataFactory.createPointData()` - Creates point transaction test data
- `TestDataFactory.createPrivilegeData()` - Creates privilege test data

### Database Test Utils (`test/utils/database-test-utils.ts`)
Provides database utilities for testing:
- `cleanDatabase()` - Cleans all test data
- `createTestMember()` - Creates a test member in database
- `createTestAdmin()` - Creates a test admin in database
- `createTestPoints()` - Creates test point transactions
- `createCompleteTestScenario()` - Creates a complete test scenario

### Test Setup (`test/utils/test-setup.ts`)
Provides application setup utilities:
- `createTestingApp()` - Creates a testing NestJS application
- `generateAdminToken()` - Generates valid admin JWT tokens
- `generateMemberToken()` - Generates valid member JWT tokens

### Mock Services (`test/mocks/mock-services.ts`)
Provides mock implementations for services:
- Mock member service
- Mock admin service
- Mock point service
- Mock privilege service
- Mock JWT service

## Running Tests

### Unit Tests
```bash
npm run test                    # Run all unit tests
npm run test:watch             # Run unit tests in watch mode
npm run test:cov               # Run unit tests with coverage
```

### E2E Tests
```bash
npm run test:e2e               # Run all E2E tests
npm run test:e2e:watch         # Run E2E tests in watch mode
npm run test:e2e:cov           # Run E2E tests with coverage
```

### Specific Test Suites
```bash
# Run specific test file
npm run test:e2e -- admin-auth.e2e-spec.ts

# Run tests matching pattern
npm run test:e2e -- --testNamePattern="Admin Authentication"

# Run with verbose output
npm run test:e2e -- --verbose
```

## Test Scenarios

### Authentication Tests
- **Admin Authentication** (`admin-auth.e2e-spec.ts`)
  - Admin login with valid credentials
  - Admin login with invalid credentials
  - JWT token validation
  - Role-based access control

- **Member Authentication** (`member-auth.e2e-spec.ts`)
  - Member registration
  - Member login
  - Profile management
  - Password changes

### Business Logic Tests
- **Point Management** (`member-point-management.e2e-spec.ts`)
  - Point addition and deduction
  - FIFO point expiration
  - Point balance calculations
  - Transaction history

- **Privilege Exchange** (`privilege-exchange.e2e-spec.ts`)
  - Privilege creation and management
  - Point-to-privilege exchange
  - Privilege expiration
  - Member privilege tracking

### Complete Workflows
- **Admin Workflow** (`admin-workflow.e2e-spec.ts`)
  - Complete admin management workflow
  - Bulk operations
  - Error handling scenarios
  - Data consistency validation

## Test Database

Tests use a separate test database to ensure isolation:
- Database URL: `TEST_DATABASE_URL` environment variable
- Automatic cleanup between tests
- Transaction rollback for isolation
- Seeded test data

## Test Configuration

### Jest Configuration
- **Unit Tests**: `jest.config.js`
- **E2E Tests**: `test/jest-e2e.json`

### Environment Variables
Required for testing:
```env
NODE_ENV=test
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_member_service
JWT_SECRET=test-jwt-secret
ADMIN_JWT_SECRET=test-admin-jwt-secret
MEMBER_JWT_SECRET=test-member-jwt-secret
```

## Best Practices

### Test Data Management
- Use factory methods for consistent test data
- Clean database between tests
- Use transactions for isolation when possible
- Avoid hardcoded IDs or timestamps

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test both success and failure scenarios

### Assertions
- Use specific matchers (`toEqual`, `toContain`, etc.)
- Test response structure and data
- Verify side effects (database changes, etc.)
- Check error messages and codes

### Performance
- Use `beforeAll` for expensive setup
- Use `beforeEach` for test isolation
- Run E2E tests with `--runInBand` for stability
- Mock external dependencies

## Coverage Reports

Test coverage reports are generated in the `coverage/` directory:
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- JSON format: `coverage/coverage-final.json`

## Continuous Integration

Tests are designed to run in CI environments:
- Database setup scripts
- Environment variable configuration
- Parallel test execution support
- Coverage reporting integration

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure test database is running
   - Check `TEST_DATABASE_URL` environment variable
   - Verify database permissions

2. **JWT Token Errors**
   - Check JWT secret configuration
   - Verify token generation in test setup
   - Ensure proper authorization headers

3. **Test Timeouts**
   - Increase timeout in jest configuration
   - Check for hanging database connections
   - Verify proper test cleanup

4. **Flaky Tests**
   - Use `--runInBand` for E2E tests
   - Ensure proper test isolation
   - Check for race conditions

### Debug Mode
Run tests in debug mode:
```bash
npm run test:debug
```

### Verbose Output
Get detailed test output:
```bash
npm run test:e2e -- --verbose
```