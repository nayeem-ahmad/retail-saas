import { Test, TestingModule } from '@nestjs/testing';
import { DiscountCodesService } from './discount-codes.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DiscountCodesService', () => {
    let service: DiscountCodesService;
    let db: any;

    beforeEach(async () => {
        db = {
            discountCode: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
                delete: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (cb: any) => cb(db)),
            $queryRaw: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DiscountCodesService,
                { provide: DatabaseService, useValue: db },
            ],
        }).compile();

        service = module.get<DiscountCodesService>(DiscountCodesService);
        jest.clearAllMocks();
    });

    // ── list ──────────────────────────────────────────────────────────────────

    describe('list()', () => {
        it('returns all discount codes for the tenant', async () => {
            const codes = [{ id: 'd1', code: 'SAVE10' }, { id: 'd2', code: 'FLAT50' }];
            db.discountCode.findMany.mockResolvedValue(codes);
            db.discountCode.count.mockResolvedValue(2);

            const result = await service.list('ten1');

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(db.discountCode.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { tenantId: 'ten1' },
                    orderBy: { created_at: 'desc' },
                }),
            );
        });

        it('returns empty array when no codes exist', async () => {
            db.discountCode.findMany.mockResolvedValue([]);
            db.discountCode.count.mockResolvedValue(0);
            const result = await service.list('ten1');
            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
        });
    });

    // ── create ────────────────────────────────────────────────────────────────

    describe('create()', () => {
        it('creates a percentage discount code', async () => {
            db.discountCode.findUnique.mockResolvedValue(null);
            db.discountCode.create.mockResolvedValue({ id: 'd1', code: 'SAVE10', type: 'PERCENTAGE', value: 10 });

            const result = await service.create('ten1', {
                code: 'save10',
                name: '10% off',
                type: 'PERCENTAGE',
                value: 10,
            });

            expect(result.code).toBe('SAVE10');
            expect(db.discountCode.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ code: 'SAVE10', type: 'PERCENTAGE' }),
                }),
            );
        });

        it('normalises code to uppercase before saving', async () => {
            db.discountCode.findUnique.mockResolvedValue(null);
            db.discountCode.create.mockResolvedValue({ id: 'd1', code: 'FLAT50' });

            await service.create('ten1', { code: '  flat50  ', name: 'Flat 50', type: 'FLAT', value: 50 });

            expect(db.discountCode.findUnique).toHaveBeenCalledWith({
                where: { tenantId_code: { tenantId: 'ten1', code: 'FLAT50' } },
            });
            expect(db.discountCode.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ code: 'FLAT50' }) }),
            );
        });

        it('throws BadRequestException when percentage value exceeds 100', async () => {
            const p = service.create('ten1', { code: 'OVER100', name: 'Bad', type: 'PERCENTAGE', value: 101 });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('cannot exceed 100%');
        });

        it('throws BadRequestException when code already exists', async () => {
            db.discountCode.findUnique.mockResolvedValue({ id: 'existing' });

            const p = service.create('ten1', { code: 'DUPE', name: 'Dupe', type: 'FLAT', value: 10 });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('already exists');
        });

        it('creates code with optional fields (min_purchase, max_discount, usage_limit, dates)', async () => {
            db.discountCode.findUnique.mockResolvedValue(null);
            db.discountCode.create.mockResolvedValue({ id: 'd1', code: 'FULL' });

            await service.create('ten1', {
                code: 'FULL',
                name: 'Full',
                type: 'PERCENTAGE',
                value: 15,
                min_purchase: 500,
                max_discount: 100,
                usage_limit: 50,
                valid_from: '2026-01-01',
                valid_until: '2026-12-31',
            });

            expect(db.discountCode.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        min_purchase: 500,
                        max_discount: 100,
                        usage_limit: 50,
                    }),
                }),
            );
        });

        it('sets null for omitted optional fields', async () => {
            db.discountCode.findUnique.mockResolvedValue(null);
            db.discountCode.create.mockResolvedValue({ id: 'd1', code: 'MINIMAL' });

            await service.create('ten1', { code: 'MINIMAL', name: 'Min', type: 'FLAT', value: 20 });

            expect(db.discountCode.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        min_purchase: null,
                        max_discount: null,
                        usage_limit: null,
                        valid_from: null,
                        valid_until: null,
                    }),
                }),
            );
        });
    });

    // ── toggle ────────────────────────────────────────────────────────────────

    describe('toggle()', () => {
        it('toggles an active code to inactive', async () => {
            db.discountCode.findFirst.mockResolvedValue({ id: 'd1', is_active: true });
            db.discountCode.update.mockResolvedValue({ id: 'd1', is_active: false });

            const result = await service.toggle('ten1', 'd1');

            expect(db.discountCode.update).toHaveBeenCalledWith({
                where: { id: 'd1' },
                data: { is_active: false },
            });
            expect(result.is_active).toBe(false);
        });

        it('toggles an inactive code to active', async () => {
            db.discountCode.findFirst.mockResolvedValue({ id: 'd1', is_active: false });
            db.discountCode.update.mockResolvedValue({ id: 'd1', is_active: true });

            const result = await service.toggle('ten1', 'd1');

            expect(db.discountCode.update).toHaveBeenCalledWith({
                where: { id: 'd1' },
                data: { is_active: true },
            });
            expect(result.is_active).toBe(true);
        });

        it('throws NotFoundException when code does not exist', async () => {
            db.discountCode.findFirst.mockResolvedValue(null);

            const p = service.toggle('ten1', 'ghost');
            await expect(p).rejects.toThrow(NotFoundException);
            await expect(p).rejects.toThrow('Discount code not found');
        });
    });

    // ── remove ────────────────────────────────────────────────────────────────

    describe('remove()', () => {
        it('deletes discount code and returns { deleted: true }', async () => {
            db.discountCode.findFirst.mockResolvedValue({ id: 'd1' });
            db.discountCode.delete.mockResolvedValue({ id: 'd1' });

            const result = await service.remove('ten1', 'd1');

            expect(db.discountCode.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
            expect(result).toEqual({ deleted: true });
        });

        it('throws NotFoundException when code does not exist', async () => {
            db.discountCode.findFirst.mockResolvedValue(null);

            const p = service.remove('ten1', 'ghost');
            await expect(p).rejects.toThrow(NotFoundException);
        });
    });

    // ── validate ──────────────────────────────────────────────────────────────

    describe('validate()', () => {
        const makeDiscount = (overrides = {}) => ({
            id: 'd1',
            code: 'SAVE10',
            name: '10% off',
            type: 'PERCENTAGE',
            value: 10,
            is_active: true,
            valid_from: null,
            valid_until: null,
            usage_limit: null,
            used_count: 0,
            min_purchase: null,
            max_discount: null,
            ...overrides,
        });

        it('returns discount amount for a valid PERCENTAGE code', async () => {
            db.discountCode.findUnique.mockResolvedValue(makeDiscount());

            const result = await service.validate('ten1', { code: 'save10', cart_total: 1000 });

            expect(result.discount_amount).toBe(100);
            expect(result.code).toBe('SAVE10');
            expect(result.type).toBe('PERCENTAGE');
        });

        it('caps PERCENTAGE discount by max_discount', async () => {
            db.discountCode.findUnique.mockResolvedValue(
                makeDiscount({ type: 'PERCENTAGE', value: 20, max_discount: 50 }),
            );

            const result = await service.validate('ten1', { code: 'SAVE20', cart_total: 1000 });

            // 20% of 1000 = 200, capped at 50
            expect(result.discount_amount).toBe(50);
        });

        it('returns correct discount for a FLAT code', async () => {
            db.discountCode.findUnique.mockResolvedValue(
                makeDiscount({ type: 'FLAT', value: 75 }),
            );

            const result = await service.validate('ten1', { code: 'FLAT75', cart_total: 500 });

            expect(result.discount_amount).toBe(75);
        });

        it('caps FLAT discount at cart total', async () => {
            db.discountCode.findUnique.mockResolvedValue(
                makeDiscount({ type: 'FLAT', value: 600 }),
            );

            const result = await service.validate('ten1', { code: 'FLAT600', cart_total: 200 });

            expect(result.discount_amount).toBe(200);
        });

        it('throws BadRequestException when code is inactive', async () => {
            db.discountCode.findUnique.mockResolvedValue(makeDiscount({ is_active: false }));

            const p = service.validate('ten1', { code: 'SAVE10', cart_total: 100 });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('Invalid or inactive');
        });

        it('throws BadRequestException when code is not found', async () => {
            db.discountCode.findUnique.mockResolvedValue(null);

            const p = service.validate('ten1', { code: 'NONE', cart_total: 100 });
            await expect(p).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException when valid_from is in the future', async () => {
            const future = new Date();
            future.setFullYear(future.getFullYear() + 1);
            db.discountCode.findUnique.mockResolvedValue(makeDiscount({ valid_from: future }));

            const p = service.validate('ten1', { code: 'FUTURE', cart_total: 100 });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('not yet valid');
        });

        it('throws BadRequestException when valid_until is in the past', async () => {
            const past = new Date();
            past.setFullYear(past.getFullYear() - 1);
            db.discountCode.findUnique.mockResolvedValue(makeDiscount({ valid_until: past }));

            const p = service.validate('ten1', { code: 'EXPIRED', cart_total: 100 });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('expired');
        });

        it('throws BadRequestException when usage limit is reached', async () => {
            db.discountCode.findUnique.mockResolvedValue(
                makeDiscount({ usage_limit: 10, used_count: 10 }),
            );

            const p = service.validate('ten1', { code: 'LIMIT', cart_total: 100 });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('usage limit reached');
        });

        it('throws BadRequestException when cart total is below min_purchase', async () => {
            db.discountCode.findUnique.mockResolvedValue(
                makeDiscount({ min_purchase: 500 }),
            );

            const p = service.validate('ten1', { code: 'MINPURCHASE', cart_total: 100 });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('Minimum purchase');
        });

        it('normalises code lookup to uppercase', async () => {
            db.discountCode.findUnique.mockResolvedValue(makeDiscount());

            await service.validate('ten1', { code: '  save10  ', cart_total: 200 });

            expect(db.discountCode.findUnique).toHaveBeenCalledWith({
                where: { tenantId_code: { tenantId: 'ten1', code: 'SAVE10' } },
            });
        });
    });

    // ── recordUsage ───────────────────────────────────────────────────────────

    describe('recordUsage()', () => {
        it('increments used_count for the matching code', async () => {
            db.discountCode.updateMany.mockResolvedValue({ count: 1 });

            await service.recordUsage('ten1', 'save10');

            expect(db.discountCode.updateMany).toHaveBeenCalledWith({
                where: { tenantId: 'ten1', code: 'SAVE10' },
                data: { used_count: { increment: 1 } },
            });
        });
    });
});
