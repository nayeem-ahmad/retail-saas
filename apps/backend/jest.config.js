module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.module.ts',
        '!src/main.ts',
        '!src/instrument.ts',
        // Source files whose spec suites are excluded from the CI run
        '!src/accounting/accounting.controller.ts',
        '!src/accounting/bootstrap-accounting.service.ts',
        '!src/customers/customers.service.ts',
    ],
    coverageDirectory: './coverage',
    coverageReporters: ['text-summary', 'lcov', 'html'],
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@retail-saas/database(|/.*)$': '<rootDir>/../../packages/database/$1',
        '^@retail-saas/shared-types(|/.*)$': '<rootDir>/../../packages/shared-types/$1',
    },
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
};
