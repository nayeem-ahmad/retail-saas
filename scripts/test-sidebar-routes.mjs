// Sidebar route tester — corrected localStorage keys, proper error detection
// Usage: node scripts/test-sidebar-routes.mjs

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const API  = 'http://localhost:4000';

const ROUTES = [
    { path: '/dashboard',                              label: 'Dashboard' },
    { path: '/dashboard/pos',                          label: 'POS' },
    { path: '/dashboard/sales',                        label: 'Sales' },
    { path: '/dashboard/returns',                      label: 'Sales Returns' },
    { path: '/dashboard/orders',                       label: 'Sales Orders' },
    { path: '/dashboard/quotes',                       label: 'Sales Quotations' },
    { path: '/dashboard/warranty-claims',              label: 'Warranty Claims' },
    { path: '/dashboard/cashier-sessions',             label: 'Cashier Sessions' },
    { path: '/dashboard/loyalty',                      label: 'Loyalty Points' },
    { path: '/dashboard/delivery',                     label: 'Delivery' },
    { path: '/dashboard/manufacturing',                label: 'Manufacturing' },
    { path: '/dashboard/purchases',                    label: 'Purchases' },
    { path: '/dashboard/purchase-returns',             label: 'Purchase Returns' },
    { path: '/dashboard/accounting',                   label: 'Accounting Overview' },
    { path: '/dashboard/accounting/vouchers',          label: 'Voucher Entry' },
    { path: '/dashboard/accounting/journal',           label: 'Journal' },
    { path: '/dashboard/accounting/ledger',            label: 'Accounting Ledger' },
    { path: '/dashboard/accounting/reconciliation',    label: 'Posting Exceptions' },
    { path: '/dashboard/inventory',                    label: 'Inventory Products' },
    { path: '/dashboard/inventory/transfers',          label: 'Transfers' },
    { path: '/dashboard/inventory/shrinkage',          label: 'Shrinkage' },
    { path: '/dashboard/inventory/stock-takes',        label: 'Stock Takes' },
    { path: '/dashboard/inventory/ledger',             label: 'Stock Ledger' },
    { path: '/dashboard/inventory/labels',             label: 'Print Labels' },
    { path: '/dashboard/sales/reports/summary',        label: 'Sales Summary' },
    { path: '/dashboard/sales/reports/products',       label: 'Sales by Product' },
    { path: '/dashboard/reports/consolidated',         label: 'Consolidated Report' },
    { path: '/dashboard/inventory/reports/reorder',    label: 'Reorder Report' },
    { path: '/dashboard/inventory/reports/shrinkage',  label: 'Shrinkage Report' },
    { path: '/dashboard/inventory/reports/valuation',  label: 'Valuation Report' },
    { path: '/dashboard/storefront',                   label: 'Storefront Orders' },
    { path: '/dashboard/storefront/settings',          label: 'Storefront Settings' },
    { path: '/dashboard/billing',                      label: 'Billing' },
    { path: '/dashboard/settings',                     label: 'Account Settings' },
    { path: '/dashboard/admin/tenants',                label: 'Platform Admin' },
    { path: '/dashboard/customers',                    label: 'Customers' },
    { path: '/dashboard/customer-groups',              label: 'Customer Groups' },
    { path: '/dashboard/territories',                  label: 'Territories' },
    { path: '/dashboard/inventory/categories',         label: 'Categories' },
    { path: '/dashboard/inventory/settings',           label: 'Inventory Settings' },
    { path: '/dashboard/accounting/coa',               label: 'Chart of Accounts' },
    { path: '/dashboard/accounting/posting-rules',     label: 'Posting Rules' },
    { path: '/dashboard/settings/branding',            label: 'Branding' },
    { path: '/dashboard/settings/tax',                 label: 'Tax / VAT' },
    { path: '/dashboard/settings/loyalty',             label: 'Loyalty Program' },
    { path: '/dashboard/settings/sms',                 label: 'SMS Notifications' },
    { path: '/dashboard/settings/reports',             label: 'Report Emails' },
    { path: '/dashboard/settings/discount-codes',      label: 'Discount Codes' },
    { path: '/dashboard/help',                         label: 'Help' },
];

const CRASH_PATTERNS = [
    /application error/i,
    /something went wrong/i,
    /unhandled runtime error/i,
    /chunk load error/i,
    /hydration failed/i,
];

