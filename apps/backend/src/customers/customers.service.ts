import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

@Injectable()
export class CustomersService {
    constructor(private db: DatabaseService) {}

    private async generateCustomerCode(tenantId: string): Promise<string> {
        const last = await this.db.customer.findFirst({
            where: { tenant_id: tenantId },
            orderBy: { customer_code: 'desc' },
            select: { customer_code: true },
        });

        if (!last) return 'CUST-00001';

        const match = last.customer_code.match(/CUST-(\d+)/);
        const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
        return `CUST-${String(nextNum).padStart(5, '0')}`;
    }

    async create(tenantId: string, dto: CreateCustomerDto) {
        const existing = await this.db.customer.findUnique({
            where: {
                tenant_id_phone: {
                    tenant_id: tenantId,
                    phone: dto.phone,
                }
            }
        });

        if (existing) {
            throw new BadRequestException('A customer with this phone number already exists.');
        }

        const customer_code = await this.generateCustomerCode(tenantId);

        return this.db.customer.create({
            data: {
                tenant_id: tenantId,
                customer_code,
                ...dto
            },
            include: {
                customerGroup: true,
                territory: true,
            }
        });
    }

    async findAll(tenantId: string) {
        return this.db.customer.findMany({
            where: { tenant_id: tenantId },
            include: {
                customerGroup: true,
                territory: true,
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async findOne(tenantId: string, id: string) {
        const customer = await this.db.customer.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                customerGroup: true,
                territory: true,
                sales: {
                    include: { items: { include: { product: true } } },
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        
        if (!customer) throw new NotFoundException('Customer not found');
        return customer;
    }

    async getSegmentStats(tenantId: string) {
        const customers = await this.db.customer.findMany({
            where: { tenant_id: tenantId },
            select: { segment_category: true },
        });

        const counts: Record<string, number> = {};
        for (const c of customers) {
            const seg = c.segment_category || 'Regular';
            counts[seg] = (counts[seg] || 0) + 1;
        }

        const total = customers.length;
        return {
            total,
            breakdown: Object.entries(counts).map(([segment, count]) => ({
                segment,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            })),
        };
    }

    async getHistory(tenantId: string, id: string) {
        const customer = await this.db.customer.findFirst({
            where: { id, tenant_id: tenantId },
            select: {
                id: true,
                name: true,
                customer_code: true,
                segment_category: true,
                total_spent: true,
                created_at: true,
            },
        });

        if (!customer) throw new NotFoundException('Customer not found');

        const sales = await this.db.sale.findMany({
            where: { customer_id: id, tenant_id: tenantId },
            include: { items: { include: { product: true } } },
            orderBy: { created_at: 'desc' },
        });

        const totalOrders = sales.length;
        const avgOrderValue = totalOrders > 0
            ? Math.round((sales.reduce((sum, s) => sum + Number(s.total_amount), 0) / totalOrders) * 100) / 100
            : 0;
        const lastPurchaseDate = sales[0]?.created_at ?? null;

        // Key by product_id to correctly handle products that share a name
        const productMap: Record<string, { name: string; qty: number; value: number }> = {};
        for (const sale of sales) {
            for (const item of sale.items) {
                const key = item.product_id;
                const name = item.product?.name ?? 'Unknown';
                if (!productMap[key]) productMap[key] = { name, qty: 0, value: 0 };
                productMap[key].qty += item.quantity;
                productMap[key].value += Math.round(Number(item.price_at_sale) * item.quantity * 100) / 100;
            }
        }
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        return {
            customer,
            summary: {
                totalOrders,
                totalSpent: Number(customer.total_spent),
                avgOrderValue,
                lastPurchaseDate,
            },
            topProducts,
            sales,
        };
    }

    async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
        const customer = await this.db.customer.findFirst({
            where: { id, tenant_id: tenantId },
        });

        if (!customer) throw new NotFoundException('Customer not found');

        if (dto.phone && dto.phone !== customer.phone) {
            const duplicate = await this.db.customer.findUnique({
                where: {
                    tenant_id_phone: {
                        tenant_id: tenantId,
                        phone: dto.phone,
                    }
                }
            });
            if (duplicate) {
                throw new BadRequestException('A customer with this phone number already exists.');
            }
        }

        return this.db.customer.update({
            where: { id },
            data: dto,
            include: {
                customerGroup: true,
                territory: true,
            }
        });
    }
}
