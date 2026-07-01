import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(E2E_DIR, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'demo-session.json');
const CACHE_TTL_MS = 30 * 60 * 1000;

type CachedDemoSession = {
    accessToken: string;
    tenantId: string;
    storeId: string;
    planCode?: string;
    email?: string;
    fetchedAt: number;
};

async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCache(allowStale = false): Promise<CachedDemoSession | null> {
    try {
        const raw = await readFile(CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw) as CachedDemoSession;
        if (!parsed.accessToken || !parsed.tenantId || !parsed.storeId) return null;
        if (!allowStale && Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
        return parsed;
    } catch {
        return null;
    }
}

async function fetchDemoSessionFromApi(maxAttempts = 5): Promise<CachedDemoSession> {
    const apiUrl = process.env.E2E_API_URL || 'http://localhost:4000';
    let lastBody = '';
    let lastStatus = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const res = await fetch(`${apiUrl}/api/v1/auth/demo`, { method: 'POST' });
        if (res.status === 429) {
            lastStatus = 429;
            lastBody = await res.text();
            await sleep(Math.min((attempt + 1) * 2000, 15_000));
            continue;
        }
        if (!res.ok) {
            lastStatus = res.status;
            lastBody = await res.text();
            throw new Error(
                `Accounting globalSetup: demo login failed (${res.status}). ` +
                    `Run backend with THROTTLE_LIMIT=100000. Response: ${lastBody}`,
            );
        }

        const body = await res.json();
        const tenant = body.data?.tenants?.[0];
        const store = tenant?.stores?.[0];
        if (!body.data?.access_token || !tenant?.id || !store?.id) {
            throw new Error('Accounting globalSetup: demo login response missing token, tenant, or store');
        }

        return {
            accessToken: body.data.access_token,
            tenantId: tenant.id,
            storeId: store.id,
            planCode: tenant.subscription?.plan?.code,
            email: body.data.user?.email,
            fetchedAt: Date.now(),
        };
    }

    throw new Error(
        `Accounting globalSetup: demo login throttled (${lastStatus}) after retries. ` +
            `Start a single backend with THROTTLE_LIMIT=100000 and avoid parallel accounting runs. ` +
            `Response: ${lastBody}`,
    );
}

async function globalSetup() {
    await mkdir(CACHE_DIR, { recursive: true });

    const fresh = await readCache(false);
    if (fresh) {
        process.env.E2E_DEMO_SESSION_FILE = CACHE_FILE;
        return;
    }

    const stale = await readCache(true);
    try {
        const session = await fetchDemoSessionFromApi();
        await writeFile(CACHE_FILE, JSON.stringify(session, null, 2), 'utf8');
    } catch (error) {
        if (!stale) throw error;
        // Parallel local runs often throttle /auth/demo — reuse last good token.
    }

    process.env.E2E_DEMO_SESSION_FILE = CACHE_FILE;
}

export default globalSetup;