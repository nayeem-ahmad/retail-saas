import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateWarrantyClaimDto, UpdateClaimStatusDto } from './warranty-claims.dto';

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];

@Injectable()
export class WarrantyClaimsService {
    constructor(private db: DatabaseService) {}

    async lookup(tenantId: string, serialNumber: string) {
        const serial = await this.db.productSerial.findFirst({
            where: { tenant_id: tenantId, serial_number: serialNumber },
            include: {
                claims: {
                    orderBy: { created_at: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        claim_number: true,
                        status: true,
                        created_at: true,
                        customer_name: true,
                    },
                },
            },
        });

        if (!serial) {
            throw new NotFoundException(`Serial number "${serialNumber}" not found.`);
        }

        const product = await this.db.product.findFirst({
            where: { tenant_id: tenantId, id: serial.product_id },
            select: { id: true, name: true, warranty_enabled: true, warranty_duration_days: true },
        });

        let warrantyExpired = false;
        let warrantyExpiresAt: Date | null = null;

        if (product?.warranty_enabled && product.warranty_duration_days && serial.sold_at) {
            warrantyExpiresAt = new Date(serial.sold_at);
            warrantyExpiresAt.setDate(warrantyExpiresAt.getDate() + product.warranty_duration_days);
            warrantyExpired = warrantyExpiresAt < new Date();
        }

        return {
            serial,
            product,
            warrantyExpired,
            warrantyExpiresAt,
        };
    }

    async create(tenantId: string, dto: CreateWarrantyClaimDto) {
        const serial = await this.db.productSerial.findFirst({
            where: { tenant_id: tenantId, id: dto.serialId },
        });

        if (!serial) {
            throw new NotFoundException('Serial number not found.');
        }

        if (serial.status !== 'SOLD') {
            throw new BadRequestException(`Serial number status is "${serial.status}". Only SOLD serials can have warranty claims.`);
        }

        const count = await this.db.warrantyClaim.count({ where: { tenant_id: tenantId } });
        const claimNumber = `WC-${String(count + 1).padStart(5, '0')}`;

        const claim = await this.db.warrantyClaim.create({
            data: {
                tenant_id: tenantId,
                claim_number: claimNumber,
                serial_id: dto.serialId,
                customer_name: dto.customerName,
                customer_phone: dto.customerPhone,
                issue_description: dto.issueDescription,
                status: 'OPEN',
            },
            include: {
                serial: {
                    select: {
                        serial_number: true,
                        product_id: true,
                        sold_at: true,
                    },
                },
            },
        });

        await this.db.productSerial.update({
            where: { id: dto.serialId },
            data: { claim_reference: claimNumber },
        });

        return claim;
    }

    async findAll(tenantId: string, params?: { status?: string; from?: string; to?: string }) {
        const where: any = { tenant_id: tenantId };

        if (params?.status) where.status = params.status;
        if (params?.from || params?.to) {
            where.created_at = {};
            if (params.from) where.created_at.gte = new Date(params.from);
            if (params.to) where.created_at.lte = new Date(params.to);
        }

        return this.db.warrantyClaim.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                serial: {
                    select: {
                        serial_number: true,
                        product_id: true,
                        sold_at: true,
                    },
                },
            },
        });
    }

    async findOne(tenantId: string, id: string) {
        const claim = await this.db.warrantyClaim.findFirst({
            where: { tenant_id: tenantId, id },
            include: {
                serial: {
                    select: {
                        serial_number: true,
                        product_id: true,
                        sold_at: true,
                        status: true,
                    },
                },
            },
        });

        if (!claim) throw new NotFoundException('Warranty claim not found.');

        const product = claim.serial
            ? await this.db.product.findFirst({
                  where: { tenant_id: tenantId, id: claim.serial.product_id },
                  select: { id: true, name: true, warranty_enabled: true, warranty_duration_days: true },
              })
            : null;

        return { ...claim, product };
    }

    async updateStatus(tenantId: string, id: string, dto: UpdateClaimStatusDto) {
        if (!VALID_STATUSES.includes(dto.status)) {
            throw new BadRequestException(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
        }

        const claim = await this.db.warrantyClaim.findFirst({ where: { tenant_id: tenantId, id } });
        if (!claim) throw new NotFoundException('Warranty claim not found.');

        return this.db.warrantyClaim.update({
            where: { id },
            data: {
                status: dto.status,
                resolution_notes: dto.resolutionNotes ?? claim.resolution_notes,
            },
        });
    }
}
