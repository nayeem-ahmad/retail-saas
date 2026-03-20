import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateQuotationDto, UpdateQuotationDto, UpdateQuotationStatusDto } from './sales-quotations.dto';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';

@Injectable()
export class SalesQuotationsService {
    constructor(
        private db: DatabaseService,
        private ordersService: SalesOrdersService
    ) {}

    async create(tenantId: string, dto: CreateQuotationDto) {
        return this.db.$transaction(async (tx) => {
            const quoteNumber = `QT-${Date.now()}`;
            
            const itemsData = dto.items.map(item => ({
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice
            }));

            return tx.quotation.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    customer_id: dto.customerId,
                    quote_number: quoteNumber,
                    total_amount: dto.totalAmount,
                    valid_until: dto.validUntil ? new Date(dto.validUntil) : null,
                    notes: dto.notes,
                    items: { create: itemsData }
                },
                include: { items: true }
            });
        });
    }

    async revise(tenantId: string, id: string) {
        return this.db.$transaction(async (tx) => {
            const oldQuote = await tx.quotation.findUnique({
                where: { id, tenant_id: tenantId },
                include: { items: true }
            });

            if (!oldQuote) throw new BadRequestException('Quotation not found');
            if (oldQuote.status !== 'DRAFT' && oldQuote.status !== 'SENT') {
                throw new BadRequestException('Cannot revise a quotation that is already processed.');
            }

            // Mark old as REVISED
            await tx.quotation.update({
                where: { id },
                data: { status: 'REVISED' }
            });

            // Create new version
            const newVersion = oldQuote.version + 1;
            const originalQuoteId = oldQuote.original_quote_id || oldQuote.id;

            const itemsData = oldQuote.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            }));

            return tx.quotation.create({
                data: {
                    tenant_id: tenantId,
                    store_id: oldQuote.store_id,
                    customer_id: oldQuote.customer_id,
                    quote_number: oldQuote.quote_number,
                    total_amount: oldQuote.total_amount,
                    valid_until: oldQuote.valid_until,
                    notes: oldQuote.notes,
                    version: newVersion,
                    original_quote_id: originalQuoteId,
                    items: { create: itemsData }
                },
                include: { items: true }
            });
        });
    }

    async convertToOrder(tenantId: string, id: string) {
        const quote = await this.db.quotation.findUnique({
             where: { id, tenant_id: tenantId },
             include: { items: true }
        });

        if (!quote) throw new BadRequestException('Quote not found');
        if (quote.status === 'CONVERTED') throw new BadRequestException('Already converted');

        // Call the SalesOrdersService natively
        const newOrder = await this.ordersService.create(tenantId, {
            storeId: quote.store_id,
            customerId: quote.customer_id || undefined,
            totalAmount: Number(quote.total_amount),
            items: quote.items.map(item => ({
                productId: item.product_id,
                quantity: item.quantity,
                priceAtOrder: Number(item.unit_price)
            }))
        });

        // Mark quote as converted
        await this.db.quotation.update({
             where: { id },
             data: { status: 'CONVERTED' }
        });

        return newOrder;
    }

    async update(tenantId: string, id: string, dto: UpdateQuotationDto) {
        return this.db.$transaction(async (tx) => {
            const existing = await tx.quotation.findFirst({
                where: { id, tenant_id: tenantId },
                include: { items: true, customer: true },
            });

            if (!existing) {
                throw new BadRequestException('Quotation not found');
            }

            if (existing.status === 'CONVERTED' || existing.status === 'REVISED') {
                throw new BadRequestException('Cannot edit this quotation');
            }

            const updateData: Record<string, unknown> = {};

            if (dto.customerId !== undefined) {
                updateData.customer_id = dto.customerId || null;
            }

            if (dto.notes !== undefined) {
                updateData.notes = dto.notes || null;
            }

            if (dto.validUntil !== undefined) {
                updateData.valid_until = dto.validUntil ? new Date(dto.validUntil) : null;
            }

            if (dto.items && dto.items.length > 0) {
                const totalAmount = dto.totalAmount ?? dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

                await tx.quotationItem.deleteMany({ where: { quotation_id: id } });

                return tx.quotation.update({
                    where: { id },
                    data: {
                        ...updateData,
                        total_amount: totalAmount,
                        items: {
                            create: dto.items.map((item) => ({
                                product_id: item.productId,
                                quantity: item.quantity,
                                unit_price: item.unitPrice,
                            })),
                        },
                    },
                    include: { customer: true, items: { include: { product: true } } },
                });
            }

            if (dto.totalAmount !== undefined) {
                updateData.total_amount = dto.totalAmount;
            }

            return tx.quotation.update({
                where: { id },
                data: updateData,
                include: { customer: true, items: { include: { product: true } } },
            });
        });
    }

    async updateStatus(tenantId: string, id: string, dto: UpdateQuotationStatusDto) {
        return this.db.quotation.update({
            where: { id, tenant_id: tenantId },
            data: { status: dto.status }
        });
    }

    async findAll(tenantId: string) {
        return this.db.quotation.findMany({
            where: { tenant_id: tenantId },
            include: { customer: true, items: { include: { product: true } } },
            orderBy: { created_at: 'desc' }
        });
    }

    async findOne(tenantId: string, id: string) {
        return this.db.quotation.findFirst({
            where: { id, tenant_id: tenantId },
            include: { customer: true, items: { include: { product: true } } }
        });
    }

    async remove(tenantId: string, id: string) {
        return this.db.$transaction(async (tx) => {
            const quote = await tx.quotation.findFirst({
                where: { id, tenant_id: tenantId },
            });

            if (!quote) {
                throw new BadRequestException('Quotation not found');
            }

            if (quote.status === 'CONVERTED') {
                throw new BadRequestException('Cannot delete a converted quotation');
            }

            await tx.quotationItem.deleteMany({ where: { quotation_id: id } });
            await tx.quotation.deleteMany({ where: { id, tenant_id: tenantId } });

            return { deleted: true };
        });
    }
}
