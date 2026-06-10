import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePurchaseQuotationDto, UpdatePurchaseQuotationStatusDto } from './purchase-quotation.dto';

const INCLUDE = {
    supplier: { select: { id: true, name: true, phone: true, email: true } },
    store: { select: { name: true } },
    items: { include: { product: { select: { id: true, name: true, sku: true } } } },
} as const;

@Injectable()
export class PurchaseQuotationsService {
    constructor(private db: DatabaseService) {}

    async create(tenantId: string, dto: CreatePurchaseQuotationDto) {
        const store = await this.db.store.findFirst({ where: { id: dto.storeId, tenant_id: tenantId } });
        if (!store) throw new NotFoundException('Store not found');

        if (dto.supplierId) {
            const supplier = await this.db.supplier.findFirst({
                where: { id: dto.supplierId, tenant_id: tenantId, deleted_at: null },
            });
            if (!supplier) throw new BadRequestException('Supplier not found.');
        }

        const total = dto.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
        const count = await this.db.purchaseQuotation.count({ where: { tenant_id: tenantId } });
        const rfqNumber = `RFQ-${String(count + 1).padStart(5, '0')}`;

        return this.db.purchaseQuotation.create({
            data: {
                tenant_id: tenantId,
                store_id: dto.storeId,
                supplier_id: dto.supplierId ?? null,
                rfq_number: rfqNumber,
                valid_until: dto.validUntil ? new Date(dto.validUntil) : null,
                total_amount: total,
                notes: dto.notes ?? null,
                items: {
                    create: dto.items.map((i) => ({
                        product_id: i.productId,
                        quantity: i.quantity,
                        unit_cost: i.unitCost,
                        line_total: i.quantity * i.unitCost,
                    })),
                },
            },
            include: INCLUDE,
        });
    }

    async findAll(tenantId: string) {
        return this.db.purchaseQuotation.findMany({
            where: { tenant_id: tenantId },
            include: INCLUDE,
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const rfq = await this.db.purchaseQuotation.findFirst({
            where: { id, tenant_id: tenantId },
            include: INCLUDE,
        });
        if (!rfq) throw new NotFoundException('Purchase quotation not found');
        return rfq;
    }

    async updateStatus(tenantId: string, id: string, dto: UpdatePurchaseQuotationStatusDto) {
        const rfq = await this.db.purchaseQuotation.findFirst({ where: { id, tenant_id: tenantId } });
        if (!rfq) throw new NotFoundException('Purchase quotation not found');

        if (rfq.status === 'CONVERTED') throw new BadRequestException('Already converted to a purchase order.');
        if (rfq.status === 'CANCELLED') throw new BadRequestException('Cancelled quotations cannot be updated.');

        return this.db.purchaseQuotation.update({
            where: { id },
            data: { status: dto.status },
            include: INCLUDE,
        });
    }

    async convertToPurchaseOrder(tenantId: string, id: string) {
        const rfq = await this.db.purchaseQuotation.findFirst({
            where: { id, tenant_id: tenantId },
            include: { items: true },
        });
        if (!rfq) throw new NotFoundException('Purchase quotation not found');
        if (rfq.status === 'CONVERTED') throw new BadRequestException('Already converted to a purchase order.');
        if (rfq.status === 'CANCELLED') throw new BadRequestException('Cancelled quotations cannot be converted.');

        return this.db.$transaction(async (tx) => {
            const count = await tx.purchaseOrder.count({ where: { tenant_id: tenantId } });
            const poNumber = `PO-${String(count + 1).padStart(5, '0')}`;

            const po = await tx.purchaseOrder.create({
                data: {
                    tenant_id: tenantId,
                    store_id: rfq.store_id,
                    supplier_id: rfq.supplier_id,
                    po_number: poNumber,
                    subtotal_amount: rfq.total_amount,
                    total_amount: rfq.total_amount,
                    notes: rfq.notes,
                    items: {
                        create: rfq.items.map((i) => ({
                            product_id: i.product_id,
                            quantity: i.quantity,
                            unit_cost: i.unit_cost,
                            line_total: i.line_total,
                        })),
                    },
                },
                include: {
                    supplier: true,
                    store: { select: { name: true } },
                    items: { include: { product: true } },
                },
            });

            await tx.purchaseQuotation.update({
                where: { id },
                data: { status: 'CONVERTED' },
            });

            return po;
        });
    }

    async remove(tenantId: string, id: string) {
        const rfq = await this.db.purchaseQuotation.findFirst({ where: { id, tenant_id: tenantId } });
        if (!rfq) throw new NotFoundException('Purchase quotation not found');
        if (rfq.status === 'CONVERTED') throw new BadRequestException('Cannot delete a converted quotation.');

        await this.db.purchaseQuotationItem.deleteMany({ where: { rfq_id: id } });
        await this.db.purchaseQuotation.delete({ where: { id } });
        return { deleted: true };
    }
}
