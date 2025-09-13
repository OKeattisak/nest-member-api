import { configValidationSchema } from './config.validation';

describe('Config Validation', () => {
    it('should validate valid configuration', () => {
        const validConfig = {
            NODE_ENV: 'development',
            PORT: '3000',
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            JWT_SECRET: 'this-is-a-very-long-jwt-secret-key-for-testing-purposes',
            ADMIN_JWT_SECRET: 'this-is-a-very-long-admin-jwt-secret-key-for-testing',
            JWT_EXPIRES_IN: '24h',
            ADMIN_JWT_EXPIRES_IN: '8h',
            BCRYPT_ROUNDS: '12',
            POINT_EXPIRATION_DAYS: '365',
        };

        const result = configValidationSchema.parse(validConfig);

        expect(result.NODE_ENV).toBe('development');
        expect(result.PORT).toBe(3000);
        expect(result.BCRYPT_ROUNDS).toBe(12);
        expect(result.POINT_EXPIRATION_DAYS).toBe(365);
    });

    it('should apply default values', () => {
        const minimalConfig = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            JWT_SECRET: 'this-is-a-very-long-jwt-secret-key-for-testing-purposes',
            ADMIN_JWT_SECRET: 'this-is-a-very-long-admin-jwt-secret-key-for-testing',
        };

        const result = configValidationSchema.parse(minimalConfig);

        expect(result.NODE_ENV).toBe('development');
        expect(result.PORT).toBe(3000);
        expect(result.JWT_EXPIRES_IN).toBe('24h');
        expect(result.ADMIN_JWT_EXPIRES_IN).toBe('8h');
        expect(result.BCRYPT_ROUNDS).toBe(12);
        expect(result.POINT_EXPIRATION_DAYS).toBe(365);
    });

    it('should reject invalid JWT secret (too short)', () => {
        const invalidConfig = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            JWT_SECRET: 'short',
            ADMIN_JWT_SECRET: 'this-is-a-very-long-admin-jwt-secret-key-for-testing',
        };

        expect(() => configValidationSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject invalid BCRYPT_ROUNDS (out of range)', () => {
        const invalidConfig = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            JWT_SECRET: 'this-is-a-very-long-jwt-secret-key-for-testing-purposes',
            ADMIN_JWT_SECRET: 'this-is-a-very-long-admin-jwt-secret-key-for-testing',
            BCRYPT_ROUNDS: '5', // Too low
        };

        expect(() => configValidationSchema.parse(invalidConfig)).toThrow();
    });
});