"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const supertest_1 = require("supertest");
const app_module_1 = require("../src/app.module");
const database_service_1 = require("../src/database/database.service");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
describe('Integration Tests (e2e)', () => {
    let app;
    let db;
    let authToken;
    let tenantId;
    let storeId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe());
        await app.init();
        db = moduleFixture.get(database_service_1.DatabaseService);
        await db.$executeRawUnsafe('TRUNCATE TABLE "SaleItem", "Sale", "ProductStock", "Product", "Store", "User", "Tenant" CASCADE');
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Auth & Store Setup', () => {
        it('should signup a new user', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
        let productId;
        it('should create a new product', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const product = await db.product.findFirst({
                where: { sku: 'CB-001' },
                include: { stocks: true }
            });
            const initialStock = product?.stocks[0]?.quantity || 0;
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const productAfter = await db.product.findUnique({
                where: { id: product?.id },
                include: { stocks: true }
            });
            expect(productAfter?.stocks[0]?.quantity).toBe(initialStock - 2);
        });
        it('should fail if stock is insufficient', async () => {
            const product = await db.product.findFirst({ where: { sku: 'CB-001' } });
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
                        quantity: 1000,
                        priceAtSale: 15.50,
                    }
                ]
            });
            expect(response.status).toBe(400);
        });
    });
});
//# sourceMappingURL=integration.spec.js.map