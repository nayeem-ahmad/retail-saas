import { Test, TestingModule } from '@nestjs/testing';
import { SegmentsService, SEGMENT_THRESHOLDS } from './segments.service';
import { DatabaseService } from '../database/database.service';

const NOW = new Date('2026-05-08T00:00:00Z');

describe('SegmentsService', () => {
    let service: SegmentsService;
    let db: any;

    beforeEach(async () => {
        db = {
            customer: {
                findMany: jest.fn(),
                update: jest.fn(),
            },
            sale: {
                groupBy: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SegmentsService,
                { provide: DatabaseService, useValue: db },
            ],
        }).compile();

        service = module.get<SegmentsService>(SegmentsService);
    });

    describe('classifyCustomer()', () => {
        it('returns VIP when total_spent exceeds threshold', () => {
            const result = service.classifyCustomer({
                totalSpent: SEGMENT_THRESHOLDS.VIP_SPEND_BDT + 1,
                lastPurchaseDate: new Date('2026-04-01'),
                accountCreatedAt: new Date('2025-01-01'),
                now: NOW,
            });
            expect(result).toBe('VIP');
        });

        it('returns VIP even when last purchase was long ago', () => {
            const result = service.classifyCustomer({
                totalSpent: SEGMENT_THRESHOLDS.VIP_SPEND_BDT + 1000,
                lastPurchaseDate: new Date('2025-01-01'),
                accountCreatedAt: new Date('2024-01-01'),
                now: NOW,
            });
            expect(result).toBe('VIP');
        });

        it('returns At-Risk when last purchase > 30 days ago and spend below VIP', () => {
            const result = service.classifyCustomer({
                totalSpent: 1000,
                lastPurchaseDate: new Date('2026-03-01'),
                accountCreatedAt: new Date('2025-01-01'),
                now: NOW,
            });
            expect(result).toBe('At-Risk');
        });

        it('returns At-Risk when no purchases and old account (> 30 days)', () => {
            const result = service.classifyCustomer({
                totalSpent: 0,
                lastPurchaseDate: null,
                accountCreatedAt: new Date('2025-01-01'),
                now: NOW,
            });
            expect(result).toBe('At-Risk');
        });

        it('returns New when account created < 30 days ago and no purchases', () => {
            const result = service.classifyCustomer({
                totalSpent: 0,
                lastPurchaseDate: null,
                accountCreatedAt: new Date('2026-04-20'),
                now: NOW,
            });
            expect(result).toBe('New');
        });

        it('returns Regular when purchased within 30 days', () => {
            const result = service.classifyCustomer({
                totalSpent: 500,
                lastPurchaseDate: new Date('2026-04-25'),
                accountCreatedAt: new Date('2025-01-01'),
                now: NOW,
            });
            expect(result).toBe('Regular');
        });

        it('returns Regular for new account with recent purchase', () => {
            const result = service.classifyCustomer({
                totalSpent: 500,
                lastPurchaseDate: new Date('2026-04-26'),
                accountCreatedAt: new Date('2026-04-20'),
                now: NOW,
            });
            expect(result).toBe('Regular');
        });

        it('returns Regular when spend is exactly at VIP threshold (not above)', () => {
            const result = service.classifyCustomer({
                totalSpent: SEGMENT_THRESHOLDS.VIP_SPEND_BDT,
                lastPurchaseDate: new Date('2026-04-25'),
                accountCreatedAt: new Date('2025-01-01'),
                now: NOW,
            });
            expect(result).toBe('Regular');
        });
    });

    describe('refreshAll()', () => {
        it('updates customers whose segment has changed', async () => {
            db.customer.findMany.mockResolvedValue([
                { id: 'c1', tenant_id: 't1', total_spent: 60000, segment_category: 'Regular', created_at: new Date('2025-01-01') },
            ]);
            db.sale.groupBy.mockResolvedValue([
                { customer_id: 'c1', _max: { created_at: new Date('2026-04-25') } },
            ]);
            db.customer.update.mockResolvedValue({});

            const result = await service.refreshAll('t1', NOW);

            expect(db.customer.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: { segment_category: 'VIP' },
            });
            expect(result.updated).toBe(1);
            expect(result.total).toBe(1);
        });

        it('skips customers whose segment has not changed', async () => {
            db.customer.findMany.mockResolvedValue([
                { id: 'c2', tenant_id: 't1', total_spent: 500, segment_category: 'Regular', created_at: new Date('2025-01-01') },
            ]);
            db.sale.groupBy.mockResolvedValue([
                { customer_id: 'c2', _max: { created_at: new Date('2026-04-25') } },
            ]);

            const result = await service.refreshAll('t1', NOW);

            expect(db.customer.update).not.toHaveBeenCalled();
            expect(result.updated).toBe(0);
            expect(result.total).toBe(1);
        });

        it('calls findMany without tenant filter when tenantId is not provided', async () => {
            db.customer.findMany.mockResolvedValue([]);
            db.sale.groupBy.mockResolvedValue([]);
            await service.refreshAll(undefined, NOW);
            expect(db.customer.findMany).toHaveBeenCalledWith({ where: {} });
        });

        it('calls findMany with tenant_id filter when tenantId is provided', async () => {
            db.customer.findMany.mockResolvedValue([]);
            db.sale.groupBy.mockResolvedValue([]);
            await service.refreshAll('tenant-abc', NOW);
            expect(db.customer.findMany).toHaveBeenCalledWith({ where: { tenant_id: 'tenant-abc' } });
        });

        it('scopes the groupBy sale query to the tenant', async () => {
            db.customer.findMany.mockResolvedValue([]);
            db.sale.groupBy.mockResolvedValue([]);
            await service.refreshAll('tenant-abc', NOW);
            expect(db.sale.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenant_id: 'tenant-abc' }),
                }),
            );
        });
    });
});
