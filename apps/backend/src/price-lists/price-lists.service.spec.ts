import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PriceListsService } from './price-lists.service';
import { DatabaseService } from '../database/database.service';

describe('PriceListsService', () => {
    let service: PriceListsService;
    let db: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        db = {
            priceList: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                updateMany: jest.fn(),
            },
            priceListItem: {
                findMany: jest.fn(),
                count: jest.fn(),
                upsert: jest.fn(),
                createMany: jest.fn(),
            },
            product: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
            },
            customerGroup: {
                findFirst: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(db)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PriceListsService,
                { provide: DatabaseService, useValue: db },
            ],
        }).compile();

        service = module.get<PriceListsService>(PriceListsService);
    });

    // ─── importRows ─────────────────────────────────────────────────────────────

    describe('importRows', () => {
        const tenantId = 'tenant-1';

        it('creates new price lists', async () => {
            db.priceList.findUnique.mockResolvedValue(null);
            db.priceList.create.mockResolvedValue({});
            const result = await service.importRows(tenantId, [{ name: 'Premium', description: 'Premium pricing' }], 'skip');
            expect(result).toEqual({ created: 1, updated: 0, skipped: 0, errors: [] });
            expect(db.priceList.create).toHaveBeenCalledWith({
                data: { tenant_id: tenantId, name: 'Premium', description: 'Premium pricing' },
            });
        });

        it('skips duplicate when mode is skip', async () => {
            db.priceList.findUnique.mockResolvedValue({ id: 'pl-1' });
            const result = await service.importRows(tenantId, [{ name: 'Premium' }], 'skip');
            expect(result).toEqual({ created: 0, updated: 0, skipped: 1, errors: [] });
            expect(db.priceList.create).not.toHaveBeenCalled();
        });

        it('updates duplicate when mode is upsert', async () => {
            db.priceList.findUnique.mockResolvedValue({ id: 'pl-1' });
            db.priceList.update.mockResolvedValue({});
            const result = await service.importRows(tenantId, [{ name: 'Premium', description: 'Updated' }], 'upsert');
            expect(result).toEqual({ created: 0, updated: 1, skipped: 0, errors: [] });
            expect(db.priceList.update).toHaveBeenCalledWith({
                where: { id: 'pl-1' },
                data: { name: 'Premium', description: 'Updated' },
            });
        });

        it('errors on missing required name field', async () => {
            const result = await service.importRows(tenantId, [{ description: 'no name' }], 'skip');
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toMatch(/Row 2.*name/);
            expect(db.priceList.create).not.toHaveBeenCalled();
        });

        it('continues on row error and processes remaining rows', async () => {
            db.priceList.findUnique.mockResolvedValue(null);
            db.priceList.create.mockRejectedValueOnce(new Error('DB error')).mockResolvedValueOnce({});
            const result = await service.importRows(tenantId, [{ name: 'A' }, { name: 'B' }], 'skip');
            expect(result.created).toBe(1);
            expect(result.errors).toHaveLength(1);
        });
    });
});
