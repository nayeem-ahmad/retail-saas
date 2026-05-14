import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GetSalesByProductDto, GetSalesSummaryDto } from './sales-reports.dto';

@Injectable()
export class SalesReportsService {
    constructor(private db: DatabaseService) {}

    async getSalesSummary(tenantId: string, query: GetSalesSummaryDto) {
        const dateFilter = buildDateWindow(query.from, query.to);

        const sales = await this.db.sale.findMany({
            where: {
                tenant_id: tenantId,
                status: 'COMPLETED',
                ...(query.storeId ? { store_id: query.storeId } : {}),
                ...dateFilter,
            },
            select: {
                id: true,
                total_amount: true,
                created_at: true,
            },
            orderBy: { created_at: 'asc' },
        });

        const returns = await this.db.salesReturn.findMany({
            where: {
                tenant_id: tenantId,
                ...(query.storeId ? { store_id: query.storeId } : {}),
                ...dateFilter,
            },
            select: {
                total_refund: true,
                created_at: true,
            },
        });

        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const totalReturns = returns.reduce((sum, r) => sum + Number(r.total_refund), 0);
        const transactionCount = sales.length;
        const netRevenue = totalRevenue - totalReturns;
        const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        // Build daily breakdown map
        const dayMap = new Map<string, { transactions: number; grossRevenue: number; returns: number }>();

        for (const sale of sales) {
            const day = sale.created_at.toISOString().slice(0, 10);
            const existing = dayMap.get(day) ?? { transactions: 0, grossRevenue: 0, returns: 0 };
            existing.transactions += 1;
            existing.grossRevenue += Number(sale.total_amount);
            dayMap.set(day, existing);
        }

        for (const ret of returns) {
            const day = ret.created_at.toISOString().slice(0, 10);
            const existing = dayMap.get(day) ?? { transactions: 0, grossRevenue: 0, returns: 0 };
            existing.returns += Number(ret.total_refund);
            dayMap.set(day, existing);
        }

        const rows = Array.from(dayMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({
                date,
                transactions: data.transactions,
                grossRevenue: data.grossRevenue,
                returns: data.returns,
                netRevenue: data.grossRevenue - data.returns,
            }));

        return {
            summary: {
                totalRevenue,
                totalReturns,
                netRevenue,
                transactionCount,
                avgOrderValue,
            },
            rows,
        };
    }

    async getSalesByProduct(tenantId: string, query: GetSalesByProductDto) {
        const dateFilter = buildDateWindow(query.from, query.to);

        const saleItems = await this.db.saleItem.findMany({
            where: {
                sale: {
                    tenant_id: tenantId,
                    status: 'COMPLETED',
                    ...(query.storeId ? { store_id: query.storeId } : {}),
                    ...dateFilter,
                },
                ...(query.groupId || query.subgroupId
                    ? {
                          product: {
                              ...(query.groupId ? { group_id: query.groupId } : {}),
                              ...(query.subgroupId ? { subgroup_id: query.subgroupId } : {}),
                          },
                      }
                    : {}),
            },
            include: {
                product: {
                    include: {
                        group: true,
                        subgroup: true,
                    },
                },
            },
        });

        // Aggregate by product
        const productMap = new Map<
            string,
            {
                product: (typeof saleItems)[0]['product'];
                unitsSold: number;
                revenue: number;
            }
        >();

        for (const item of saleItems) {
            const existing = productMap.get(item.product_id) ?? {
                product: item.product,
                unitsSold: 0,
                revenue: 0,
            };
            existing.unitsSold += item.quantity;
            existing.revenue += item.quantity * Number(item.price_at_sale);
            productMap.set(item.product_id, existing);
        }

        const rows = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);

        const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
        const totalUnitsSold = rows.reduce((sum, r) => sum + r.unitsSold, 0);

        return {
            summary: {
                totalRevenue,
                totalUnitsSold,
                productCount: rows.length,
            },
            rows: rows.map((r) => ({
                ...r,
                revenueShare: totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0,
            })),
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
