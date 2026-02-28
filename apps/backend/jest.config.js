module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@retail-saas/database(|/.*)$': '<rootDir>/../../packages/database/$1',
        '^@retail-saas/shared-types(|/.*)$': '<rootDir>/../../packages/shared-types/$1',
    },
};
