import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { TenantContext } from '../database/tenant.decorator';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(tenant: TenantContext, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        created_at: Date;
        tenant_id: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        image_url: string | null;
    }>;
    findAll(tenant: TenantContext): Promise<({
        stocks: {
            id: string;
            tenant_id: string;
            quantity: number;
            product_id: string;
        }[];
    } & {
        id: string;
        name: string;
        created_at: Date;
        tenant_id: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        image_url: string | null;
    })[]>;
    findOne(tenant: TenantContext, id: string): Promise<{
        stocks: {
            id: string;
            tenant_id: string;
            quantity: number;
            product_id: string;
        }[];
    } & {
        id: string;
        name: string;
        created_at: Date;
        tenant_id: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        image_url: string | null;
    }>;
    update(tenant: TenantContext, id: string, dto: UpdateProductDto): Promise<import(".prisma/client").Prisma.BatchPayload>;
    remove(tenant: TenantContext, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
