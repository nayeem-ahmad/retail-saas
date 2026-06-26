import { expect, type Page } from '@playwright/test';
import { E2E_API_URL, E2E_BASE_URL } from './auth';

export type DemoSession = {
    accessToken: string;
    tenantId: string;
    storeId: string;
    planCode?: string;
    email?: string;
};

let cachedDemoSession: DemoSession | null = null;

/**
 * Authenticate via POST /auth/demo (Demo Store tenant with STANDARD plan +
 * seeded products, customers, suppliers, and accounting).
 */
export async function fetchDemoSession(force = false): Promise<DemoSession> {
    if (!force && cachedDemoSession) return cachedDemoSession;

    const res = await fetch(`${E2E_API_URL}/api/v1/auth/demo`, { method: 'POST' });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(
            `Demo login failed (${res.status}). Seed the demo account first ` +
                `(npm run db:seed in packages/database). Response: ${body}`,
        );
    }

    const body = await res.json();
    const tenant = body.data?.tenants?.[0];
    const store = tenant?.stores?.[0];
    if (!body.data?.access_token || !tenant?.id || !store?.id) {
        throw new Error('Demo login response missing access_token, tenant, or store');
    }

    cachedDemoSession = {
        accessToken: body.data.access_token,
        tenantId: tenant.id,
        storeId: store.id,
        planCode: tenant.subscription?.plan?.code,
        email: body.data.user?.email,
    };
    return cachedDemoSession;
}

/** Inject demo session into browser localStorage (same keys as production client). */
export async function applyDemoSession(page: Page, session: DemoSession) {
    await page.goto(E2E_BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(
        ({ accessToken, tenantId, storeId, planCode }) => {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('tenant_id', tenantId);
            localStorage.setItem('store_id', storeId);
            localStorage.removeItem('active_context');
            localStorage.setItem('demo_session', '1');
            if (planCode) {
                localStorage.setItem('subscription_plan_code', planCode);
            }
        },
        session,
    );
}

export async function dismissDemoBannerIfPresent(page: Page) {
    const dismiss = page.getByRole('button', { name: /dismiss demo banner/i });
    if (await dismiss.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await dismiss.click();
    }
}

export function authHeaders(session: DemoSession): Record<string, string> {
    return {
        Authorization: `Bearer ${session.accessToken}`,
        'x-tenant-id': session.tenantId,
        'x-store-id': session.storeId,
        'Content-Type': 'application/json',
    };
}

/** Quick sanity check that the demo tenant has catalog data. */
export async function assertDemoCatalogReady(session: DemoSession) {
    const res = await fetch(`${E2E_API_URL}/api/v1/products?limit=5`, {
        headers: authHeaders(session),
    });
    expect(res.ok).toBeTruthy();
    const body = await res.json();
    const items = body.data?.items ?? body.data ?? [];
    expect(Array.isArray(items) ? items.length : 0).toBeGreaterThan(0);
}