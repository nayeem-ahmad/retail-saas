import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // ── 1. Users ────────────────────────────────────────────────────────────
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@retailsaas.com' },
        update: {},
        create: { email: 'admin@retailsaas.com', name: 'Nayeem Ahmed', passwordHash },
    });

    const managerUser = await prisma.user.upsert({
        where: { email: 'manager@retailsaas.com' },
        update: {},
        create: { email: 'manager@retailsaas.com', name: 'Rafiq Islam', passwordHash },
    });

    const cashierUser = await prisma.user.upsert({
        where: { email: 'cashier@retailsaas.com' },
        update: {},
        create: { email: 'cashier@retailsaas.com', name: 'Sumaiya Khatun', passwordHash },
    });

    // ── 2. Tenant ────────────────────────────────────────────────────────────
    let tenant = await prisma.tenant.findFirst({ where: { owner_id: adminUser.id } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: { name: 'Dhaka Retail Co.', owner_id: adminUser.id },
        });
    }

    // ── 3. Tenant memberships ────────────────────────────────────────────────
    await prisma.tenantUser.upsert({
        where: { tenant_id_user_id: { tenant_id: tenant.id, user_id: adminUser.id } },
        update: {},
        create: { tenant_id: tenant.id, user_id: adminUser.id, role: 'OWNER' },
    });
    await prisma.tenantUser.upsert({
        where: { tenant_id_user_id: { tenant_id: tenant.id, user_id: managerUser.id } },
        update: {},
        create: { tenant_id: tenant.id, user_id: managerUser.id, role: 'MANAGER' },
    });
    await prisma.tenantUser.upsert({
        where: { tenant_id_user_id: { tenant_id: tenant.id, user_id: cashierUser.id } },
        update: {},
        create: { tenant_id: tenant.id, user_id: cashierUser.id, role: 'CASHIER' },
    });

    // ── 4. Store ─────────────────────────────────────────────────────────────
    let store = await prisma.store.findFirst({ where: { tenant_id: tenant.id } });
    if (!store) {
        store = await prisma.store.create({
            data: { tenant_id: tenant.id, name: 'Gulshan Branch', address: '12 Gulshan Ave, Dhaka 1212' },
        });
    }

    // ── 5. Products ──────────────────────────────────────────────────────────
    const productDefs = [
        { name: 'Arabica Coffee Beans (250g)',    sku: 'COF-001', price: 320,  stock: 120 },
        { name: 'Cold Brew Coffee (500ml)',        sku: 'COF-002', price: 180,  stock: 80  },
        { name: 'Green Tea Bags (25 pack)',        sku: 'TEA-001', price: 95,   stock: 200 },
        { name: 'Masala Chai Mix (200g)',          sku: 'TEA-002', price: 140,  stock: 150 },
        { name: 'Mineral Water (1L)',              sku: 'DRK-001', price: 35,   stock: 500 },
        { name: 'Orange Juice (1L)',               sku: 'DRK-002', price: 120,  stock: 60  },
        { name: 'Basmati Rice (1kg)',              sku: 'GRN-001', price: 110,  stock: 300 },
        { name: 'Chickpeas (500g)',                sku: 'GRN-002', price: 75,   stock: 180 },
        { name: 'Lentils (500g)',                  sku: 'GRN-003', price: 65,   stock: 220 },
        { name: 'Sunflower Oil (1L)',              sku: 'OIL-001', price: 190,  stock: 90  },
        { name: 'Turmeric Powder (100g)',          sku: 'SPC-001', price: 55,   stock: 400 },
        { name: 'Cumin Seeds (100g)',              sku: 'SPC-002', price: 45,   stock: 350 },
        { name: 'Dark Chocolate Bar (100g)',       sku: 'SNK-001', price: 150,  stock: 70  },
        { name: 'Mixed Nuts (200g)',               sku: 'SNK-002', price: 280,  stock: 50  },
        { name: 'Potato Chips (150g)',             sku: 'SNK-003', price: 80,   stock: 110 },
        { name: 'Whole Wheat Bread (loaf)',        sku: 'BKY-001', price: 60,   stock: 40  },
        { name: 'Butter (200g)',                   sku: 'DRY-001', price: 130,  stock: 85  },
        { name: 'Cheddar Cheese (200g)',           sku: 'DRY-002', price: 220,  stock: 45  },
        { name: 'Espresso Machine Cleaner (250g)', sku: 'ACC-001', price: 195,  stock: 30  },
        { name: 'Reusable Shopping Bag',           sku: 'ACC-002', price: 50,   stock: 200 },
    ];

    const products: any[] = [];
    for (const def of productDefs) {
        const existing = await prisma.product.findUnique({
            where: { tenant_id_sku: { tenant_id: tenant.id, sku: def.sku } },
        });
        if (existing) {
            products.push(existing);
        } else {
            const p = await prisma.product.create({
                data: {
                    tenant_id: tenant.id,
                    name: def.name,
                    sku: def.sku,
                    price: def.price,
                    stocks: { create: { tenant_id: tenant.id, quantity: def.stock } },
                },
            });
            products.push(p);
        }
    }

    // ── 5b. Customer Groups ─────────────────────────────────────────────────
    const groupDefs = [
        { name: 'Retail',    description: 'Walk-in retail customers',    default_discount_pct: 0 },
        { name: 'Wholesale', description: 'Bulk buyers with discounts',  default_discount_pct: 10 },
        { name: 'VIP Members', description: 'Premium loyalty members',   default_discount_pct: 15 },
    ];

    const groups: any[] = [];
    for (const def of groupDefs) {
        const g = await prisma.customerGroup.upsert({
            where: { tenant_id_name: { tenant_id: tenant.id, name: def.name } },
            update: {},
            create: { tenant_id: tenant.id, ...def },
        });
        groups.push(g);
    }

    // ── 5c. Territories ──────────────────────────────────────────────────────
    const findOrCreateTerritory = async (name: string, parentId?: string, description?: string) => {
        const existing = await prisma.territory.findFirst({
            where: { tenant_id: tenant.id, name, parent_id: parentId ?? null },
        });
        if (existing) return existing;
        return prisma.territory.create({
            data: { tenant_id: tenant.id, name, parent_id: parentId ?? undefined, description },
        });
    };

    const dhakaRoot = await findOrCreateTerritory('Dhaka', undefined, 'Dhaka Division');
    const chittagongRoot = await findOrCreateTerritory('Chittagong', undefined, 'Chittagong Division');

    const subTerritoryDefs = [
        { name: 'Gulshan',    parent_id: dhakaRoot.id },
        { name: 'Dhanmondi',  parent_id: dhakaRoot.id },
        { name: 'Mirpur',     parent_id: dhakaRoot.id },
        { name: 'Uttara',     parent_id: dhakaRoot.id },
        { name: 'Banani',     parent_id: dhakaRoot.id },
    ];

    const subTerritories: any[] = [];
    for (const def of subTerritoryDefs) {
        const t = await findOrCreateTerritory(def.name, def.parent_id);
        subTerritories.push(t);
    }

    // ── 6. Customers ─────────────────────────────────────────────────────────
    const customerDefs = [
        { name: 'Rahim Chowdhury',  phone: '+8801711000001', email: 'rahim@gmail.com',    address: 'Mirpur-10, Dhaka',    code: 'CUST-00001', group: groups[0], territory: subTerritories[2], type: 'INDIVIDUAL' as const },
        { name: 'Fatema Begum',     phone: '+8801812000002', email: 'fatema@yahoo.com',   address: 'Dhanmondi, Dhaka',    code: 'CUST-00002', group: groups[0], territory: subTerritories[1], type: 'INDIVIDUAL' as const },
        { name: 'Karim Hossain',    phone: '+8801913000003', email: null,                  address: 'Uttara, Dhaka',       code: 'CUST-00003', group: groups[1], territory: subTerritories[3], type: 'INDIVIDUAL' as const },
        { name: 'Sabina Akter',     phone: '+8801714000004', email: 'sabina@gmail.com',   address: 'Mohakhali, Dhaka',    code: 'CUST-00004', group: groups[0], territory: subTerritories[4], type: 'INDIVIDUAL' as const },
        { name: 'Jahangir Alam',    phone: '+8801815000005', email: null,                  address: 'Tejgaon, Dhaka',      code: 'CUST-00005', group: groups[1], territory: subTerritories[1], type: 'ORGANIZATION' as const },
        { name: 'Nasrin Sultana',   phone: '+8801916000006', email: 'nasrin@hotmail.com', address: 'Banani, Dhaka',       code: 'CUST-00006', group: groups[2], territory: subTerritories[4], type: 'INDIVIDUAL' as const },
        { name: 'Mizanur Rahman',   phone: '+8801717000007', email: null,                  address: 'Bashundhara, Dhaka',  code: 'CUST-00007', group: groups[1], territory: subTerritories[3], type: 'ORGANIZATION' as const },
        { name: 'Roksana Parvin',   phone: '+8801818000008', email: 'roksana@gmail.com',  address: 'Gulshan, Dhaka',      code: 'CUST-00008', group: groups[2], territory: subTerritories[0], type: 'INDIVIDUAL' as const },
        { name: 'Motiur Rahman',    phone: '+8801919000009', email: null,                  address: 'Wari, Dhaka',         code: 'CUST-00009', group: groups[0], territory: subTerritories[2], type: 'INDIVIDUAL' as const },
        { name: 'Taslima Khanam',   phone: '+8801720000010', email: 'taslima@gmail.com',  address: 'Shyamoli, Dhaka',     code: 'CUST-00010', group: groups[2], territory: subTerritories[1], type: 'INDIVIDUAL' as const },
        { name: 'Anwar Hossain',    phone: '+8801821000011', email: null,                  address: 'Rampura, Dhaka',      code: 'CUST-00011', group: groups[0], territory: subTerritories[2], type: 'INDIVIDUAL' as const },
        { name: 'Halima Khatun',    phone: '+8801922000012', email: 'halima@gmail.com',   address: 'Khilgaon, Dhaka',     code: 'CUST-00012', group: groups[0], territory: subTerritories[1], type: 'INDIVIDUAL' as const },
    ];

    const customers: any[] = [];
    for (const def of customerDefs) {
        const c = await prisma.customer.upsert({
            where: { tenant_id_phone: { tenant_id: tenant.id, phone: def.phone } },
            update: {
                customer_code: def.code,
                customer_type: def.type,
                customer_group_id: def.group.id,
                territory_id: def.territory.id,
            },
            create: {
                tenant_id: tenant.id,
                customer_code: def.code,
                name: def.name,
                phone: def.phone,
                email: def.email ?? undefined,
                address: def.address,
                customer_type: def.type,
                customer_group_id: def.group.id,
                territory_id: def.territory.id,
            },
        });
        customers.push(c);
    }

    // ── 7. Sales (historical) ────────────────────────────────────────────────
    const salesDefs = [
        {
            customer: customers[0], note: 'Regular weekly order',
            items: [{ p: products[0], qty: 2 }, { p: products[4], qty: 6 }],
            payments: [{ method: 'CASH', amount: 850 }],
        },
        {
            customer: customers[1], note: null,
            items: [{ p: products[2], qty: 3 }, { p: products[3], qty: 1 }, { p: products[14], qty: 2 }],
            payments: [{ method: 'BKASH', amount: 585 }],
        },
        {
            customer: customers[2], note: 'Bulk spices',
            items: [{ p: products[10], qty: 5 }, { p: products[11], qty: 5 }],
            payments: [{ method: 'CASH', amount: 300 }, { method: 'BKASH', amount: 200 }],
        },
        {
            customer: customers[3], note: null,
            items: [{ p: products[12], qty: 2 }, { p: products[13], qty: 1 }],
            payments: [{ method: 'CARD', amount: 580 }],
        },
        {
            customer: customers[4], note: 'Office supplies',
            items: [{ p: products[6], qty: 5 }, { p: products[8], qty: 4 }, { p: products[9], qty: 2 }],
            payments: [{ method: 'CASH', amount: 1190 }],
        },
        {
            customer: customers[5], note: null,
            items: [{ p: products[1], qty: 2 }, { p: products[16], qty: 1 }, { p: products[17], qty: 1 }],
            payments: [{ method: 'BKASH', amount: 700 }],
        },
        {
            customer: customers[6], note: 'Catering order',
            items: [{ p: products[4], qty: 20 }, { p: products[6], qty: 10 }, { p: products[7], qty: 6 }],
            payments: [{ method: 'CASH', amount: 2000 }, { method: 'BKASH', amount: 750 }],
        },
        {
            customer: customers[7], note: null,
            items: [{ p: products[15], qty: 2 }, { p: products[16], qty: 2 }, { p: products[5], qty: 1 }],
            payments: [{ method: 'CARD', amount: 490 }],
        },
        {
            customer: customers[8], note: null,
            items: [{ p: products[18], qty: 1 }, { p: products[0], qty: 1 }],
            payments: [{ method: 'CASH', amount: 515 }],
        },
        {
            customer: customers[9], note: 'Birthday party snacks',
            items: [{ p: products[12], qty: 5 }, { p: products[13], qty: 2 }, { p: products[14], qty: 4 }],
            payments: [{ method: 'BKASH', amount: 1330 }],
        },
        {
            customer: customers[10], note: null,
            items: [{ p: products[4], qty: 12 }, { p: products[19], qty: 3 }],
            payments: [{ method: 'CASH', amount: 570 }],
        },
        {
            customer: customers[11], note: null,
            items: [{ p: products[2], qty: 4 }, { p: products[3], qty: 2 }, { p: products[11], qty: 3 }],
            payments: [{ method: 'CARD', amount: 755 }],
        },
        // Walk-in sales (no customer)
        {
            customer: null, note: 'Walk-in',
            items: [{ p: products[14], qty: 3 }, { p: products[4], qty: 2 }],
            payments: [{ method: 'CASH', amount: 310 }],
        },
        {
            customer: null, note: null,
            items: [{ p: products[0], qty: 1 }, { p: products[2], qty: 2 }],
            payments: [{ method: 'BKASH', amount: 510 }],
        },
        {
            customer: null, note: 'Quick sale',
            items: [{ p: products[15], qty: 1 }, { p: products[16], qty: 1 }],
            payments: [{ method: 'CASH', amount: 190 }],
        },
    ];

    let saleIndex = 0;
    for (const def of salesDefs) {
        saleIndex++;
        const serialNumber = `SL-SEED-${String(saleIndex).padStart(4, '0')}`;
        const existing = await prisma.sale.findUnique({
            where: { tenant_id_serial_number: { tenant_id: tenant.id, serial_number: serialNumber } },
        });
        if (existing) continue;

        const totalAmount = def.items.reduce(
            (sum, i) => sum + Number(i.p.price) * i.qty, 0
        );
        const amountPaid = def.payments.reduce((sum, p) => sum + p.amount, 0);

        const sale = await prisma.sale.create({
            data: {
                tenant_id: tenant.id,
                store_id: store.id,
                customer_id: def.customer?.id ?? null,
                serial_number: serialNumber,
                total_amount: totalAmount,
                amount_paid: amountPaid,
                status: 'COMPLETED',
                note: def.note ?? null,
                items: {
                    create: def.items.map(i => ({
                        product_id: i.p.id,
                        quantity: i.qty,
                        price_at_sale: Number(i.p.price),
                    })),
                },
                payments: {
                    create: def.payments.map(p => ({
                        payment_method: p.method,
                        amount: p.amount,
                    })),
                },
            },
        });

        // Update customer total_spent
        if (def.customer) {
            await prisma.customer.update({
                where: { id: def.customer.id },
                data: { total_spent: { increment: totalAmount } },
            });
        }
    }

    // ── 8. Summary ───────────────────────────────────────────────────────────
    const productCount    = await prisma.product.count({ where: { tenant_id: tenant.id } });
    const customerCount   = await prisma.customer.count({ where: { tenant_id: tenant.id } });
    const saleCount       = await prisma.sale.count({ where: { tenant_id: tenant.id } });
    const groupCount      = await prisma.customerGroup.count({ where: { tenant_id: tenant.id } });
    const territoryCount  = await prisma.territory.count({ where: { tenant_id: tenant.id } });

    console.log('\n✅  Seed complete');
    console.log('─────────────────────────────────────');
    console.log(`👤  Users:           admin / manager / cashier  (password: password123)`);
    console.log(`🏪  Tenant:          ${tenant.name}`);
    console.log(`🏬  Store:           ${store.name}`);
    console.log(`📦  Products:        ${productCount}`);
    console.log(`👥  Customers:       ${customerCount}`);
    console.log(`📂  Customer Groups: ${groupCount}`);
    console.log(`🗺️   Territories:     ${territoryCount}`);
    console.log(`🧾  Sales:           ${saleCount}`);
    console.log('─────────────────────────────────────');
    console.log('Login → http://localhost:3000');
    console.log('Email: admin@retailsaas.com  |  Password: password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
