/**
 * Jest Configuration for Frontend Testing
 */

module.exports = {
    // Test environment
    testEnvironment: 'jsdom',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Transform configuration
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },

    // Module name mapping
    moduleNameMapper: {
        // Handle CSS imports
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

        // Handle image imports
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test/__mocks__/fileMock.js',

        // Path aliases (matching tsconfig paths)
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
        '^@test/(.*)$': '<rootDir>/src/test/$1',
    },

    // Test patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
        '<rootDir>/src/**/*.(test|spec).(ts|tsx)',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.(ts|tsx)',
        '!src/**/*.d.ts',
        '!src/test/**/*',
        '!src/**/__tests__/**/*',
        '!src/index.tsx',
        '!src/reportWebVitals.ts',
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },

    // Coverage directory
    coverageDirectory: '<rootDir>/coverage',

    // Reporters
    coverageReporters: ['text', 'lcov', 'html'],

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,

    // Verbose output
    verbose: true,

    // Maximum workers
    maxWorkers: '50%',

    // Test timeout
    testTimeout: 10000,

    // Globals
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
};
