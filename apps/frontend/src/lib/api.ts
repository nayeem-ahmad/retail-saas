const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;
    const storeId = typeof window !== 'undefined' ? localStorage.getItem('store_id') : null;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (tenantId) {
        headers.set('x-tenant-id', tenantId);
    }
    if (storeId) {
        headers.set('x-store-id', storeId);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    getProducts: () => fetchWithAuth('/products'),
    createProduct: (data: any) => fetchWithAuth('/products', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    updateProduct: (id: string, data: any) => fetchWithAuth(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    deleteProduct: (id: string) => fetchWithAuth(`/products/${id}`, {
        method: 'DELETE',
    }),
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithAuth('/assets/upload', {
            method: 'POST',
            body: formData,
        });
    },
    createSale: (data: any) => fetchWithAuth('/sales', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    getSales: () => fetchWithAuth('/sales'),
    getCustomers: () => fetchWithAuth('/customers'),
    getCustomer: (id: string) => fetchWithAuth(`/customers/${id}`),
    getCustomerHistory: (id: string) => fetchWithAuth(`/customers/${id}/history`),
    createCustomer: (data: any) => fetchWithAuth('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    updateCustomer: (id: string, data: any) => fetchWithAuth(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    // Customer Groups
    getCustomerGroups: () => fetchWithAuth('/customer-groups'),
    getCustomerGroup: (id: string) => fetchWithAuth(`/customer-groups/${id}`),
    createCustomerGroup: (data: any) => fetchWithAuth('/customer-groups', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    updateCustomerGroup: (id: string, data: any) => fetchWithAuth(`/customer-groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    deleteCustomerGroup: (id: string) => fetchWithAuth(`/customer-groups/${id}`, {
        method: 'DELETE',
    }),
    // Territories
    getTerritories: () => fetchWithAuth('/territories'),
    getTerritory: (id: string) => fetchWithAuth(`/territories/${id}`),
    createTerritory: (data: any) => fetchWithAuth('/territories', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    updateTerritory: (id: string, data: any) => fetchWithAuth(`/territories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    deleteTerritory: (id: string) => fetchWithAuth(`/territories/${id}`, {
        method: 'DELETE',
    }),
    getReturns: () => fetchWithAuth('/sales-returns'),
    getReturn: (id: string) => fetchWithAuth(`/sales-returns/${id}`),
    createReturn: (data: any) => fetchWithAuth('/sales-returns', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    deleteReturn: (id: string) => fetchWithAuth(`/sales-returns/${id}`, {
        method: 'DELETE',
    }),
    updateReturn: (id: string, data: any) => fetchWithAuth(`/sales-returns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    getOrders: () => fetchWithAuth('/sales-orders'),
    getOrder: (id: string) => fetchWithAuth(`/sales-orders/${id}`),
    createOrder: (data: any) => fetchWithAuth('/sales-orders', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    updateOrder: (id: string, data: any) => fetchWithAuth(`/sales-orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    deleteOrder: (id: string) => fetchWithAuth(`/sales-orders/${id}`, {
        method: 'DELETE',
    }),
    updateOrderStatus: (id: string, status: string) => fetchWithAuth(`/sales-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
    }),
    addOrderDeposit: (id: string, data: any) => fetchWithAuth(`/sales-orders/${id}/deposits`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    getQuotations: () => fetchWithAuth('/sales-quotations'),
    getQuotation: (id: string) => fetchWithAuth(`/sales-quotations/${id}`),
    createQuotation: (data: any) => fetchWithAuth('/sales-quotations', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    updateQuotation: (id: string, data: any) => fetchWithAuth(`/sales-quotations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    deleteQuotation: (id: string) => fetchWithAuth(`/sales-quotations/${id}`, {
        method: 'DELETE',
    }),
    reviseQuotation: (id: string) => fetchWithAuth(`/sales-quotations/${id}/revise`, {
        method: 'POST',
    }),
    convertQuotation: (id: string) => fetchWithAuth(`/sales-quotations/${id}/convert`, {
        method: 'POST',
    }),
    // Sales detail
    getSale: (id: string) => fetchWithAuth(`/sales/${id}`),
    updateSale: (id: string, data: any) => fetchWithAuth(`/sales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    // Cashier sessions
    openCashierSession: (data: any) => fetchWithAuth('/cashier-sessions/open', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    closeCashierSession: (sessionId: string, data: any) => fetchWithAuth(`/cashier-sessions/${sessionId}/close`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    getOpenCashierSession: () => fetchWithAuth('/cashier-sessions/open'),
    getCashierSession: (sessionId: string) => fetchWithAuth(`/cashier-sessions/${sessionId}`),
    addCashTransaction: (sessionId: string, data: any) => fetchWithAuth(`/cashier-sessions/${sessionId}/cash-transaction`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }),
    getCashTransactions: (sessionId: string) => fetchWithAuth(`/cashier-sessions/${sessionId}/cash-transactions`),
    login: (data: any) => fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    }),
    getMe: () => fetchWithAuth('/auth/me'),
};
