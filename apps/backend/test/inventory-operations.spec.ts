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

describe('Inventory Operations (e2e)', () => {
    let app: INestApplication;
    let db: DatabaseService;
    let authToken: string;
    let tenantId: string;
    let storeId: string;
    let productId: string;
    let sourceWarehouseId: string;
    let destWarehouseId: string;

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
            'TRUNCATE TABLE posting_events, posting_rules, voucher_details, vouchers, voucher_sequences, accounts, account_subgroups, account_groups, "ProductStock", "Product", "Warehouse", "Store", "User", "Tenant" CASCADE',
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
                .send({ email: 'inv-test@example.com', password: 'password123', name: 'Inventory Tester' })
                .expect(201);

            const loginRes = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'inv-test@example.com', password: 'password123' })
                .expect(201);

            authToken = loginRes.body.access_token;

            const storeRes = await request(app.getHttpServer())
                .post('/auth/setup-store')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Inventory Store', location: 'Warehouse City', planCode: 'PREMIUM' })
                .expect(201);

            tenantId = storeRes.body.tenant.id;
            storeId = storeRes.body.store.id;
        });

        it('should resolve default warehouse for the store', async () => {
            const warehouse = await db.warehouse.findFirst({ where: { store_id: storeId } });
            expect(warehouse).toBeTruthy();
            sourceWarehouseId = warehouse!.id;

            // Create a second warehouse to use as transfer destination
            const dest = await db.warehouse.create({
                data: {
                    tenant_id: tenantId,
                    store_id: storeId,
                    name: 'Secondary Warehouse',
                    code: 'WH-SEC',
                },
            });
            destWarehouseId = dest.id;
        });

        it('should create a product with initial stock', async () => {
            const res = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({ name: 'Inventory Item', sku: 'INV-001', price: 10.00, initialStock: 100 })
                .expect(201);

            productId = res.body.id;
        });
    });

    describe('Warehouse Transfers', () => {
        let transferId: string;

        it('should create a transfer with SENT status and decrement source stock', async () => {
            const stockBefore = await db.productStock.findFirst({
                where: { product_id: productId, warehouse_id: sourceWarehouseId },
            });
            const quantityBefore = stockBefore!.quantity;

            const res = await request(app.getHttpServer())
                .post('/warehouse-transfers')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({
                    sourceWarehouseId,
                    destinationWarehouseId: destWarehouseId,
                    status: 'SENT',
                    items: [{ productId, quantity: 10 }],
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('transfer_number');
            expect(res.body.status).toBe('SENT');
            transferId = res.body.id;

            const stockAfter = await db.productStock.findFirst({
                where: { product_id: productId, warehouse_id: sourceWarehouseId },
            });
            expect(stockAfter!.quantity).toBe(quantityBefore - 10);
        });

        it('should reject a transfer with the same source and destination', async () => {
            const res = await request(app.getHttpServer())
                .post('/warehouse-transfers')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({
                    sourceWarehouseId,
                    destinationWarehouseId: sourceWarehouseId,
                    status: 'SENT',
                    items: [{ productId, quantity: 5 }],
                });

            expect(res.status).toBe(400);
        });

        it('should receive a transfer and increment destination stock', async () => {
            const destStockBefore = await db.productStock.findFirst({
                where: { product_id: productId, warehouse_id: destWarehouseId },
            });
            const quantityBefore = destStockBefore?.quantity ?? 0;

            const res = await request(app.getHttpServer())
                .post(`/warehouse-transfers/${transferId}/receive`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({
                    items: [{ productId, quantityReceived: 6 }],
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toMatch(/PARTIALLY_RECEIVED|RECEIVED/);

            const destStockAfter = await db.productStock.findFirst({
                where: { product_id: productId, warehouse_id: destWarehouseId },
            });
            expect(destStockAfter!.quantity).toBe(quantityBefore + 6);
        });

        it('should list all transfers for the tenant', async () => {
            const res = await request(app.getHttpServer())
                .get('/warehouse-transfers')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('transfer_number');
        });

        it('should fetch a single transfer by ID', async () => {
            const res = await request(app.getHttpServer())
                .get(`/warehouse-transfers/${transferId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(transferId);
            expect(res.body).toHaveProperty('items');
        });

        it('should filter transfers by status', async () => {
            const res = await request(app.getHttpServer())
                .get('/warehouse-transfers')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .query({ status: 'SENT' });

            expect(res.status).toBe(200);
            // Our transfer moved to PARTIALLY_RECEIVED so this should be empty or not include it
            const found = res.body.find((t: any) => t.id === transferId);
            expect(found).toBeUndefined();
        });
    });

    describe('Inventory Shrinkage', () => {
        it('should record inventory shrinkage and decrement stock', async () => {
            const stockBefore = await db.productStock.findFirst({
                where: { product_id: productId, warehouse_id: sourceWarehouseId },
            });
            const quantityBefore = stockBefore!.quantity;

            const res = await request(app.getHttpServer())
                .post('/inventory-shrinkage')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId,
                    note: 'Damaged in storage',
                    items: [{ productId, quantity: 3, warehouseId: sourceWarehouseId }],
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.items).toHaveLength(1);

            const stockAfter = await db.productStock.findFirst({
                where: { product_id: productId, warehouse_id: sourceWarehouseId },
            });
            expect(stockAfter!.quantity).toBe(quantityBefore - 3);
        });

        it('should list all shrinkage records for the tenant', async () => {
            const res = await request(app.getHttpServer())
                .get('/inventory-shrinkage')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    describe('Stock Takes', () => {
        let sessionId: string;

        it('should create a stock-take session with a snapshot of current stock', async () => {
            const res = await request(app.getHttpServer())
                .post('/stock-takes')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({
                    warehouseId: sourceWarehouseId,
                    startImmediately: true,
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('session_number');
            expect(res.body.status).toBe('COUNTING');
            expect(res.body).toHaveProperty('summary');
            expect(res.body.summary.totalExpectedQuantity).toBeGreaterThan(0);
            sessionId = res.body.id;
        });

        it('should update count lines for the stock-take session', async () => {
            const sessionDetail = await request(app.getHttpServer())
                .get(`/stock-takes/${sessionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .expect(200);

            const line = sessionDetail.body.lines[0];
            const expectedQty = line.expected_quantity;

            const res = await request(app.getHttpServer())
                .patch(`/stock-takes/${sessionId}/counts`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({
                    lines: [{ productId: line.product_id, countedQuantity: expectedQty }],
                });

            expect(res.status).toBe(200);
            expect(res.body.summary).toBeDefined();
        });

        it('should list all stock-take sessions for the tenant', async () => {
            const res = await request(app.getHttpServer())
                .get('/stock-takes')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('session_number');
        });

        it('should post a stock-take session with zero variance without requiring approval', async () => {
            // Update all lines to match expected so no variance triggers approval
            const sessionDetail = await request(app.getHttpServer())
                .get(`/stock-takes/${sessionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .expect(200);

            await request(app.getHttpServer())
                .patch(`/stock-takes/${sessionId}/counts`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .send({
                    lines: sessionDetail.body.lines.map((l: any) => ({
                        productId: l.product_id,
                        countedQuantity: l.expected_quantity,
                    })),
                });

            const res = await request(app.getHttpServer())
                .post(`/stock-takes/${sessionId}/post`)
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('POSTED');
        });
    });
});
