import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GetInventoryValuationDto, GetReorderSuggestionsDto, GetShrinkageSummaryDto } from './inventory-reports.dto';

@Injectable()
export class InventoryReportsService {
    constructor(private db: DatabaseService) {}

    async getReorderSuggestions(tenantId: string, query: GetReorderSuggestionsDto) {
        const settings = await this.db.inventorySettings.findUnique({
            where: { tenant_id: tenantId },
        });

        const products = await this.db.product.findMany({
            where: {
                tenant_id: tenantId,
                ...(query.groupId ? { group_id: query.groupId } : {}),
                ...(query.subgroupId ? { subgroup_id: query.subgroupId } : {}),
            },
            include: {
                group: true,
                subgroup: true,
                stocks: {
                    where: query.warehouseId ? { warehouse_id: query.warehouseId } : undefined,
                    include: { warehouse: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        const inTransitItems = await this.db.warehouseTransferItem.findMany({
            where: {
                transfer: {
                    tenant_id: tenantId,
                    status: { in: ['SENT', 'PARTIALLY_RECEIVED'] },
                    ...(query.warehouseId ? { destination_warehouse_id: query.warehouseId } : {}),
                },
            },
            include: {
                transfer: {
                    include: { destinationWarehouse: true },
                },
            },
        });

        const inTransitByProduct = new Map<string, number>();
        for (const item of inTransitItems) {
            const outstanding = item.quantity_sent - item.quantity_received;
            if (outstanding <= 0) continue;
            inTransitByProduct.set(item.product_id, (inTransitByProduct.get(item.product_id) ?? 0) + outstanding);
        }

        return products
            .map((product) => {
                const reorderLevel = product.reorder_level ?? settings?.default_reorder_level ?? null;
                const safetyStock = product.safety_stock ?? settings?.default_safety_stock ?? null;
                const leadTimeDays = product.lead_time_days ?? settings?.default_lead_time_days ?? null;
                const onHand = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
                const inTransit = inTransitByProduct.get(product.id) ?? 0;

                if (reorderLevel === null || safetyStock === null) {
                    return {
                        product,
                        onHand,
                        inTransit,
                        targetStock: null,
                        suggestedQuantity: 0,
                        shortageReason: 'Missing stock policy configuration',
                        configSource: 'UNCONFIGURED',
                        leadTimeDays,
                    };
                }

                const targetStock = reorderLevel + safetyStock;
                const suggestedQuantity = Math.max(0, targetStock - (onHand + inTransit));
                return {
                    product,
                    onHand,
                    inTransit,
                    targetStock,
                    suggestedQuantity,
                    shortageReason:
                        suggestedQuantity > 0
                            ? `On hand ${onHand} + in transit ${inTransit} is below target ${targetStock}`
                            : 'Stock is currently above threshold',
                    configSource:
                        product.reorder_level !== null || product.safety_stock !== null || product.lead_time_days !== null
                            ? 'PRODUCT'
                            : 'DEFAULT',
                    leadTimeDays,
                };
            })
            .filter((row) => row.suggestedQuantity > 0 || row.configSource === 'UNCONFIGURED');
    }

    async getInventoryValuation(tenantId: string, query: GetInventoryValuationDto) {
        const products = await this.db.product.findMany({
            where: {
                tenant_id: tenantId,
                ...(query.groupId ? { group_id: query.groupId } : {}),
                ...(query.subgroupId ? { subgroup_id: query.subgroupId } : {}),
            },
            include: {
                group: true,
                subgroup: true,
                stocks: {
                    where: query.warehouseId ? { warehouse_id: query.warehouseId } : undefined,
                    include: { warehouse: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        const rows = products.map((product) => {
            const quantity = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
            const unitValue = Number(product.price || 0);
            const stockValue = quantity * unitValue;
            return {
                product,
                quantity,
                unitValue,
                stockValue,
            };
        });

        const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
        const totalStockValue = rows.reduce((sum, row) => sum + row.stockValue, 0);
        const productCount = rows.filter((row) => row.quantity > 0).length;

        return {
            summary: {
                totalQuantity,
                totalStockValue,
                productCount,
                averageUnitValue: productCount > 0 ? totalStockValue / Math.max(totalQuantity, 1) : 0,
            },
            rows,
        };
    }

    async getShrinkageSummary(tenantId: string, query: GetShrinkageSummaryDto) {
        const rows = await this.db.inventoryShrinkage.findMany({
            where: {
                tenant_id: tenantId,
                ...(query.warehouseId ? { warehouse_id: query.warehouseId } : {}),
                ...(query.reasonId ? { reason_id: query.reasonId } : {}),
                ...buildDateWindow(query.from, query.to),
                ...(query.productId || query.groupId || query.subgroupId
                    ? {
                          items: {
                              some: {
                                  ...(query.productId ? { product_id: query.productId } : {}),
                                  ...(query.groupId || query.subgroupId
                                      ? {
                                            product: {
                                                ...(query.groupId ? { group_id: query.groupId } : {}),
                                                ...(query.subgroupId ? { subgroup_id: query.subgroupId } : {}),
                                            },
                                        }
                                      : {}),
                              },
                          },
                      }
                    : {}),
            },
            include: {
                warehouse: true,
                reason: true,
                items: {
                    include: {
                        product: {
                            include: { group: true, subgroup: true },
                        },
                    },
                },
            },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        });

        const detailRows = rows.flatMap((record) =>
            record.items
                .filter((item) => {
                    if (query.productId && item.product_id !== query.productId) return false;
                    if (query.groupId && item.product.group_id !== query.groupId) return false;
                    if (query.subgroupId && item.product.subgroup_id !== query.subgroupId) return false;
                    return true;
                })
                .map((item) => ({
                    shrinkageId: record.id,
                    referenceNumber: record.reference_number,
                    createdAt: record.created_at,
                    warehouse: record.warehouse,
                    reason: record.reason,
                    product: item.product,
                    quantity: item.quantity,
                    unitCost: Number(item.unit_cost ?? item.product.price ?? 0),
                    estimatedValue: item.quantity * Number(item.unit_cost ?? item.product.price ?? 0),
                })),
        );

        const totalQuantity = detailRows.reduce((sum, row) => sum + row.quantity, 0);
        const totalValue = detailRows.reduce((sum, row) => sum + row.estimatedValue, 0);
        const grouped = new Map<string, { warehouseName: string; reasonLabel: string; quantity: number; value: number }>();

        for (const row of detailRows) {
            const key = `${row.warehouse.id}:${row.reason.id}`;
            const current = grouped.get(key) ?? {
                warehouseName: row.warehouse.name,
                reasonLabel: row.reason.label,
                quantity: 0,
                value: 0,
            };
            current.quantity += row.quantity;
            current.value += row.estimatedValue;
            grouped.set(key, current);
        }

        const groupedRows = Array.from(grouped.values()).sort((left, right) => right.value - left.value);

        return {
            summary: {
                totalQuantity,
                totalValue,
                costingMethod: 'CURRENT_SELLING_PRICE',
                topReasons: groupedRows.slice(0, 5),
            },
            rows: groupedRows,
            detailRows,
        };
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