import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
    CreateWarehouseDto,
    CreateInventoryReasonDto,
    ListInventoryReasonsQueryDto,
    ListStockLedgerQueryDto,
    UpdateInventoryReasonDto,
    UpdateInventorySettingsDto,
    UpdateWarehouseDto,
} from './inventory.dto';
import { assertWarehouseBelongsToTenant, ensureDefaultWarehouse } from '../database/inventory.utils';

@Injectable()
export class InventoryService {
    constructor(private db: DatabaseService) {}

    async getWarehouses(tenantId: string) {
        return this.db.warehouse.findMany({
            where: { tenant_id: tenantId },
            orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
        });
    }

    async createWarehouse(tenantId: string, dto: CreateWarehouseDto) {
        const store = await this.db.store.findFirst({ where: { id: dto.storeId, tenant_id: tenantId } });
        if (!store) {
            throw new BadRequestException('Store not found for this tenant.');
        }

        const code = dto.code?.trim() || await this.generateWarehouseCode(tenantId, dto.name);
        const duplicate = await this.db.warehouse.findFirst({ where: { tenant_id: tenantId, code } });
        if (duplicate) {
            throw new BadRequestException('A warehouse with this code already exists.');
        }

        return this.db.$transaction(async (tx) => {
            if (dto.isDefault) {
                await tx.warehouse.updateMany({
                    where: { tenant_id: tenantId, store_id: dto.storeId },
                    data: { is_default: false },
                });
            }

            return tx.warehouse.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    name: dto.name,
                    code,
                    is_default: dto.isDefault ?? false,
                    is_active: true,
                },
            });
        });
    }

    async updateWarehouse(tenantId: string, id: string, dto: UpdateWarehouseDto) {
        const warehouse = await assertWarehouseBelongsToTenant(this.db as any, tenantId, id);

        if (dto.code && dto.code !== warehouse.code) {
            const duplicate = await this.db.warehouse.findFirst({
                where: { tenant_id: tenantId, code: dto.code, NOT: { id } },
            });
            if (duplicate) {
                throw new BadRequestException('A warehouse with this code already exists.');
            }
        }

        return this.db.$transaction(async (tx) => {
            if (dto.isDefault) {
                await tx.warehouse.updateMany({
                    where: { tenant_id: tenantId, store_id: warehouse.store_id },
                    data: { is_default: false },
                });
            }

            return tx.warehouse.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined ? { name: dto.name } : {}),
                    ...(dto.code !== undefined ? { code: dto.code } : {}),
                    ...(dto.isDefault !== undefined ? { is_default: dto.isDefault } : {}),
                    ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
                },
            });
        });
    }

    async getSettings(tenantId: string) {
        return this.ensureSettings(tenantId);
    }

    async updateSettings(tenantId: string, dto: UpdateInventorySettingsDto) {
        const current = await this.ensureSettings(tenantId);
        await this.assertWarehouseOwnership(tenantId, dto.defaultProductWarehouseId);
        await this.assertWarehouseOwnership(tenantId, dto.defaultPurchaseWarehouseId);
        await this.assertWarehouseOwnership(tenantId, dto.defaultSalesWarehouseId);
        await this.assertWarehouseOwnership(tenantId, dto.defaultShrinkageWarehouseId);
        await this.assertWarehouseOwnership(tenantId, dto.defaultTransferSourceWarehouseId);
        await this.assertWarehouseOwnership(tenantId, dto.defaultTransferDestinationWarehouseId);

        return this.db.inventorySettings.update({
            where: { tenant_id: tenantId },
            data: {
                ...(dto.defaultProductWarehouseId !== undefined ? { default_product_warehouse_id: dto.defaultProductWarehouseId || null } : {}),
                ...(dto.defaultPurchaseWarehouseId !== undefined ? { default_purchase_warehouse_id: dto.defaultPurchaseWarehouseId || null } : {}),
                ...(dto.defaultSalesWarehouseId !== undefined ? { default_sales_warehouse_id: dto.defaultSalesWarehouseId || null } : {}),
                ...(dto.defaultShrinkageWarehouseId !== undefined ? { default_shrinkage_warehouse_id: dto.defaultShrinkageWarehouseId || null } : {}),
            ...(dto.defaultTransferSourceWarehouseId !== undefined ? { default_transfer_source_warehouse_id: dto.defaultTransferSourceWarehouseId || null } : {}),
            ...(dto.defaultTransferDestinationWarehouseId !== undefined ? { default_transfer_destination_warehouse_id: dto.defaultTransferDestinationWarehouseId || null } : {}),
                ...(dto.defaultReorderLevel !== undefined ? { default_reorder_level: dto.defaultReorderLevel } : {}),
                ...(dto.defaultSafetyStock !== undefined ? { default_safety_stock: dto.defaultSafetyStock } : {}),
                ...(dto.defaultLeadTimeDays !== undefined ? { default_lead_time_days: dto.defaultLeadTimeDays } : {}),
                ...(dto.discrepancyApprovalThreshold !== undefined ? { discrepancy_approval_threshold: dto.discrepancyApprovalThreshold } : {}),
            },
            include: this.settingsInclude(),
        });
    }

    async listReasons(tenantId: string, query: ListInventoryReasonsQueryDto) {
        return this.db.inventoryReason.findMany({
            where: {
                tenant_id: tenantId,
                ...(query.type ? { type: query.type } : {}),
            },
            orderBy: [{ type: 'asc' }, { display_order: 'asc' }, { label: 'asc' }],
        });
    }

    async createReason(tenantId: string, dto: CreateInventoryReasonDto) {
        const existing = await this.db.inventoryReason.findUnique({
            where: {
                tenant_id_type_code: {
                    tenant_id: tenantId,
                    type: dto.type,
                    code: dto.code,
                },
            },
        });
        if (existing) {
            throw new BadRequestException('An inventory reason with this code already exists for the selected type.');
        }

        return this.db.inventoryReason.create({
            data: {
                tenant_id: tenantId,
                type: dto.type,
                code: dto.code,
                label: dto.label,
                display_order: dto.displayOrder ?? 0,
            },
        });
    }

    async updateReason(tenantId: string, id: string, dto: UpdateInventoryReasonDto) {
        const existing = await this.db.inventoryReason.findFirst({
            where: { id, tenant_id: tenantId },
        });

        if (!existing) {
            throw new BadRequestException('Inventory reason not found.');
        }

        if (existing.is_system && dto.isActive === false) {
            throw new BadRequestException('System inventory reasons cannot be deactivated.');
        }

        return this.db.inventoryReason.update({
            where: { id },
            data: {
                ...(dto.label !== undefined ? { label: dto.label } : {}),
                ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
                ...(dto.displayOrder !== undefined ? { display_order: dto.displayOrder } : {}),
            },
        });
    }

    async getLedger(tenantId: string, query: ListStockLedgerQueryDto) {
        const limit = query.limit ?? 200;
        return this.db.inventoryMovement.findMany({
            where: {
                tenant_id: tenantId,
                ...(query.productId ? { product_id: query.productId } : {}),
                ...(query.warehouseId ? { warehouse_id: query.warehouseId } : {}),
                ...(query.movementType ? { movement_type: query.movementType } : {}),
                ...buildDateWindow(query.from, query.to),
            },
            include: {
                product: {
                    include: { group: true, subgroup: true },
                },
                warehouse: true,
            },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
            take: limit,
        });
    }

    private async ensureSettings(tenantId: string) {
        let settings = await this.db.inventorySettings.findUnique({
            where: { tenant_id: tenantId },
            include: this.settingsInclude(),
        });

        if (settings) {
            return settings;
        }

        const warehouse = await ensureDefaultWarehouse(this.db as any, tenantId);
        settings = await this.db.inventorySettings.create({
            data: {
                tenant_id: tenantId,
                default_product_warehouse_id: warehouse.id,
                default_purchase_warehouse_id: warehouse.id,
                default_sales_warehouse_id: warehouse.id,
                default_shrinkage_warehouse_id: warehouse.id,
                default_transfer_source_warehouse_id: warehouse.id,
                default_transfer_destination_warehouse_id: warehouse.id,
            },
            include: this.settingsInclude(),
        });

        return settings;
    }

    private settingsInclude() {
        return {
            defaultProductWarehouse: true,
            defaultPurchaseWarehouse: true,
            defaultSalesWarehouse: true,
            defaultShrinkageWarehouse: true,
            defaultTransferSourceWarehouse: true,
            defaultTransferDestinationWarehouse: true,
        };
    }

    private async assertWarehouseOwnership(tenantId: string, warehouseId?: string) {
        if (!warehouseId) return;
        const warehouse = await this.db.warehouse.findFirst({
            where: { id: warehouseId, tenant_id: tenantId },
        });
        if (!warehouse) {
            throw new BadRequestException('Selected warehouse does not belong to this tenant.');
        }
    }

    private async generateWarehouseCode(tenantId: string, name: string) {
        const prefix = name
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 10) || 'WAREHOUSE';
        const count = await this.db.warehouse.count({ where: { tenant_id: tenantId, code: { startsWith: prefix } } });
        return count === 0 ? prefix : `${prefix}-${count + 1}`;
    }
}

function buildDateWindow(from?: string, to?: string) {
    const where: Record<string, any> = {};
    if (from || to) {
        where.created_at = {};
        if (from) {
            const date = new Date(from);
            if (!Number.isNaN(date.getTime())) where.created_at.gte = date;
        }
        if (to) {
            const date = new Date(to);
            if (!Number.isNaN(date.getTime())) where.created_at.lte = date;
        }
    }
    return where;
}