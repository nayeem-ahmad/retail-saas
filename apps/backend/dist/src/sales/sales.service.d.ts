import { DatabaseService } from '../database/database.service';
import { CreateSaleDto } from './sale.dto';
export declare class SalesService {
    private db;
    constructor(db: DatabaseService);
    create(tenantId: string, dto: CreateSaleDto): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        serial_number: string;
        total_amount: import("@prisma/client/runtime/library").Decimal;
        amount_paid: import("@prisma/client/runtime/library").Decimal;
        status: string;
        store_id: string;
    }>;
    findAll(tenantId: string): Promise<({
        items: ({
            product: {
                id: string;
                name: string;
                created_at: Date;
                tenant_id: string;
                sku: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                image_url: string | null;
            };
        } & {
            id: string;
            quantity: number;
            product_id: string;
            price_at_sale: import("@prisma/client/runtime/library").Decimal;
            sale_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        serial_number: string;
        total_amount: import("@prisma/client/runtime/library").Decimal;
        amount_paid: import("@prisma/client/runtime/library").Decimal;
        status: string;
        store_id: string;
    })[]>;
}
