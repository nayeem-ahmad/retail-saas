import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductGroupsService } from './product-groups.service';
import { DatabaseService } from '../database/database.service';

describe('ProductGroupsService', () => {
    let service: ProductGroupsService;
    let db: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        db = {
            productGroup: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductGroupsService,
                { provide: DatabaseService, useValue: db },
            ],
        }).compile();

        service = module.get<ProductGroupsService>(ProductGroupsService);
    });

    // ─── create ────────────────────────────────────────────────────────────────

    describe('create', () => {
        const tenantId = 'tenant-1';
        const dto = { name: 'Electronics', description: 'Electronic goods' };

        it('should create a product group when name is unique', async () => {
            db.productGroup.findUnique.mockResolvedValue(null);
            const created = { id: 'pg-1', tenant_id: tenantId, ...dto };
            db.productGroup.create.mockResolvedValue(created);

            const result = await service.create(tenantId, dto as any);

            expect(db.productGroup.findUnique).toHaveBeenCalledWith({
                where: { tenant_id_name: { tenant_id: tenantId, name: dto.name } },
            });
            expect(db.productGroup.create).toHaveBeenCalledWith({
                data: { tenant_id: tenantId, ...dto },
            });
            expect(result).toEqual(created);
        });

        it('should throw BadRequestException when name already exists', async () => {
            db.productGroup.findUnique.mockResolvedValue({ id: 'existing' });

            const promise = service.create(tenantId, dto as any);

            await expect(promise).rejects.toThrow(BadRequestException);
            await expect(promise).rejects.toThrow(
                'A product group with this name already exists.',
            );
            expect(db.productGroup.create).not.toHaveBeenCalled();
        });
    });

    // ─── findAll ────────────────────────────────────────────────────────────────

    describe('findAll', () => {
        it('should return all product groups with counts', async () => {
            const tenantId = 'tenant-1';
            const groups = [
                { id: 'pg-1', name: 'Electronics', _count: { subgroups: 3, products: 10 } },
                { id: 'pg-2', name: 'Clothing', _count: { subgroups: 2, products: 5 } },
            ];
            db.productGroup.findMany.mockResolvedValue(groups);

            const result = await service.findAll(tenantId);

            expect(db.productGroup.findMany).toHaveBeenCalledWith({
                where: { tenant_id: tenantId },
                include: { _count: { select: { subgroups: true, products: true } } },
                orderBy: { name: 'asc' },
            });
            expect(result).toEqual(groups);
        });

        it('should return empty array when no groups exist', async () => {
            db.productGroup.findMany.mockResolvedValue([]);

            const result = await service.findAll('tenant-empty');

            expect(result).toEqual([]);
        });
    });

    // ─── findOne ────────────────────────────────────────────────────────────────

    describe('findOne', () => {
        const tenantId = 'tenant-1';
        const groupId = 'pg-1';

        it('should return a product group by id', async () => {
            const group = {
                id: groupId,
                name: 'Electronics',
                _count: { subgroups: 2, products: 8 },
            };
            db.productGroup.findFirst.mockResolvedValue(group);

            const result = await service.findOne(tenantId, groupId);

            expect(db.productGroup.findFirst).toHaveBeenCalledWith({
                where: { id: groupId, tenant_id: tenantId },
                include: { _count: { select: { subgroups: true, products: true } } },
            });
            expect(result).toEqual(group);
        });

        it('should throw NotFoundException when group not found', async () => {
            db.productGroup.findFirst.mockResolvedValue(null);

            const promise = service.findOne(tenantId, 'nonexistent');

            await expect(promise).rejects.toThrow(NotFoundException);
            await expect(promise).rejects.toThrow('Product group not found');
        });
    });

    // ─── update ────────────────────────────────────────────────────────────────

    describe('update', () => {
        const tenantId = 'tenant-1';
        const groupId = 'pg-1';
        const existingGroup = {
            id: groupId,
            name: 'Electronics',
            _count: { subgroups: 1, products: 3 },
        };

        it('should update a product group with new unique name', async () => {
            const dto = { name: 'Consumer Electronics' };
            db.productGroup.findFirst
                .mockResolvedValueOnce(existingGroup)   // findOne
                .mockResolvedValueOnce(null);            // duplicate check
            const updated = { ...existingGroup, name: dto.name };
            db.productGroup.update.mockResolvedValue(updated);

            const result = await service.update(tenantId, groupId, dto as any);

            expect(db.productGroup.findFirst).toHaveBeenCalledTimes(2);
            expect(db.productGroup.update).toHaveBeenCalledWith({
                where: { id: groupId },
                data: dto,
            });
            expect(result).toEqual(updated);
        });

        it('should update without duplicate check when name not provided', async () => {
            const dto = { description: 'Updated description' };
            db.productGroup.findFirst.mockResolvedValueOnce(existingGroup);
            db.productGroup.update.mockResolvedValue({ ...existingGroup, ...dto });

            await service.update(tenantId, groupId, dto as any);

            expect(db.productGroup.findFirst).toHaveBeenCalledTimes(1);
            expect(db.productGroup.update).toHaveBeenCalled();
        });

        it('should throw NotFoundException when group not found', async () => {
            db.productGroup.findFirst.mockResolvedValue(null);

            const promise = service.update(tenantId, 'nonexistent', { name: 'X' } as any);

            await expect(promise).rejects.toThrow(NotFoundException);
            expect(db.productGroup.update).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when new name conflicts', async () => {
            const dto = { name: 'Clothing' };
            db.productGroup.findFirst
                .mockResolvedValueOnce(existingGroup)
                .mockResolvedValueOnce({ id: 'other-pg' });

            const promise = service.update(tenantId, groupId, dto as any);

            await expect(promise).rejects.toThrow(BadRequestException);
            await expect(promise).rejects.toThrow(
                'A product group with this name already exists.',
            );
            expect(db.productGroup.update).not.toHaveBeenCalled();
        });
    });

    // ─── remove ────────────────────────────────────────────────────────────────

    describe('remove', () => {
        const tenantId = 'tenant-1';
        const groupId = 'pg-1';

        it('should delete a group with no products or subgroups', async () => {
            const group = { id: groupId, name: 'Empty Group', _count: { subgroups: 0, products: 0 } };
            db.productGroup.findFirst.mockResolvedValue(group);
            db.productGroup.delete.mockResolvedValue(group);

            const result = await service.remove(tenantId, groupId);

            expect(db.productGroup.delete).toHaveBeenCalledWith({ where: { id: groupId } });
            expect(result).toEqual(group);
        });

        it('should throw BadRequestException when group has products', async () => {
            const group = { id: groupId, name: 'Electronics', _count: { subgroups: 0, products: 5 } };
            db.productGroup.findFirst.mockResolvedValue(group);

            const promise = service.remove(tenantId, groupId);

            await expect(promise).rejects.toThrow(BadRequestException);
            await expect(promise).rejects.toThrow(
                'Cannot delete this product group — it has associated products or subgroups.',
            );
            expect(db.productGroup.delete).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when group has subgroups', async () => {
            const group = { id: groupId, name: 'Electronics', _count: { subgroups: 2, products: 0 } };
            db.productGroup.findFirst.mockResolvedValue(group);

            const promise = service.remove(tenantId, groupId);

            await expect(promise).rejects.toThrow(BadRequestException);
            await expect(promise).rejects.toThrow(
                'Cannot delete this product group — it has associated products or subgroups.',
            );
            expect(db.productGroup.delete).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when group has both products and subgroups', async () => {
            const group = { id: groupId, name: 'Electronics', _count: { subgroups: 3, products: 8 } };
            db.productGroup.findFirst.mockResolvedValue(group);

            const promise = service.remove(tenantId, groupId);

            await expect(promise).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when group does not exist', async () => {
            db.productGroup.findFirst.mockResolvedValue(null);

            const promise = service.remove(tenantId, 'nonexistent');

            await expect(promise).rejects.toThrow(NotFoundException);
            expect(db.productGroup.delete).not.toHaveBeenCalled();
        });
    });
});
