import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateWarrantyClaimDto, UpdateWarrantyClaimStatusDto } from './warranty-claim.dto';

const VALID_STATUSES = ['SUBMITTED', 'APPROVED', 'REJECTED', 'REPAIRED', 'REPLACED', 'COMPLETED'];

@Injectable()
export class WarrantyClaimsService {
    constructor(private db: DatabaseService) {}

    async lookup(tenantId: string, serialNumber: string) {
        const serial = await this.db.productSerial.findFirst({
            where: { tenant_id: tenantId, serial_number: serialNumber },
        });

        if (!serial) throw new NotFoundException(`Serial number "${serialNumber}" not found.`);

        const product = await this.db.product.findUnique({
            where: { id: serial.product_id },
        });

        if (!product?.warranty_enabled) {
            throw new BadRequestException(`Product does not have warranty enabled.`);
        }

        const sale = serial.source_id
            ? await this.db.sale.findUnique({
                  where: { id: serial.source_id },
                  include: { customer: true },
              })
            : null;

        const soldAt = serial.sold_at;
        const warrantyDays = product.warranty_duration_days ?? 0;
        const expiresAt = soldAt
            ? new Date(soldAt.getTime() + warrantyDays * 86400_000)
            : null;
        const isExpired = expiresAt ? expiresAt < new Date() : false;
        const isClaimed = serial.status === 'CLAIMED';

        return {
            serial,
            product,
            sale,
            customer: sale?.customer ?? null,
            warrantyDays,
            soldAt,
            expiresAt,
            isExpired,
            isClaimed,
            isClaimable: serial.status === 'SOLD' && !isExpired,
        };
    }

    async create(tenantId: string, dto: CreateWarrantyClaimDto) {
        return this.db.$transaction(async (tx) => {
            const serial = await tx.productSerial.findFirst({
                where: { tenant_id: tenantId, serial_number: dto.serialNumber },
            });

            if (!serial) {
                throw new NotFoundException(`Serial number "${dto.serialNumber}" not found.`);
            }

            if (serial.status === 'CLAIMED') {
                throw new BadRequestException(`A warranty claim already exists for serial "${dto.serialNumber}".`);
            }

            if (serial.status !== 'SOLD') {
                throw new BadRequestException(`Serial "${dto.serialNumber}" is not eligible for a warranty claim (status: ${serial.status}).`);
            }

            const product = await tx.product.findUnique({
                where: { id: serial.product_id },
            });

            if (!product?.warranty_enabled) {
                throw new BadRequestException(`Product does not have warranty enabled.`);
            }

            if (serial.sold_at && product.warranty_duration_days) {
                const expiresAt = new Date(
                    serial.sold_at.getTime() + product.warranty_duration_days * 86400_000,
                );
                if (expiresAt < new Date()) {
                    throw new BadRequestException(
                        `Warranty expired on ${expiresAt.toLocaleDateString()}.`,
                    );
                }
            }

            const sale = serial.source_id
                ? await tx.sale.findUnique({ where: { id: serial.source_id } })
                : null;

            const claimNumber = `WC-${Date.now()}`;

            const claim = await tx.warrantyClaim.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    claim_number: claimNumber,
                    serial_number: dto.serialNumber,
                    product_id: serial.product_id,
                    sale_id: sale?.id ?? null,
                    customer_id: sale?.customer_id ?? null,
                    reason: dto.reason,
                    description: dto.description ?? null,
                    status: 'SUBMITTED',
                },
                include: { product: true, sale: true, customer: true, store: true },
            });

            await tx.productSerial.updateMany({
                where: { tenant_id: tenantId, serial_number: dto.serialNumber },
                data: { status: 'CLAIMED', claim_reference: claim.id },
            });

            return claim;
        });
    }

    async findAll(tenantId: string) {
        return this.db.warrantyClaim.findMany({
            where: { tenant_id: tenantId },
            include: { product: true, sale: true, customer: true, store: true },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const claim = await this.db.warrantyClaim.findUnique({
            where: { id },
            include: { product: true, sale: true, customer: true, store: true },
        });

        if (!claim || claim.tenant_id !== tenantId) {
            throw new NotFoundException('Warranty claim not found.');
        }

        return claim;
    }

    async updateStatus(tenantId: string, id: string, dto: UpdateWarrantyClaimStatusDto) {
        const claim = await this.db.warrantyClaim.findUnique({ where: { id } });

        if (!claim || claim.tenant_id !== tenantId) {
            throw new NotFoundException('Warranty claim not found.');
        }

        if (!VALID_STATUSES.includes(dto.status)) {
            throw new BadRequestException(`Invalid status "${dto.status}".`);
        }

        const isResolved = ['REPAIRED', 'REPLACED', 'COMPLETED', 'REJECTED'].includes(dto.status);

        return this.db.warrantyClaim.update({
            where: { id },
            data: {
                status: dto.status,
                resolution_notes: dto.resolutionNotes ?? claim.resolution_notes,
                resolved_at: isResolved && !claim.resolved_at ? new Date() : claim.resolved_at,
            },
            include: { product: true, sale: true, customer: true, store: true },
        });
    }
}
