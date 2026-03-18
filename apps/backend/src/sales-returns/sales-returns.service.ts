import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSalesReturnDto } from './sales-returns.dto';

@Injectable()
export class SalesReturnsService {
    constructor(private db: DatabaseService) {}

    async create(tenantId: string, dto: CreateSalesReturnDto) {
        return this.db.$transaction(async (tx) => {
            // 1. Fetch original sale and its items
            const sale = await tx.sale.findUnique({
                where: { id: dto.saleId, tenant_id: tenantId },
                include: { items: { include: { returns: true } } }
            });

            if (!sale) throw new BadRequestException('Sale not found');

            const returnNumber = `RET-${Date.now()}`;
            let totalRefund = 0;
            const returnItemData = [];

            // 2. Validate items and calculate total refund
            for (const returnItem of dto.items) {
                const originalItem = sale.items.find((i: any) => i.id === returnItem.saleItemId);
                if (!originalItem) {
                    throw new BadRequestException(`Item ${returnItem.saleItemId} not found in this sale.`);
                }

                // Check previously returned quantity for this item
                const previouslyReturned = originalItem.returns.reduce((sum: number, r: any) => sum + r.quantity, 0);
                const availableToReturn = originalItem.quantity - previouslyReturned;

                if (returnItem.quantity > availableToReturn) {
                    throw new BadRequestException(`Cannot return ${returnItem.quantity}. Only ${availableToReturn} available to return.`);
                }

                const refundAmount = Number(originalItem.price_at_sale) * returnItem.quantity;
                totalRefund += refundAmount;

                returnItemData.push({
                    sale_item_id: originalItem.id,
                    product_id: originalItem.product_id,
                    quantity: returnItem.quantity,
                    refund_amount: refundAmount,
                });

                // Atomic re-increment of stock
                await tx.productStock.updateMany({
                    where: { product_id: originalItem.product_id, tenant_id: tenantId },
                    data: { quantity: { increment: returnItem.quantity } }
                });
            }

            // 3. Create the return record
            const salesReturn = await tx.salesReturn.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    sale_id: sale.id,
                    return_number: returnNumber,
                    total_refund: totalRefund,
                    reason: dto.reason,
                    items: {
                        create: returnItemData
                    }
                },
                include: { items: true }
            });

            // 4. Optionally: If the sale had a customer, decrease their total spent
            if (sale.customer_id) {
                 await tx.customer.update({
                      where: { id: sale.customer_id },
                      data: { total_spent: { decrement: totalRefund } }
                 });
            }

            return salesReturn;
        });
    }

    async findAll(tenantId: string) {
        return this.db.salesReturn.findMany({
            where: { tenant_id: tenantId },
            include: { sale: true, items: { include: { product: true } } },
            orderBy: { created_at: 'desc' }
        });
    }

    async findOne(tenantId: string, id: string) {
        return this.db.salesReturn.findFirst({
            where: { id, tenant_id: tenantId },
            include: { sale: true, items: { include: { product: true } } }
        });
    }
}
