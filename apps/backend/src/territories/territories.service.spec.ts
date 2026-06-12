import { Test, TestingModule } from '@nestjs/testing';
import { TerritoriesService } from './territories.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TerritoriesService', () => {
    let service: TerritoriesService;
    let db: any;

    beforeEach(async () => {
        db = {
            territory: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (cb: any) => cb(db)),
            $queryRaw: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TerritoriesService,
                { provide: DatabaseService, useValue: db },
            ],
        }).compile();

        service = module.get<TerritoriesService>(TerritoriesService);
        jest.clearAllMocks();
    });

    // ── create ────────────────────────────────────────────────────────────────

    describe('create()', () => {
        it('creates a root territory when name is unique', async () => {
            db.territory.findFirst.mockResolvedValue(null);
            db.territory.create.mockResolvedValue({ id: 't1', name: 'Dhaka', tenant_id: 'ten1' });

            const result = await service.create('ten1', { name: 'Dhaka' });

            expect(result.id).toBe('t1');
            expect(db.territory.create).toHaveBeenCalledWith({
                data: { tenant_id: 'ten1', name: 'Dhaka' },
            });
        });

        it('throws BadRequestException when duplicate name exists under same parent', async () => {
            db.territory.findFirst.mockResolvedValueOnce({ id: 'existing' });

            const p = service.create('ten1', { name: 'Dhaka', parent_id: 'p1' });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('already exists');
        });

        it('creates a child territory when parent exists', async () => {
            // first findFirst (duplicate check) → null
            // second findFirst (parent check) → parent record
            db.territory.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'parent1', tenant_id: 'ten1' });
            db.territory.create.mockResolvedValue({ id: 't2', name: 'Mirpur', parent_id: 'parent1' });

            const result = await service.create('ten1', { name: 'Mirpur', parent_id: 'parent1' });
            expect(result.id).toBe('t2');
        });

        it('throws BadRequestException when parent_id does not exist', async () => {
            db.territory.findFirst
                .mockResolvedValueOnce(null)   // no duplicate
                .mockResolvedValueOnce(null);  // parent not found

            const p = service.create('ten1', { name: 'Sub', parent_id: 'ghost' });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('Parent territory not found');
        });
    });

    // ── findAll ───────────────────────────────────────────────────────────────

    describe('findAll()', () => {
        it('returns all territories for the tenant', async () => {
            const territories = [
                { id: 't1', name: 'Dhaka', _count: { customers: 2, children: 1 } },
                { id: 't2', name: 'Chittagong', _count: { customers: 0, children: 0 } },
            ];
            db.territory.findMany.mockResolvedValue(territories);
            db.territory.count.mockResolvedValue(2);

            const result = await service.findAll('ten1');

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(db.territory.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { tenant_id: 'ten1' } }),
            );
        });

        it('returns empty array when no territories exist', async () => {
            db.territory.findMany.mockResolvedValue([]);
            db.territory.count.mockResolvedValue(0);
            const result = await service.findAll('ten1');
            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
        });
    });

    // ── findOne ───────────────────────────────────────────────────────────────

    describe('findOne()', () => {
        it('returns the territory when found', async () => {
            const territory = { id: 't1', name: 'Dhaka', _count: { customers: 1, children: 0 } };
            db.territory.findFirst.mockResolvedValue(territory);

            const result = await service.findOne('ten1', 't1');
            expect(result.id).toBe('t1');
        });

        it('throws NotFoundException when territory does not exist', async () => {
            db.territory.findFirst.mockResolvedValue(null);

            const p = service.findOne('ten1', 'missing');
            await expect(p).rejects.toThrow(NotFoundException);
            await expect(p).rejects.toThrow('Territory not found');
        });
    });

    // ── update ────────────────────────────────────────────────────────────────

    describe('update()', () => {
        it('updates a territory when no duplicate name exists', async () => {
            const existing = { id: 't1', name: 'Old', _count: { customers: 0, children: 0 } };
            db.territory.findFirst
                .mockResolvedValueOnce(existing)   // findOne check
                .mockResolvedValueOnce(null);       // duplicate check
            db.territory.update.mockResolvedValue({ id: 't1', name: 'New' });

            const result = await service.update('ten1', 't1', { name: 'New' });
            expect(result.name).toBe('New');
        });

        it('throws NotFoundException when territory to update does not exist', async () => {
            db.territory.findFirst.mockResolvedValue(null);

            const p = service.update('ten1', 'ghost', { name: 'X' });
            await expect(p).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException when renamed to a conflicting name', async () => {
            const existing = { id: 't1', name: 'Old', _count: { customers: 0, children: 0 } };
            const duplicate = { id: 't99', name: 'New' };
            db.territory.findFirst
                .mockResolvedValueOnce(existing)   // findOne check
                .mockResolvedValueOnce(duplicate); // duplicate name check

            const p = service.update('ten1', 't1', { name: 'New' });
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('already exists');
        });

        it('skips duplicate check when dto has no name', async () => {
            const existing = { id: 't1', name: 'Old', _count: { customers: 0, children: 0 } };
            db.territory.findFirst.mockResolvedValueOnce(existing);
            db.territory.update.mockResolvedValue({ id: 't1' });

            await service.update('ten1', 't1', {});
            // duplicate findFirst should NOT have been called a second time
            expect(db.territory.findFirst).toHaveBeenCalledTimes(1);
        });
    });

    // ── remove ────────────────────────────────────────────────────────────────

    describe('remove()', () => {
        it('deletes territory when no customers or children', async () => {
            const territory = { id: 't1', _count: { customers: 0, children: 0 } };
            db.territory.findFirst.mockResolvedValue(territory);
            db.territory.delete.mockResolvedValue(territory);

            const result = await service.remove('ten1', 't1');
            expect(db.territory.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
            expect(result).toEqual(territory);
        });

        it('throws BadRequestException when territory has customers', async () => {
            const territory = { id: 't1', _count: { customers: 3, children: 0 } };
            db.territory.findFirst.mockResolvedValue(territory);

            const p = service.remove('ten1', 't1');
            await expect(p).rejects.toThrow(BadRequestException);
            await expect(p).rejects.toThrow('associated customers or child territories');
        });

        it('throws BadRequestException when territory has children', async () => {
            const territory = { id: 't1', _count: { customers: 0, children: 2 } };
            db.territory.findFirst.mockResolvedValue(territory);

            const p = service.remove('ten1', 't1');
            await expect(p).rejects.toThrow(BadRequestException);
        });

        it('throws NotFoundException when territory does not exist', async () => {
            db.territory.findFirst.mockResolvedValue(null);

            const p = service.remove('ten1', 'missing');
            await expect(p).rejects.toThrow(NotFoundException);
        });
    });
});
