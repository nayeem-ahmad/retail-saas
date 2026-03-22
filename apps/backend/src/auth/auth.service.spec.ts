import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;

    const db = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        accountGroup: { upsert: jest.fn() },
        accountSubgroup: { upsert: jest.fn() },
        account: { upsert: jest.fn() },
        subscriptionPlan: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        tenant: { create: jest.fn() },
        tenantUser: { create: jest.fn() },
        store: { create: jest.fn() },
        tenantSubscription: { create: jest.fn() },
        $transaction: jest.fn(),
    };

    const jwtService = {
        sign: jest.fn().mockReturnValue('jwt-token'),
    };

    beforeEach(async () => {
        jest.resetAllMocks();
        db.$transaction.mockImplementation(async (callback: any) => callback(db));
        db.accountGroup.upsert.mockResolvedValue({ id: 'group-1', name: 'Current Assets' });
        db.accountSubgroup.upsert.mockResolvedValue({ id: 'subgroup-1', name: 'Cash and Bank' });
        db.account.upsert.mockResolvedValue({ id: 'account-1', name: 'Cash in Hand' });
        jwtService.sign.mockReturnValue('jwt-token');

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: DatabaseService, useValue: db },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get(AuthService);
    });

    it('signs up a new tenant-backed user', async () => {
        db.user.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 'user-1',
                email: 'owner@example.com',
                name: 'Owner',
                tenantMembers: [{
                    role: 'OWNER',
                    tenant: {
                        id: 'tenant-1',
                        name: 'Tenant One',
                        stores: [{ id: 'store-1' }],
                        subscription: {
                            status: 'TRIALING',
                            current_period_start: new Date('2026-03-21T00:00:00.000Z'),
                            current_period_end: new Date('2026-04-04T00:00:00.000Z'),
                            cancel_at_period_end: false,
                            plan: { code: 'BASIC', name: 'Basic', description: null, monthly_price: 1499, yearly_price: null, features_json: {} },
                        },
                    },
                }],
            });
        db.user.create.mockResolvedValue({ id: 'user-1', email: 'owner@example.com', name: 'Owner' });
        db.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan-basic', code: 'BASIC', is_active: true });
        db.tenant.create.mockResolvedValue({ id: 'tenant-1' });
        db.store.create.mockResolvedValue({ id: 'store-1' });

        const result = await service.signup({
            email: 'owner@example.com',
            password: 'password123',
            name: 'Owner',
            tenantName: 'Tenant One',
            storeName: 'Main Store',
            planCode: 'BASIC',
        });

        expect(result.access_token).toBe('jwt-token');
        expect(db.tenantSubscription.create).toHaveBeenCalled();
    });

    it('rejects duplicate emails on signup', async () => {
        db.user.findUnique.mockResolvedValue({ id: 'user-1' });

        await expect(service.signup({
            email: 'owner@example.com',
            password: 'password123',
            tenantName: 'Tenant One',
            storeName: 'Main Store',
        } as any)).rejects.toThrow(ConflictException);
    });

    it('rejects invalid login credentials', async () => {
        db.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'owner@example.com', passwordHash: 'hashed' });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(service.login({ email: 'owner@example.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('marks nayeem.ahmad@gmail.com as platform admin in auth responses', async () => {
        db.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'nayeem.ahmad@gmail.com',
            name: 'Nayeem Ahmad',
            tenantMembers: [],
        });

        const result = await service.getMe('user-1');

        expect(result.is_platform_admin).toBe(true);
    });
});