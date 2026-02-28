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
                    serial_number: serialNumber,
                    total_amount: dto.totalAmount,
                    amount_paid: dto.amountPaid,
                    status: 'COMPLETED',
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

                // Decrement Stock
                const stock = await tx.productStock.findUnique({
                    where: { product_id: item.productId },
                });

                if (!stock || stock.quantity < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
                }

                await tx.productStock.update({
                    where: { product_id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            return sale;
        });
    }

    async findAll(tenantId: string) {
        return this.db.sale.findMany({
            where: { tenant_id: tenantId },
            include: { items: { include: { product: true } } },
            orderBy: { created_at: 'desc' },
        });
    }
}
