import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductGroupDto, UpdateProductGroupDto } from './product-group.dto';

@Injectable()
export class ProductGroupsService {
    constructor(private db: DatabaseService) {}

    async create(tenantId: string, dto: CreateProductGroupDto) {
        const existing = await this.db.productGroup.findUnique({
            where: { tenant_id_name: { tenant_id: tenantId, name: dto.name } },
        });

        if (existing) {
            throw new BadRequestException('A product group with this name already exists.');
        }

        return this.db.productGroup.create({
            data: { tenant_id: tenantId, ...dto },
        });
    }

    async findAll(tenantId: string) {
        return this.db.productGroup.findMany({
            where: { tenant_id: tenantId },
            include: {
                _count: { select: { subgroups: true, products: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const group = await this.db.productGroup.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                _count: { select: { subgroups: true, products: true } },
            },
        });

        if (!group) {
            throw new NotFoundException('Product group not found');
        }

        return group;
    }

    async update(tenantId: string, id: string, dto: UpdateProductGroupDto) {
        await this.findOne(tenantId, id);

        if (dto.name) {
            const duplicate = await this.db.productGroup.findFirst({
                where: { tenant_id: tenantId, name: dto.name, NOT: { id } },
            });

            if (duplicate) {
                throw new BadRequestException('A product group with this name already exists.');
            }
        }

        return this.db.productGroup.update({
            where: { id },
            data: dto,
        });
    }

    async remove(tenantId: string, id: string) {
        const group = await this.findOne(tenantId, id);
        if ((group as any)._count.products > 0 || (group as any)._count.subgroups > 0) {
            throw new BadRequestException(
                'Cannot delete this product group — it has associated products or subgroups.',
            );
        }

        return this.db.productGroup.delete({ where: { id } });
    }
}