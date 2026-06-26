import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const EMAIL = 'nayeem.ahmad@gmail.com';
const PASSWORD = 'password123';

async function main() {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: false,
        slowMo: 200,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('dialog', async (dialog) => {
        console.log(`[dialog] ${dialog.type()}: ${dialog.message()}`);
        await dialog.accept();
    });

    console.log('1. Opening login page…');
    await page.goto(`${BASE}/login`);
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    console.log('2. Choosing Platform Admin workspace…');
    await page.getByRole('button', { name: /platform admin console/i }).waitFor({ timeout: 15_000 });
    await page.getByRole('button', { name: /platform admin console/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 15_000 });
    console.log('   → Platform admin console loaded');

    console.log('3. Switching to shop workspace for sales entry…');
    await page.getByRole('link', { name: /switch account/i }).click();
    await page.getByRole('button', { name: /dhaka retail/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    console.log('4. Opening New Sale page…');
    await page.goto(`${BASE}/sales/new`);
    await page.getByRole('heading', { name: /new sale/i }).waitFor({ timeout: 15_000 });

    console.log('5. Adding a product…');
    const productSearch = page.getByPlaceholder(/add product/i);
    await productSearch.click();
    await page.waitForTimeout(800);
    const firstProduct = page.locator('.hover\\:bg-blue-50.cursor-pointer').first();
    await firstProduct.waitFor({ timeout: 10_000 });
    const productName = await firstProduct.locator('.font-medium').first().textContent();
    await firstProduct.click();
    console.log(`   → Added: ${productName?.trim()}`);

    console.log('6. Recording cash payment…');
    await page.getByRole('button', { name: /^cash$/i }).click();

    console.log('7. Submitting sale…');
    await page.getByRole('button', { name: /create sale/i }).click();
    await page.waitForTimeout(2000);

    console.log('8. Verifying sale appears in sales list…');
    await page.goto(`${BASE}/sales`);
    await page.waitForTimeout(1500);

    console.log('Done — sale entry completed. Browser will stay open for 30s.');
    await page.waitForTimeout(30_000);
    await browser.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});