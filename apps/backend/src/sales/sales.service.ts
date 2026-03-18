import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSaleDto } from './sale.dto';

@Injectable()
export class SalesService {
    constructor(private db: DatabaseService) { }

    async create(tenantId: string, dto: CreateSaleDto) {
        return this.db.$transaction(async (tx) => {
            // 1. Generate Serial Number (Simplified for v0.1)
            const serialNumber = `SL-${Date.now()}`;

            // 2. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    customer_id: dto.customerId,
                    serial_number: serialNumber,
                    total_amount: dto.totalAmount,
                    amount_paid: dto.amountPaid,
                    status: 'COMPLETED',
                    payments: dto.payments ? {
                        create: dto.payments.map(p => ({
                            payment_method: p.paymentMethod,
                            amount: p.amount
                        }))
                    } : undefined
                },
            });

            // 3. Process Items and update stock
            for (const item of dto.items) {
                // Create Sale Item
                await tx.saleItem.create({
                    data: {
                        sale_id: sale.id,
                        product_id: item.productId,
                        quantity: item.quantity,
                        price_at_sale: item.priceAtSale,
                    },
                });

                // Atomic Decrement Stock
                const updateRes = await tx.productStock.updateMany({
                    where: { 
                        product_id: item.productId,
                        quantity: { gte: item.quantity }
                    },
                    data: {
                        quantity: {
                            decrement: item.quantity,
                        },
                    },
                });

                if (updateRes.count === 0) {
                    throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
                }
            }
            if (dto.customerId) {
                await tx.customer.update({
                    where: { id: dto.customerId },
                    data: {
                        total_spent: { increment: dto.totalAmount }
                    }
                });
            }

            return sale;
        });
    }

    async findAll(tenantId: string) {
        return this.db.sale.findMany({
            where: { tenant_id: tenantId },
            include: { 
                items: { include: { product: true } },
                payments: true
            },
            orderBy: { created_at: 'desc' },
        });
    }
}
