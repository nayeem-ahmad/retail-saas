import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePurchaseDto } from './purchase.dto';

@Injectable()
export class PurchasesService {
    constructor(private db: DatabaseService) {}

    async create(tenantId: string, dto: CreatePurchaseDto) {
        const store = await this.db.store.findFirst({
            where: { id: dto.storeId, tenant_id: tenantId },
        });

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        const products = await this.db.product.findMany({
            where: {
                tenant_id: tenantId,
                id: { in: dto.items.map((item) => item.productId) },
            },
        });

        if (products.length !== dto.items.length) {
            throw new BadRequestException('One or more products do not exist for this tenant.');
        }

        const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
        const taxAmount = dto.taxAmount ?? 0;
        const discountAmount = dto.discountAmount ?? 0;
        const freightAmount = dto.freightAmount ?? 0;
        const totalAmount = subtotal + taxAmount + freightAmount - discountAmount;

        return this.db.$transaction(async (tx) => {
            let supplierId = dto.supplierId;

            if (dto.newSupplier) {
                const existingSupplier = await tx.supplier.findUnique({
                    where: { tenant_id_name: { tenant_id: tenantId, name: dto.newSupplier.name } },
                });

                if (existingSupplier) {
                    supplierId = existingSupplier.id;
                } else {
                    const supplier = await tx.supplier.create({
                        data: {
                            tenant_id: tenantId,
                            name: dto.newSupplier.name,
                            phone: dto.newSupplier.phone,
                            email: dto.newSupplier.email,
                            address: dto.newSupplier.address,
                        },
                    });
                    supplierId = supplier.id;
                }
            } else if (supplierId) {
                const supplier = await tx.supplier.findFirst({
                    where: { id: supplierId, tenant_id: tenantId },
                });

                if (!supplier) {
                    throw new BadRequestException('Supplier not found for this tenant.');
                }
            }

            const count = await tx.purchase.count({ where: { tenant_id: tenantId } });
            const purchaseNumber = `PUR-${String(count + 1).padStart(5, '0')}`;

            const purchase = await tx.purchase.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    supplier_id: supplierId,
                    purchase_number: purchaseNumber,
                    subtotal_amount: subtotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    freight_amount: freightAmount,
                    total_amount: totalAmount,
                    notes: dto.notes,
                },
            });

            for (const item of dto.items) {
                await tx.purchaseItem.create({
                    data: {
                        purchase_id: purchase.id,
                        product_id: item.productId,
                        quantity: item.quantity,
                        unit_cost: item.unitCost,
                        line_total: item.quantity * item.unitCost,
                    },
                });

                await tx.productStock.upsert({
                    where: { product_id: item.productId },
                    update: { quantity: { increment: item.quantity } },
                    create: {
                        tenant_id: tenantId,
                        product_id: item.productId,
                        quantity: item.quantity,
                    },
                });
            }

            return tx.purchase.findFirst({
                where: { id: purchase.id, tenant_id: tenantId },
                include: {
                    supplier: true,
                    items: {
                        include: { product: true, returnItems: true },
                    },
                },
            });
        });
    }

    async findAll(tenantId: string) {
        return this.db.purchase.findMany({
            where: { tenant_id: tenantId },
            include: {
                supplier: true,
                items: {
                    include: { product: true, returnItems: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const purchase = await this.db.purchase.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                supplier: true,
                items: {
                    include: { product: true, returnItems: true },
                },
            },
        });

        if (!purchase) {
            throw new NotFoundException('Purchase not found');
        }

        return purchase;
    }
}