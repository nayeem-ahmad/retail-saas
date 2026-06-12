import { test, expect } from '@playwright/test';

/**
 * Chained critical path: signup → dashboard → billing workspace.
 * POS sale is covered by pos.spec.ts; this spec links auth + billing navigation.
 */
test.describe('Critical launch path', () => {
    test('signup → verify-email pending → dashboard → billing page', async ({ page }) => {
        const timestamp = Date.now();
        const email = `critical-path-${timestamp}@example.com`;

        await page.goto('/signup');
        await page.getByLabel(/name/i).fill('Critical Path User');
        await page.getByLabel(/email/i).fill(email);
        await page.getByLabel(/password/i).fill('SecurePassword123!');
        await page.getByLabel(/store|shop/i).first().fill('Critical Store');
        await page.getByLabel(/workspace|tenant|business/i).first().fill('Critical Workspace');
        await page.getByRole('button', { name: /sign up|create account|register/i }).click();

        await expect(page).toHaveURL(/verify-email/, { timeout: 15_000 });
        await expect(page.getByText(/check your inbox/i)).toBeVisible();

        await page.getByRole('link', { name: /continue to dashboard/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });

        await page.goto('/dashboard/billing');
        await expect(page.getByText(/billing|subscription|plan/i).first()).toBeVisible({ timeout: 10_000 });
    });
});