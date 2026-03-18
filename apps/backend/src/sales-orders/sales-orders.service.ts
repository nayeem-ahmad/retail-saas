import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSalesOrderDto, UpdateOrderStatusDto, AddDepositDto } from './sales-orders.dto';

@Injectable()
export class SalesOrdersService {
    constructor(private db: DatabaseService) {}

    async create(tenantId: string, dto: CreateSalesOrderDto) {
        return this.db.$transaction(async (tx) => {
            const orderNumber = `ORD-${Date.now()}`;
            
            const itemsData = dto.items.map(item => ({
                product_id: item.productId,
                quantity: item.quantity,
                price_at_order: item.priceAtOrder
            }));

            const order = await tx.salesOrder.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    customer_id: dto.customerId,
                    order_number: orderNumber,
                    total_amount: dto.totalAmount,
                    status: dto.status || 'DRAFT',
                    payment_status: 'UNPAID',
                    delivery_date: dto.deliveryDate,
                    items: { create: itemsData }
                },
                include: { items: true }
            });

            return order;
        });
    }

    async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto) {
        return this.db.$transaction(async (tx) => {
            const order = await tx.salesOrder.findUnique({
                where: { id, tenant_id: tenantId },
                include: { items: true }
            });

            if (!order) throw new BadRequestException('Order not found');

            // If transitioning to DELIVERED, decrement stock
            if (dto.status === 'DELIVERED' && order.status !== 'DELIVERED') {
                for (const item of order.items) {
                    const updateRes = await tx.productStock.updateMany({
                        where: { product_id: item.product_id, tenant_id: tenantId, quantity: { gte: item.quantity } },
                        data: { quantity: { decrement: item.quantity } }
                    });
                    if (updateRes.count === 0) {
                        throw new BadRequestException(`Insufficient stock for product ${item.product_id}`);
                    }
                }
                
                // Also update customer total_spent based on the entire order amount
                if (order.customer_id) {
                     await tx.customer.update({
                         where: { id: order.customer_id },
                         data: { total_spent: { increment: order.total_amount } }
                     });
                }
            }

            return tx.salesOrder.update({
                where: { id },
                data: { status: dto.status }
            });
        });
    }

    async addDeposit(tenantId: string, id: string, dto: AddDepositDto) {
        return this.db.$transaction(async (tx) => {
            const order = await tx.salesOrder.findUnique({
                where: { id, tenant_id: tenantId },
                include: { deposits: true }
            });

            if (!order) throw new BadRequestException('Order not found');

            const currentPaid = Number(order.amount_paid);
            const newPaid = currentPaid + dto.amount;

            // Recalculate payment status
            let paymentStatus = order.payment_status;
            if (newPaid >= Number(order.total_amount)) {
                paymentStatus = 'PAID';
            } else if (newPaid > 0) {
                paymentStatus = 'PARTIAL';
            }

            await tx.orderDeposit.create({
                data: {
                    order_id: id,
                    amount: dto.amount,
                    payment_method: dto.paymentMethod
                }
            });

            return tx.salesOrder.update({
                where: { id },
                data: { 
                    amount_paid: newPaid,
                    payment_status: paymentStatus 
                },
                include: { deposits: true }
            });
        });
    }

    async findAll(tenantId: string) {
        return this.db.salesOrder.findMany({
            where: { tenant_id: tenantId },
            include: { customer: true, items: { include: { product: true } }, deposits: true },
            orderBy: { created_at: 'desc' }
        });
    }

    async findOne(tenantId: string, id: string) {
        return this.db.salesOrder.findFirst({
            where: { id, tenant_id: tenantId },
            include: { customer: true, items: { include: { product: true } }, deposits: true }
        });
    }
}
