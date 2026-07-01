import { defineConfig, devices } from '@playwright/test';

/**
 * Accounting E2E config — demo tenant auth via accounting-global-setup (cached session).
 */
export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/accounting-global-setup.ts',
    testMatch: 'accounting.spec.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 2,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report-accounting', open: 'never' }],
    ],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        navigationTimeout: 60_000,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});