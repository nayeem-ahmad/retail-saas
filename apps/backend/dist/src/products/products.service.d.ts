import { DatabaseService } from '../database/database.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
export declare class ProductsService {
    private db;
    constructor(db: DatabaseService);
    create(tenantId: string, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        created_at: Date;
        tenant_id: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        image_url: string | null;
    }>;
    findAll(tenantId: string): Promise<({
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
    findOne(tenantId: string, id: string): Promise<{
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
    update(tenantId: string, id: string, dto: UpdateProductDto): Promise<import(".prisma/client").Prisma.BatchPayload>;
    remove(tenantId: string, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
