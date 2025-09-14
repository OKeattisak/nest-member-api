import { setupTestEnvironment } from './utils/test-setup';

// Global setup for E2E tests
beforeAll(async () => {
  await setupTestEnvironment();
});

// Increase timeout for E2E tests
jest.setTimeout(30000);