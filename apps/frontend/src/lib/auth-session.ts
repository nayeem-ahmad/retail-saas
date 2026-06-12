import { api } from './api';
import { syncLocalePreferenceFromSession } from './localization/preference';

export async function storeAuthResponse(res: any) {
    const data = res.data ? res.data : res;
    localStorage.setItem('access_token', data.access_token);

    if (data.is_demo) {
        localStorage.setItem('demo_session', '1');
    } else {
        localStorage.removeItem('demo_session');
    }

    const meRes = data.tenants ? data : await api.getMe();
    syncLocalePreferenceFromSession(meRes, { overwrite: true });

    if (meRes.is_demo) {
        localStorage.setItem('demo_session', '1');
    }

    if (meRes.tenants && meRes.tenants.length > 0) {
        const primaryTenant = meRes.tenants[0];
        localStorage.setItem('tenant_id', primaryTenant.id);
        if (primaryTenant.stores && primaryTenant.stores.length > 0) {
            localStorage.setItem('store_id', primaryTenant.stores[0].id);
        }
        if (primaryTenant.subscription?.plan?.code) {
            localStorage.setItem('subscription_plan_code', primaryTenant.subscription.plan.code);
        }
    }
}

export function clearAuthSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('store_id');
    localStorage.removeItem('subscription_plan_code');
    localStorage.removeItem('demo_session');
    localStorage.removeItem('onboarding_complete');
}