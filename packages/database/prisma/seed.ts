import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create User
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            passwordHash,
        },
    });

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Main Business',
            owner_id: user.id,
        },
    });

    // 3. Create TenantUser (Membership)
    await prisma.tenantUser.create({
        data: {
            tenant_id: tenant.id,
            user_id: user.id,
            role: 'OWNER',
        },
    });

    // 4. Create Store
    const store = await prisma.store.create({
        data: {
            tenant_id: tenant.id,
            name: 'Downtown Store',
            address: '123 Main St, City',
        },
    });

    // 5. Create Products
    const product1 = await prisma.product.create({
        data: {
            tenant_id: tenant.id,
            name: 'Arabica Coffee Beans',
            sku: 'COF-001',
            price: 18.50,
            stocks: {
                create: {
                    tenant_id: tenant.id,
                    quantity: 100,
                },
            },
        },
    });

    const product2 = await prisma.product.create({
        data: {
            tenant_id: tenant.id,
            name: 'Espresso Machine Cleaner',
            sku: 'ACC-002',
            price: 12.00,
            stocks: {
                create: {
                    tenant_id: tenant.id,
                    quantity: 50,
                },
            },
        },
    });

    // 6. Create initial sales
    await prisma.sale.create({
        data: {
            tenant_id: tenant.id,
            store_id: store.id,
            serial_number: `SL-${Date.now()}-1`,
            total_amount: 37.00,
            amount_paid: 37.00,
            status: 'COMPLETED',
            items: {
                create: [
                    {
                        product_id: product1.id,
                        quantity: 2,
                        price_at_sale: 18.50,
                    },
                ],
            },
        },
    });

    console.log('Seed data created successfully');
    console.log('User: admin@example.com / password123');
    console.log('Tenant:', tenant.name);
    console.log('Store:', store.name);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
