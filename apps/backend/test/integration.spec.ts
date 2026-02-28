import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Integration Tests (e2e)', () => {
    let app: INestApplication;
    let db: DatabaseService;
    let authToken: string;
    let tenantId: string;
    let storeId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        db = moduleFixture.get<DatabaseService>(DatabaseService);

        // Clean database before tests
        // Note: In a real scenario, use a TDB or separate schema
        await db.$executeRawUnsafe('TRUNCATE TABLE "SaleItem", "Sale", "ProductStock", "Product", "Store", "User", "Tenant" CASCADE');
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Auth & Store Setup', () => {
        it('should signup a new user', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
            tenantId = response.body.user.tenant_id;
        });

        it('should login and return a token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('access_token');
            authToken = response.body.access_token;
        });

        it('should setup a store', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/setup-store')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Store',
                    location: 'Test City',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            storeId = response.body.id;
        });
    });

    describe('Product Management', () => {
        let productId: string;

        it('should create a new product', async () => {
            const response = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    name: 'Coffee Beans',
                    sku: 'CB-001',
                    price: 15.50,
                    category: 'Beverages',
                    initial_stock: 100,
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            productId = response.body.id;
        });

        it('should get all products for the store', async () => {
            const response = await request(app.getHttpServer())
                .get('/products')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].name).toBe('Coffee Beans');
        });
    });

    describe('POS Sales', () => {
        it('should process a sale and decrement stock', async () => {
            // 1. Get product first to ensure we have ID
            const product = await db.product.findFirst({
                where: { sku: 'CB-001' },
                include: { stocks: true }
            });
            const initialStock = product?.stocks[0]?.quantity || 0;

            // 2. Process sale
            const response = await request(app.getHttpServer())
                .post('/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId: storeId,
                    totalAmount: 31.00,
                    amountPaid: 31.00,
                    items: [
                        {
                            productId: product?.id,
                            quantity: 2,
                            priceAtSale: 15.50,
                        }
                    ]
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');

            // 3. Verify stock decrement
            const productAfter = await db.product.findUnique({
                where: { id: product?.id },
                include: { stocks: true }
            });
            expect(productAfter?.stocks[0]?.quantity).toBe(initialStock - 2);
        });

        it('should fail if stock is insufficient', async () => {
            const product = await db.product.findFirst({ where: { sku: 'CB-001' } });

            const response = await request(app.getHttpServer())
                .post('/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .set('x-tenant-id', tenantId)
                .set('x-store-id', storeId)
                .send({
                    storeId: storeId,
                    totalAmount: 15500.00,
                    amountPaid: 15500.00,
                    items: [
                        {
                            productId: product?.id,
                            quantity: 1000, // Exceeds stock
                            priceAtSale: 15.50,
                        }
                    ]
                });

            expect(response.status).toBe(400); // Insufficient stock throws BadRequestException (400)
        });
    });
});