const CONSOLE_IGNORE = [
    /sentry/i, /favicon/i, /webpack/i, /hot.*update/i, /DevTools/i,
    /supabase.*realtime/i, /ExperimentalWarning/i, /DeprecationWarning/i,
    /Download the React DevTools/i, /ResizeObserver loop/i, /instrumentation/i,
    /themeColor/i, /401/, /403/, /429/, /icon-192/, /Failed to load resource/,
];

async function login() {
    const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nayeem.ahmad@gmail.com', password: 'password123' }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const body = await res.json();
    const d = body.data;
    return {
        token:    d.access_token,
        tenantId: d.tenants[0].id,
        storeId:  d.tenants[0].stores[0].id,
        planCode: d.tenants[0].subscription?.plan?.code ?? 'PREMIUM',
    };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
    console.log('Logging in...');
    const { token, tenantId, storeId, planCode } = await login();
    console.log(`✓ Logged in — tenant: ${tenantId}  plan: ${planCode}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page    = await context.newPage();

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, tenantId, storeId, planCode }) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('tenant_id', tenantId);
        localStorage.setItem('store_id', storeId);
        localStorage.setItem('subscription_plan_code', planCode);
    }, { token, tenantId, storeId, planCode });

    const results = [];

    for (const route of ROUTES) {
        const consoleErrors = [];
        const serverErrors  = [];

        const onConsole = (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (!CONSOLE_IGNORE.some(p => p.test(text))) {
                    consoleErrors.push(text.substring(0, 200));
                }
            }
        };
        const onResponse = (response) => {
            const url = response.url();
            const status = response.status();
            if (url.includes('localhost:4000') && status >= 500) {
                serverErrors.push(`${status} ${response.request().method()} ${url.replace(/.*api\/v1/, '/api/v1')}`);
            }
        };

        page.on('console', onConsole);
        page.on('response', onResponse);

        let timedOut = false;
        let navError = null;
        try {
            await page.goto(`${BASE}${route.path}`, { waitUntil: 'load', timeout: 60000 });
            // Give client-side JS time to render
            await sleep(800);
        } catch (e) {
            if (/timeout/i.test(e.message)) timedOut = true;
            else navError = e.message.substring(0, 100);
        }

        page.off('console', onConsole);
        page.off('response', onResponse);

        const finalUrl  = page.url();
        const redirected = finalUrl.includes('/login') || (finalUrl.includes('/auth') && !finalUrl.includes('/dashboard'));

        let crashes = [];
        try {
            const bodyText = await page.locator('body').innerText({ timeout: 3000 });
            crashes = CRASH_PATTERNS.filter(p => p.test(bodyText));
        } catch {}

        let errorDialog = false;
        try {
            errorDialog = await page.locator('[data-nextjs-dialog-header]').isVisible({ timeout: 800 });
        } catch {}

        const issues = [
            ...(redirected ? [`auth broken — redirected to ${finalUrl}`] : []),
            ...(timedOut   ? ['page load timed out (>60s)'] : []),
            ...(navError   ? [`navigation error: ${navError}`] : []),
            ...crashes.map(p => `crash: ${p}`),
            ...(errorDialog ? ['Next.js error dialog'] : []),
            ...serverErrors.map(e => `server 5xx: ${e}`),
            ...consoleErrors.slice(0, 2).map(e => `JS error: ${e}`),
        ];

        const ok  = issues.length === 0;
        const sym = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
        console.log(`${sym} ${route.label.padEnd(34)} ${route.path}`);
        for (const issue of issues) console.log(`    └─ ${issue}`);

        results.push({ ...route, issues });
        await sleep(400);
    }

    await browser.close();

    const passed = results.filter(r => r.issues.length === 0);
    const failed = results.filter(r => r.issues.length > 0);

    console.log(`\n${'─'.repeat(65)}`);
    console.log(`Total: ${results.length}   \x1b[32m✓ ${passed.length} passed\x1b[0m   \x1b[31m✗ ${failed.length} failed\x1b[0m`);

    if (failed.length > 0) {
        console.log('\nFailed routes:');
        for (const r of failed) {
            console.log(`  • ${r.label.padEnd(34)} ${r.path}`);
            for (const i of r.issues) console.log(`      └─ ${i}`);
        }
        process.exit(1);
    }
}

run();
