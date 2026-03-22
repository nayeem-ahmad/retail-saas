import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { InventoryReportsService } from './inventory-reports.service';

describe('InventoryReportsService', () => {
    let service: InventoryReportsService;
    let db: any;

    beforeEach(async () => {
        db = {
            inventorySettings: { findUnique: jest.fn() },
            product: { findMany: jest.fn() },
            warehouseTransferItem: { findMany: jest.fn() },
            inventoryShrinkage: { findMany: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [InventoryReportsService, { provide: DatabaseService, useValue: db }],
        }).compile();

        service = module.get(InventoryReportsService);
    });

    it('calculates reorder suggestions using on-hand stock, defaults, and in-transit quantities', async () => {
        db.inventorySettings.findUnique.mockResolvedValue({ default_reorder_level: 10, default_safety_stock: 2, default_lead_time_days: 4 });
        db.product.findMany.mockResolvedValue([
            { id: 'prod-1', name: 'Coffee', reorder_level: null, safety_stock: null, lead_time_days: null, stocks: [{ quantity: 5 }], group: null, subgroup: null },
        ]);
        db.warehouseTransferItem.findMany.mockResolvedValue([{ product_id: 'prod-1', quantity_sent: 4, quantity_received: 1 }]);

        const [row] = await service.getReorderSuggestions('tenant-1', {});

        expect(row.onHand).toBe(5);
        expect(row.inTransit).toBe(3);
        expect(row.targetStock).toBe(12);
        expect(row.suggestedQuantity).toBe(4);
    });

    it('returns explicit unconfigured rows when stock policy data is missing', async () => {
        db.inventorySettings.findUnique.mockResolvedValue(null);
        db.product.findMany.mockResolvedValue([
            { id: 'prod-1', name: 'Coffee', reorder_level: null, safety_stock: null, lead_time_days: null, stocks: [{ quantity: 1 }], group: null, subgroup: null },
        ]);
        db.warehouseTransferItem.findMany.mockResolvedValue([]);

        const [row] = await service.getReorderSuggestions('tenant-1', {});
        expect(row.configSource).toBe('UNCONFIGURED');
        expect(row.shortageReason).toMatch(/Missing stock policy configuration/);
    });

    it('calculates inventory valuation summary and row values', async () => {
        db.product.findMany.mockResolvedValue([
            { id: 'prod-1', name: 'Coffee', price: 10, stocks: [{ quantity: 3 }], group: null, subgroup: null },
            { id: 'prod-2', name: 'Tea', price: 5, stocks: [{ quantity: 2 }], group: null, subgroup: null },
        ]);

        const result = await service.getInventoryValuation('tenant-1', {});

        expect(result.summary.totalQuantity).toBe(5);
        expect(result.summary.totalStockValue).toBe(40);
        expect(result.summary.productCount).toBe(2);
        expect(result.rows[0].stockValue).toBe(30);
    });

    it('groups shrinkage summary by warehouse and reason', async () => {
        db.inventoryShrinkage.findMany.mockResolvedValue([
            {
                id: 'shr-1',
                reference_number: 'SHR-001',
                created_at: new Date('2024-01-15T00:00:00.000Z'),
                warehouse: { id: 'wh-1', name: 'Main Warehouse' },
                reason: { id: 'reason-1', label: 'Damaged' },
                items: [
                    {
                        product_id: 'prod-1',
                        quantity: 2,
                        unit_cost: 6,
                        product: { id: 'prod-1', name: 'Coffee', price: 8, group_id: null, subgroup_id: null, group: null, subgroup: null },
                    },
                ],
            },
        ]);

        const result = await service.getShrinkageSummary('tenant-1', {});

        expect(result.summary.totalQuantity).toBe(2);
        expect(result.summary.totalValue).toBe(12);
        expect(result.rows[0]).toEqual(
            expect.objectContaining({ warehouseName: 'Main Warehouse', reasonLabel: 'Damaged', quantity: 2, value: 12 }),
        );
    });
});