import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { BillingService } from './billing.service';

describe('BillingService', () => {
    const db = {
        tenantUser: { findUnique: jest.fn() },
        subscriptionPlan: { findMany: jest.fn(), findUnique: jest.fn() },
        tenantSubscription: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
        tenant: { findUnique: jest.fn() },
        billingEvent: { findMany: jest.fn(), upsert: jest.fn() },
    } as any;

    let service: BillingService;
    const fetchMock = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks();
        service = new BillingService(db);
        (global as any).fetch = fetchMock;
        process.env.BILLING_PROVIDER = 'SSL_WIRELESS';
        process.env.SSL_WIRELESS_STORE_ID = 'store-id';
        process.env.SSL_WIRELESS_STORE_PASSWORD = 'store-pass';
        process.env.SSL_WIRELESS_API_URL = 'https://sandbox.example.com/init';
        process.env.SSL_WIRELESS_VALIDATION_URL = 'https://sandbox.example.com/validate';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        process.env.BACKEND_PUBLIC_URL = 'http://localhost:4000';

        db.tenantUser.findUnique.mockResolvedValue({
            role: 'OWNER',
            tenant: { id: 'tenant-1', name: 'Tenant One' },
            user: { id: 'user-1', email: 'nayeem.ahmad@gmail.com', name: 'Nayeem Ahmad' },
        });
        db.subscriptionPlan.findMany.mockResolvedValue([]);
        db.subscriptionPlan.findUnique.mockResolvedValue({
            id: 'plan-premium',
            code: 'PREMIUM',
            name: 'Premium',
            description: 'Advanced plan',
            monthly_price: 3999,
            yearly_price: 39990,
            is_active: true,
            features_json: {},
        });
        db.billingEvent.findMany.mockResolvedValue([]);
        db.billingEvent.upsert.mockResolvedValue({ id: 'event-1' });
        db.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', name: 'Tenant One' });
        db.tenantSubscription.upsert.mockResolvedValue({
            status: 'ACTIVE',
            current_period_start: new Date('2026-03-21T00:00:00.000Z'),
            current_period_end: new Date('2026-04-20T00:00:00.000Z'),
            cancel_at_period_end: false,
            provider_name: 'ssl-wireless',
            provider_customer_ref: 'tenant-1',
            provider_subscription_ref: 'bank-ref-1',
            plan: {
                code: 'PREMIUM',
                name: 'Premium',
                description: 'Advanced plan',
                monthly_price: 3999,
                yearly_price: 39990,
                features_json: {},
            },
        });
    });

    it('creates an SSL Wireless hosted checkout session', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify({
                status: 'SUCCESS',
                GatewayPageURL: 'https://sandbox.sslcommerz.com/gateway',
                sessionkey: 'session-1',
            })),
        });

        const result = await service.createCheckoutSession('user-1', 'tenant-1', {
            planCode: 'PREMIUM',
            billingCycle: 'MONTHLY',
        });

        expect(result.provider_name).toBe('ssl-wireless');
        expect(result.checkout_url).toBe('https://sandbox.sslcommerz.com/gateway');
        expect(db.billingEvent.upsert).toHaveBeenCalled();
    });

    it('bypasses external checkout when selecting Free plan', async () => {
        db.subscriptionPlan.findUnique.mockResolvedValueOnce({
            id: 'plan-free',
            code: 'FREE',
            name: 'Free',
            description: 'Starter plan',
            monthly_price: 0,
            yearly_price: 0,
            is_active: true,
            features_json: {},
        });
        db.tenantSubscription.upsert.mockResolvedValueOnce({
            status: 'ACTIVE',
            current_period_start: new Date('2026-03-21T00:00:00.000Z'),
            current_period_end: new Date('2026-04-20T00:00:00.000Z'),
            cancel_at_period_end: false,
            provider_name: 'manual',
            provider_customer_ref: 'tenant-1',
            provider_subscription_ref: 'free-tenant-1',
            plan: {
                code: 'FREE',
                name: 'Free',
                description: 'Starter plan',
                monthly_price: 0,
                yearly_price: 0,
                features_json: {},
            },
        });

        const result = await service.createCheckoutSession('user-1', 'tenant-1', {
            planCode: 'FREE',
            billingCycle: 'MONTHLY',
        });

        expect(result.requires_confirmation).toBe(false);
        expect(result.amount).toBe(0);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects invalid manual webhook signatures', async () => {
        await expect(service.handleManualWebhook('wrong-secret', {
            tenantId: 'tenant-1',
            planCode: 'PREMIUM',
        })).rejects.toThrow(UnauthorizedException);
    });

    it('updates subscription after SSL Wireless success validation', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify({
                status: 'VALID',
                tran_id: 'sslw_tenant_1',
                val_id: 'val-1',
                bank_tran_id: 'bank-ref-1',
                amount: '3999.00',
                currency: 'BDT',
                value_a: 'tenant-1',
            })),
        });

        const redirectUrl = await service.handleSslWirelessCallback({
            tran_id: 'sslw_tenant_1',
            val_id: 'val-1',
            value_a: 'tenant-1',
            value_b: 'PREMIUM',
            value_c: 'MONTHLY',
        }, 'success');

        expect(db.tenantSubscription.upsert).toHaveBeenCalled();
        expect(redirectUrl).toContain('paymentStatus=success');
    });

    it('marks failed SSL Wireless callbacks as non-active', async () => {
        const redirectUrl = await service.handleSslWirelessCallback({
            tran_id: 'sslw_tenant_1',
            value_a: 'tenant-1',
            value_b: 'PREMIUM',
            value_c: 'MONTHLY',
        }, 'fail');

        expect(db.tenantSubscription.upsert).toHaveBeenCalledWith(expect.objectContaining({
            update: expect.objectContaining({ status: 'PAST_DUE' }),
            create: expect.objectContaining({ status: 'PAST_DUE' }),
        }));
        expect(redirectUrl).toContain('paymentStatus=failed');
    });

    it('throws when SSL Wireless validation lacks a val_id', async () => {
        await expect(service.handleSslWirelessCallback({
            tran_id: 'sslw_tenant_1',
            value_a: 'tenant-1',
            value_b: 'PREMIUM',
            value_c: 'MONTHLY',
        }, 'success')).rejects.toThrow(BadRequestException);
    });
});