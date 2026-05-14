import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

jest.setTimeout(30000);

describe('Sales Returns & Orders (e2e)', () => {
    let app: INestApplication;
    let db: DatabaseService;
    let authToken: string;
    let tenantId: string;
    let storeId: string;
    let productId: string;
    let saleId: string;
    let saleItemId: string;

    const applyMigration = async (relativePath: string) => {
        const migrationPath = path.resolve(__dirname, relativePath);
        const sql = readFileSync(migrationPath, 'utf8');
        const statements = sql
            .split(/;\s*\n/g)
            .map((s) => s.trim())
            .filter(Boolean);
        for (const statement of statements) {
            await db.$executeRawUnsafe(`${statement};`);
        }
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        db = moduleFixture.get<DatabaseService>(DatabaseService);

        await applyMigration('../../../packages/database/migrations/03_accounting_coa.sql');
        await applyMigration('../../../packages/database/migrations/04_voucher_sequences.sql');
        await applyMigration('../../../packages/database/migrations/05_vouchers.sql');
        await applyMigration('../../../packages/database/migrations/06_posting_rules_events.sql');

        await db.$executeRawUnsafe(
            'TRUNCATE TABLE posting_events, posting_rules, voucher_details, vouchers, voucher_sequences, accounts, account_subgroups, account_groups, "SaleItem", "Sale", "ProductStock", "Product", "Store", "User", "Tenant" CASCADE',
        );
    });

    afterAll(async () => {
        await db.$disconnect();
        await app.close();
    });

    describe('Setup', () => {
        it('should register user and setup store', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'ret-test@example.com', password: 'password123', name: 'Returns Tester' })
                .expect(201);

            const loginRes = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'ret-test@example.com', password: 'password123' })
                .expect(201);

            authToken = loginRes.body.access_token;

            const storeRes = await request(app.getHttpServer())
                .post('/auth/setup-store')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Returns Store', location: 'Test City', planCode: 'PREMIUM' })
                .expect(201);

            tenantId = storeRes.body.tenant.id;
            storeId = storeRes.body.store.id;
        });

        it('should create a product with initial stock', async () => {
            const res = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({ name: 'Test Widget', sku: 'TW-001', price: 20.00, initialStock: 50 })
                .expect(201);

            productId = res.body.id;
        });

        it('should process a sale to create returnable items', async () => {
            const res = await request(app.getHttpServer())
                .post('/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    totalAmount: 60.00,
                    amountPaid: 60.00,
                    items: [{ productId, quantity: 3, priceAtSale: 20.00 }],
                })
                .expect(201);

            saleId = res.body.id;
            saleItemId = res.body.items[0].id;
        });
    });

    describe('Sales Returns', () => {
        it('should create a sales return and increment stock', async () => {
            const productBefore = await db.product.findUnique({
                where: { id: productId },
                include: { stocks: true },
            });
            const stockBefore = productBefore!.stocks[0]!.quantity;

            const res = await request(app.getHttpServer())
                .post('/sales-returns')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    saleId,
                    items: [{ saleItemId, quantity: 2 }],
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('return_number');
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].quantity).toBe(2);

            const productAfter = await db.product.findUnique({
                where: { id: productId },
                include: { stocks: true },
            });
            expect(productAfter!.stocks[0]!.quantity).toBe(stockBefore + 2);
        });

        it('should reject a return that exceeds remaining returnable quantity', async () => {
            // Already returned 2 of 3; only 1 remains returnable
            const res = await request(app.getHttpServer())
                .post('/sales-returns')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    saleId,
                    items: [{ saleItemId, quantity: 2 }], // 2 > 1 remaining
                });

            expect(res.status).toBe(400);
        });

        it('should reject a return for a non-existent sale', async () => {
            const res = await request(app.getHttpServer())
                .post('/sales-returns')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    saleId: 'non-existent-sale-id',
                    items: [{ saleItemId, quantity: 1 }],
                });

            expect(res.status).toBe(400);
        });

        it('should list all sales returns for the tenant', async () => {
            const res = await request(app.getHttpServer())
                .get('/sales-returns')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('return_number');
            expect(res.body[0]).toHaveProperty('sale');
        });

        it('should fetch a single sales return by ID', async () => {
            const allReturns = await request(app.getHttpServer())
                .get('/sales-returns')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            const returnId = allReturns.body[0].id;

            const res = await request(app.getHttpServer())
                .get(`/sales-returns/${returnId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(returnId);
            expect(res.body).toHaveProperty('items');
            expect(res.body).toHaveProperty('sale');
        });
    });

    describe('Sales Orders', () => {
        let orderId: string;

        it('should create a new sales order', async () => {
            const res = await request(app.getHttpServer())
                .post('/sales-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    items: [{ productId, quantity: 5, priceAtSale: 20.00 }],
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('order_number');
            orderId = res.body.id;
        });

        it('should list all sales orders for the tenant', async () => {
            const res = await request(app.getHttpServer())
                .get('/sales-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should fetch a single sales order by ID', async () => {
            const res = await request(app.getHttpServer())
                .get(`/sales-orders/${orderId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(orderId);
            expect(res.body).toHaveProperty('items');
        });

        it('should reject access to an order from a different tenant', async () => {
            // Create a second tenant
            const setup2 = await request(app.getHttpServer())
                .post('/auth/setup-store')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Other Store', location: 'Other City', planCode: 'PREMIUM' })
                .expect(201);

            const otherTenantId = setup2.body.tenant.id;

            const res = await request(app.getHttpServer())
                .get(`/sales-orders/${orderId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', otherTenantId);

            // Should be 404 (not found for that tenant) or 403
            expect([404, 403]).toContain(res.status);
        });
    });

    describe('Sales Quotations', () => {
        let quotationId: string;

        it('should create a sales quotation', async () => {
            const res = await request(app.getHttpServer())
                .post('/sales-quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    items: [{ productId, quantity: 2, priceAtSale: 20.00 }],
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('quote_number');
            quotationId = res.body.id;
        });

        it('should list quotations for the tenant', async () => {
            const res = await request(app.getHttpServer())
                .get('/sales-quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should fetch a single quotation by ID', async () => {
            const res = await request(app.getHttpServer())
                .get(`/sales-quotations/${quotationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(quotationId);
        });
    });

    describe('Customers', () => {
        let customerId: string;

        it('should create a customer', async () => {
            const res = await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({ name: 'Alice Smith', phone: '01800000001', email: 'alice@example.com' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Alice Smith');
            customerId = res.body.id;
        });

        it('should reject a duplicate phone number', async () => {
            const res = await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({ name: 'Bob Jones', phone: '01800000001' }); // same phone

            expect(res.status).toBe(400);
        });

        it('should list all customers for the tenant', async () => {
            const res = await request(app.getHttpServer())
                .get('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.some((c: any) => c.id === customerId)).toBe(true);
        });

        it('should fetch a single customer by ID', async () => {
            const res = await request(app.getHttpServer())
                .get(`/customers/${customerId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(customerId);
            expect(res.body.name).toBe('Alice Smith');
        });

        it('should return 404 for a non-existent customer', async () => {
            const res = await request(app.getHttpServer())
                .get('/customers/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(404);
        });

        it('should associate a customer with a sale and track total_spent', async () => {
            const saleRes = await request(app.getHttpServer())
                .post('/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    customerId,
                    totalAmount: 40.00,
                    amountPaid: 40.00,
                    items: [{ productId, quantity: 2, priceAtSale: 20.00 }],
                });

            expect(saleRes.status).toBe(201);

            const customerRes = await request(app.getHttpServer())
                .get(`/customers/${customerId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(parseFloat(customerRes.body.total_spent)).toBe(40.00);
        });
    });
});
