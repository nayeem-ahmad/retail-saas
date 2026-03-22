import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSaleDto, UpdateSaleDto } from './sale.dto';
import { applyInventoryMovement, resolveWarehouseId } from '../database/inventory.utils';

@Injectable()
export class SalesService {
    constructor(private db: DatabaseService) { }

    async create(tenantId: string, dto: CreateSaleDto) {
        return this.db.$transaction(async (tx) => {
            const warehouseId = await resolveWarehouseId(tx, tenantId, dto.storeId, dto.warehouseId, 'sale');
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

                await applyInventoryMovement(tx, {
                    tenantId,
                    productId: item.productId,
                    warehouseId,
                    quantityDelta: -item.quantity,
                    movementType: 'SALE',
                    referenceType: 'SALE',
                    referenceId: sale.id,
                    unitCost: item.priceAtSale,
                });
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
                const warehouseId = await resolveWarehouseId(tx, tenantId, sale.store_id, undefined, 'sale');
                // Reverse stock for old items
                for (const oldItem of sale.items) {
                    await applyInventoryMovement(tx, {
                        tenantId,
                        productId: oldItem.product_id,
                        warehouseId,
                        quantityDelta: oldItem.quantity,
                        movementType: 'SALE_EDIT_REVERSAL',
                        referenceType: 'SALE',
                        referenceId: id,
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

                    await applyInventoryMovement(tx, {
                        tenantId,
                        productId: item.productId,
                        warehouseId,
                        quantityDelta: -item.quantity,
                        movementType: 'SALE_EDIT',
                        referenceType: 'SALE',
                        referenceId: id,
                        unitCost: item.priceAtSale,
                    });
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
