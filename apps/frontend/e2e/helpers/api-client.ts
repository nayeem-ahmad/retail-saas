import { E2E_API_URL } from './auth';
import type { DemoSession } from './demo-auth';
import { authHeaders } from './demo-auth';

type ApiEnvelope<T> = { data: T };

async function parseJson<T>(res: Response): Promise<T> {
    if (!res.ok) {
        throw new Error(`API ${res.url} → ${res.status}: ${await res.text()}`);
    }
    const body = await res.json();
    return (body.data ?? body) as T;
}

export async function apiGet<T>(session: DemoSession, path: string): Promise<T> {
    const res = await fetch(`${E2E_API_URL}/api/v1${path}`, { headers: authHeaders(session) });
    return parseJson<T>(res);
}

export async function apiPost<T>(session: DemoSession, path: string, payload: unknown): Promise<T> {
    const res = await fetch(`${E2E_API_URL}/api/v1${path}`, {
        method: 'POST',
        headers: authHeaders(session),
        body: JSON.stringify(payload),
    });
    return parseJson<T>(res);
}

export interface ProductSummary {
    id: string;
    name: string;
    sku?: string | null;
    price: number | string;
}

export interface CustomerSummary {
    id: string;
    name: string;
    phone: string;
}

export interface SupplierSummary {
    id: string;
    name: string;
}

export async function listProducts(session: DemoSession): Promise<ProductSummary[]> {
    const result = await apiGet<{ items?: ProductSummary[] } | ProductSummary[]>(session, '/products?limit=50');
    if (Array.isArray(result)) return result;
    return result.items ?? [];
}

export async function listCustomers(session: DemoSession): Promise<CustomerSummary[]> {
    return apiGet<CustomerSummary[]>(session, '/customers');
}

export async function listSuppliers(session: DemoSession): Promise<SupplierSummary[]> {
    return apiGet<SupplierSummary[]>(session, '/suppliers');
}