import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { InventoryShrinkageService } from './inventory-shrinkage.service';
import { applyInventoryMovement, assertWarehouseBelongsToTenant } from '../database/inventory.utils';

jest.mock('../database/inventory.utils', () => ({
    applyInventoryMovement: jest.fn(),
    assertWarehouseBelongsToTenant: jest.fn(),
}));

describe('InventoryShrinkageService', () => {
    let service: InventoryShrinkageService;
    let db: any;
    let tx: any;

    beforeEach(async () => {
        tx = {
            inventoryReason: { findFirst: jest.fn() },
            inventoryShrinkage: { count: jest.fn(), create: jest.fn() },
            product: { findMany: jest.fn() },
        };

        db = {
            $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
            inventoryShrinkage: { findMany: jest.fn(), findFirst: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [InventoryShrinkageService, { provide: DatabaseService, useValue: db }],
        }).compile();

        service = module.get(InventoryShrinkageService);
        (assertWarehouseBelongsToTenant as jest.Mock).mockResolvedValue({ id: 'wh-1' });
        (applyInventoryMovement as jest.Mock).mockResolvedValue(3);
    });

    it('creates a shrinkage record and posts negative inventory movement', async () => {
        tx.inventoryReason.findFirst.mockResolvedValue({ id: 'reason-1' });
        tx.inventoryShrinkage.count.mockResolvedValue(0);
        tx.product.findMany.mockResolvedValue([{ id: 'prod-1', price: 25 }]);
        tx.inventoryShrinkage.create.mockResolvedValue({ id: 'shrink-1', reference_number: 'SHR-00001' });

        const result = await service.create('tenant-1', {
            warehouseId: 'wh-1',
            reasonId: 'reason-1',
            items: [{ productId: 'prod-1', quantity: 2 }],
        });

        expect(applyInventoryMovement).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                productId: 'prod-1',
                warehouseId: 'wh-1',
                quantityDelta: -2,
                movementType: 'SHRINKAGE',
            }),
        );
        expect(result.reference_number).toBe('SHR-00001');
    });

    it('rejects duplicate product lines', async () => {
        await expect(
            service.create('tenant-1', {
                warehouseId: 'wh-1',
                reasonId: 'reason-1',
                items: [
                    { productId: 'prod-1', quantity: 1 },
                    { productId: 'prod-1', quantity: 2 },
                ],
            }),
        ).rejects.toThrow(BadRequestException);
    });

    it('throws when a shrinkage record is missing', async () => {
        db.inventoryShrinkage.findFirst.mockResolvedValue(null);
        await expect(service.findOne('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
});