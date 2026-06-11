import { Test, TestingModule } from '@nestjs/testing';
import { CountersService } from './counters.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CountersService', () => {
    let service: CountersService;
    let db: any;

    beforeEach(async () => {
        db = {
            posCounter: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            cashierSession: {
                findFirst: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (cb: any) => cb(db)),
            $queryRaw: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CountersService,
                { provide: DatabaseService, useValue: db },
            ],
        }).compile();

        service = module.get<CountersService>(CountersService);
        jest.clearAllMocks();
    });

    // ── create ────────────────────────────────────────────────────────────────

    describe('create()', () => {
        it('creates a counter when number is unique for the store', async () => {
            db.posCounter.findFirst.mockResolvedValue(null);
            db.posCounter.create.mockResolvedValue({
                id: 'cnt1',
                name: 'Counter 1',
                counter_number: 1,
                status: 'ACTIVE',
            });

            const result = await service.create('ten1', {
                storeId: 'store1',
                counterNumber: 1,
                name: 'Counter 1',
            });

            expect(result.id).toBe('cnt1');
            expect(db.posCounter.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    tenant_id: 'ten1',
                    store_id: 'store1',
                    counter_number: 1,
                    status: 'ACTIVE',
                }),
            });
        });

        it('throws BadRequestException when counter number already exists in store', async () => {
            db.posCounter.findFirst.mockResolvedValue({ id: 'existing' });

            const p = service.create('ten1', { storeId: 'store1', counterNumber: 1, name: 'Dup' });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('already exists');
        });
    });

    // ── findByStore ───────────────────────────────────────────────────────────

    describe('findByStore()', () => {
        it('returns all counters for the store ordered by counter_number', async () => {
            const counters = [
                { id: 'c1', counter_number: 1 },
                { id: 'c2', counter_number: 2 },
            ];
            db.posCounter.findMany.mockResolvedValue(counters);

            const result = await service.findByStore('ten1', 'store1');

            expect(result).toHaveLength(2);
            expect(db.posCounter.findMany).toHaveBeenCalledWith({
                where: { tenant_id: 'ten1', store_id: 'store1' },
                orderBy: { counter_number: 'asc' },
            });
        });

        it('returns empty array when store has no counters', async () => {
            db.posCounter.findMany.mockResolvedValue([]);
            const result = await service.findByStore('ten1', 'empty-store');
            expect(result).toEqual([]);
        });
    });

    // ── findActive ────────────────────────────────────────────────────────────

    describe('findActive()', () => {
        it('returns only ACTIVE counters', async () => {
            const activeCounters = [{ id: 'c1', status: 'ACTIVE' }];
            db.posCounter.findMany.mockResolvedValue(activeCounters);

            const result = await service.findActive('ten1', 'store1');

            expect(result).toHaveLength(1);
            expect(db.posCounter.findMany).toHaveBeenCalledWith({
                where: { tenant_id: 'ten1', store_id: 'store1', status: 'ACTIVE' },
                orderBy: { counter_number: 'asc' },
            });
        });
    });

    // ── update ────────────────────────────────────────────────────────────────

    describe('update()', () => {
        it('updates counter name', async () => {
            db.posCounter.findUnique.mockResolvedValue({ id: 'cnt1', tenant_id: 'ten1' });
            db.posCounter.update.mockResolvedValue({ id: 'cnt1', name: 'New Name' });

            const result = await service.update('ten1', 'cnt1', { name: 'New Name' });
            expect(result.name).toBe('New Name');
        });

        it('updates counter status', async () => {
            db.posCounter.findUnique.mockResolvedValue({ id: 'cnt1', tenant_id: 'ten1' });
            db.posCounter.update.mockResolvedValue({ id: 'cnt1', status: 'INACTIVE' });

            const result = await service.update('ten1', 'cnt1', { status: 'INACTIVE' });
            expect(result.status).toBe('INACTIVE');
        });

        it('throws NotFoundException when counter does not exist', async () => {
            db.posCounter.findUnique.mockResolvedValue(null);

            const p = service.update('ten1', 'ghost', { name: 'X' });
            await expect(p).rejects.toThrow(NotFoundException);
            await expect(p).rejects.toThrow('Counter not found');
        });

        it('throws NotFoundException when counter belongs to different tenant', async () => {
            db.posCounter.findUnique.mockResolvedValue({ id: 'cnt1', tenant_id: 'other-tenant' });

            const p = service.update('ten1', 'cnt1', { name: 'X' });
            await expect(p).rejects.toThrow(NotFoundException);
        });

        it('does not include undefined fields in update data', async () => {
            db.posCounter.findUnique.mockResolvedValue({ id: 'cnt1', tenant_id: 'ten1' });
            db.posCounter.update.mockResolvedValue({ id: 'cnt1', name: 'Same' });

            await service.update('ten1', 'cnt1', {});
            expect(db.posCounter.update).toHaveBeenCalledWith({
                where: { id: 'cnt1' },
                data: {},
            });
        });
    });

    // ── remove ────────────────────────────────────────────────────────────────

    describe('remove()', () => {
        it('deletes counter when no open cashier session exists', async () => {
            db.posCounter.findUnique.mockResolvedValue({ id: 'cnt1', tenant_id: 'ten1' });
            db.cashierSession.findFirst.mockResolvedValue(null);
            db.posCounter.delete.mockResolvedValue({ id: 'cnt1' });

            const result = await service.remove('ten1', 'cnt1');
            expect(db.posCounter.delete).toHaveBeenCalledWith({ where: { id: 'cnt1' } });
            expect(result.id).toBe('cnt1');
        });

        it('throws BadRequestException when an open cashier session exists', async () => {
            db.posCounter.findUnique.mockResolvedValue({ id: 'cnt1', tenant_id: 'ten1' });
            db.cashierSession.findFirst.mockResolvedValue({ id: 'sess1', status: 'OPEN' });

            const p = service.remove('ten1', 'cnt1');
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('open cashier session');
        });

        it('throws NotFoundException when counter does not exist', async () => {
            db.posCounter.findUnique.mockResolvedValue(null);

            const p = service.remove('ten1', 'ghost');
            await expect(p).rejects.toThrow(NotFoundException);
        });

        it('throws NotFoundException when counter belongs to different tenant', async () => {
            db.posCounter.findUnique.mockResolvedValue({ id: 'cnt1', tenant_id: 'other' });

            const p = service.remove('ten1', 'cnt1');
            await expect(p).rejects.toThrow(NotFoundException);
        });
    });

    // ── validateCounterBelongsToStore ─────────────────────────────────────────

    describe('validateCounterBelongsToStore()', () => {
        it('returns counter when it belongs to the tenant and store and is ACTIVE', async () => {
            const counter = { id: 'cnt1', tenant_id: 'ten1', store_id: 'store1', status: 'ACTIVE' };
            db.posCounter.findUnique.mockResolvedValue(counter);

            const result = await service.validateCounterBelongsToStore('ten1', 'cnt1', 'store1');
            expect(result).toEqual(counter);
        });

        it('throws BadRequestException when counter is not found', async () => {
            db.posCounter.findUnique.mockResolvedValue(null);

            const p = service.validateCounterBelongsToStore('ten1', 'ghost', 'store1');
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('does not belong to this store');
        });

        it('throws BadRequestException when counter belongs to a different tenant', async () => {
            db.posCounter.findUnique.mockResolvedValue({
                id: 'cnt1',
                tenant_id: 'other',
                store_id: 'store1',
                status: 'ACTIVE',
            });

            const p = service.validateCounterBelongsToStore('ten1', 'cnt1', 'store1');
            await expect(p).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException when counter belongs to a different store', async () => {
            db.posCounter.findUnique.mockResolvedValue({
                id: 'cnt1',
                tenant_id: 'ten1',
                store_id: 'other-store',
                status: 'ACTIVE',
            });

            const p = service.validateCounterBelongsToStore('ten1', 'cnt1', 'store1');
            await expect(p).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException when counter is inactive', async () => {
            db.posCounter.findUnique.mockResolvedValue({
                id: 'cnt1',
                tenant_id: 'ten1',
                store_id: 'store1',
                status: 'INACTIVE',
            });

            const p = service.validateCounterBelongsToStore('ten1', 'cnt1', 'store1');
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('Counter is inactive');
        });
    });
});
