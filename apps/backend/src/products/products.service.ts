import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductsService {
    constructor(private db: DatabaseService) { }

    async create(tenantId: string, dto: CreateProductDto) {
        return this.db.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    tenant_id: tenantId,
                    name: dto.name,
                    sku: dto.sku,
                    price: dto.price,
                    image_url: dto.image_url,
                },
            });

            if (dto.initialStock !== undefined) {
                await tx.productStock.create({
                    data: {
                        tenant_id: tenantId,
                        product_id: product.id,
                        quantity: dto.initialStock,
                    },
                });
            }

            return product;
        });
    }

    async findAll(tenantId: string) {
        return this.db.product.findMany({
            where: { tenant_id: tenantId },
            include: { stocks: true },
        });
    }

    async findOne(tenantId: string, id: string) {
        const product = await this.db.product.findFirst({
            where: { id, tenant_id: tenantId },
            include: { stocks: true },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async update(tenantId: string, id: string, dto: UpdateProductDto) {
        return this.db.product.updateMany({
            where: { id, tenant_id: tenantId },
            data: dto,
        });
    }

    async remove(tenantId: string, id: string) {
        return this.db.product.deleteMany({
            where: { id, tenant_id: tenantId },
        });
    }
}
