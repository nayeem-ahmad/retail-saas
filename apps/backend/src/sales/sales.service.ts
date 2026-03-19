import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSaleDto, UpdateSaleDto } from './sale.dto';

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
                    note: dto.note,
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

    async findOne(tenantId: string, id: string) {
        const sale = await this.db.sale.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                items: { include: { product: true } },
                payments: true
            },
        });

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        return sale;
    }

    async update(tenantId: string, id: string, dto: UpdateSaleDto) {
        return this.db.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: { id, tenant_id: tenantId },
                include: { items: true, payments: true },
            });

            if (!sale) {
                throw new NotFoundException('Sale not found');
            }

            // 1. If items are being replaced, reverse old stock and apply new
            if (dto.items) {
                // Reverse stock for old items
                for (const oldItem of sale.items) {
                    await tx.productStock.updateMany({
                        where: { product_id: oldItem.product_id },
                        data: { quantity: { increment: oldItem.quantity } },
                    });
                }

                // Delete old items
                await tx.saleItem.deleteMany({ where: { sale_id: id } });

                // Create new items and decrement stock
                for (const item of dto.items) {
                    await tx.saleItem.create({
                        data: {
                            sale_id: id,
                            product_id: item.productId,
                            quantity: item.quantity,
                            price_at_sale: item.priceAtSale,
                        },
                    });

                    const updateRes = await tx.productStock.updateMany({
                        where: {
                            product_id: item.productId,
                            quantity: { gte: item.quantity },
                        },
                        data: { quantity: { decrement: item.quantity } },
                    });

                    if (updateRes.count === 0) {
                        throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
                    }
                }
            }

            // 2. If payments are being replaced
            if (dto.payments) {
                await tx.paymentRecord.deleteMany({ where: { sale_id: id } });
                for (const p of dto.payments) {
                    await tx.paymentRecord.create({
                        data: {
                            sale_id: id,
                            payment_method: p.paymentMethod,
                            amount: p.amount,
                        },
                    });
                }
            }

            // 3. Recalculate totals if items changed
            const totalAmount = dto.items
                ? dto.items.reduce((sum, i) => sum + i.quantity * i.priceAtSale, 0)
                : undefined;
            const amountPaid = dto.payments
                ? dto.payments.reduce((sum, p) => sum + p.amount, 0)
                : undefined;

            // 4. Handle customer total_spent adjustment
            if (dto.customerId !== undefined && dto.customerId !== sale.customer_id) {
                // Decrement old customer
                if (sale.customer_id) {
                    await tx.customer.update({
                        where: { id: sale.customer_id },
                        data: { total_spent: { decrement: Number(sale.total_amount) } },
                    });
                }
                // Increment new customer
                if (dto.customerId) {
                    await tx.customer.update({
                        where: { id: dto.customerId },
                        data: { total_spent: { increment: totalAmount ?? Number(sale.total_amount) } },
                    });
                }
            } else if (totalAmount !== undefined && sale.customer_id) {
                // Same customer but total changed
                const diff = totalAmount - Number(sale.total_amount);
                if (diff !== 0) {
                    await tx.customer.update({
                        where: { id: sale.customer_id },
                        data: { total_spent: { increment: diff } },
                    });
                }
            }

            // 5. Update sale record
            return tx.sale.update({
                where: { id },
                data: {
                    ...(dto.customerId !== undefined && { customer_id: dto.customerId || null }),
                    ...(dto.status && { status: dto.status }),
                    ...(dto.note !== undefined && { note: dto.note }),
                    ...(totalAmount !== undefined && { total_amount: totalAmount }),
                    ...(amountPaid !== undefined && { amount_paid: amountPaid }),
                },
                include: {
                    items: { include: { product: true } },
                    payments: true,
                },
            });
        });
    }
}
