-- CreateTable
CREATE TABLE "TenantRole" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantRolePermission" (
    "id" TEXT NOT NULL,
    "tenant_role_id" TEXT NOT NULL,
    "permission" "StorePermission" NOT NULL,

    CONSTRAINT "TenantRolePermission_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TenantUser" ADD COLUMN "tenant_role_id" TEXT;

-- UserInvitation: add tenant_role_id when table already exists (nullable until backfill)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'UserInvitation'
    ) THEN
        ALTER TABLE "UserInvitation" ADD COLUMN IF NOT EXISTS "tenant_role_id" TEXT;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX "TenantRole_tenant_id_idx" ON "TenantRole"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRole_tenant_id_name_key" ON "TenantRole"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRolePermission_tenant_role_id_permission_key" ON "TenantRolePermission"("tenant_role_id", "permission");

-- AddForeignKey
ALTER TABLE "TenantRole" ADD CONSTRAINT "TenantRole_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRolePermission" ADD CONSTRAINT "TenantRolePermission_tenant_role_id_fkey" FOREIGN KEY ("tenant_role_id") REFERENCES "TenantRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Backfill system roles and permissions per tenant ─────────────────────────

CREATE TEMP TABLE "_tenant_role_backfill" (
    "tenant_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "cashier_id" TEXT NOT NULL,
    "accountant_id" TEXT NOT NULL
);

INSERT INTO "_tenant_role_backfill" ("tenant_id", "manager_id", "cashier_id", "accountant_id")
SELECT
    t."id",
    gen_random_uuid()::text,
    gen_random_uuid()::text,
    gen_random_uuid()::text
FROM "Tenant" t;

INSERT INTO "TenantRole" ("id", "tenant_id", "name", "description", "is_system", "created_at", "updated_at")
SELECT "manager_id", "tenant_id", 'Manager', 'Default manager role with broad store permissions', true, NOW(), NOW()
FROM "_tenant_role_backfill"
UNION ALL
SELECT "cashier_id", "tenant_id", 'Cashier', 'Default cashier role for point-of-sale operations', true, NOW(), NOW()
FROM "_tenant_role_backfill"
UNION ALL
SELECT "accountant_id", "tenant_id", 'Accountant', 'Default accountant role for financial operations', true, NOW(), NOW()
FROM "_tenant_role_backfill";

INSERT INTO "TenantRolePermission" ("id", "tenant_role_id", "permission")
SELECT gen_random_uuid()::text, b."manager_id", p.perm::"StorePermission"
FROM "_tenant_role_backfill" b
CROSS JOIN unnest(ARRAY[
    'VIEW_PRODUCT_CATALOG',
    'EDIT_PRODUCTS',
    'EDIT_PRODUCT_PRICES',
    'EDIT_SUPPLIERS',
    'EDIT_BRANDS',
    'CREATE_INVENTORY_MOVEMENTS',
    'CREATE_GOODS_TRANSFER',
    'STOCK_TAKE',
    'CREATE_SALE',
    'CREATE_PURCHASE',
    'CREATE_RETURN',
    'CREATE_SALES_ORDER',
    'CREATE_QUOTATION',
    'VIEW_LEDGER',
    'CREATE_VOUCHER',
    'VIEW_FINANCIAL_REPORTS',
    'CREATE_FUND_TRANSFER',
    'SWITCH_STORES',
    'MANAGE_COUNTERS',
    'VIEW_CRM_INTERACTIONS',
    'CREATE_CRM_INTERACTIONS',
    'MANAGE_CRM_TASKS',
    'VIEW_CUSTOMER_CREDIT',
    'MANAGE_CUSTOMER_CREDIT',
    'VIEW_LEADS',
    'MANAGE_LEADS',
    'VIEW_LEAD_CONVERSATIONS',
    'CREATE_LEAD_CONVERSATIONS',
    'VIEW_LOANS',
    'MANAGE_LOANS'
]) AS p(perm);

INSERT INTO "TenantRolePermission" ("id", "tenant_role_id", "permission")
SELECT gen_random_uuid()::text, b."cashier_id", p.perm::"StorePermission"
FROM "_tenant_role_backfill" b
CROSS JOIN unnest(ARRAY[
    'VIEW_PRODUCT_CATALOG',
    'CREATE_SALE',
    'CREATE_RETURN',
    'SWITCH_STORES',
    'VIEW_LEDGER'
]) AS p(perm);

INSERT INTO "TenantRolePermission" ("id", "tenant_role_id", "permission")
SELECT gen_random_uuid()::text, b."accountant_id", p.perm::"StorePermission"
FROM "_tenant_role_backfill" b
CROSS JOIN unnest(ARRAY[
    'VIEW_PRODUCT_CATALOG',
    'VIEW_LEDGER',
    'CREATE_VOUCHER',
    'VIEW_FINANCIAL_REPORTS',
    'SWITCH_STORES',
    'VIEW_CONSOLIDATED_REPORTS',
    'VIEW_LOANS',
    'MANAGE_LOANS'
]) AS p(perm);

UPDATE "TenantUser" tu
SET "tenant_role_id" = b."manager_id"
FROM "_tenant_role_backfill" b
WHERE tu."tenant_id" = b."tenant_id"
  AND tu."role" = 'MANAGER';

UPDATE "TenantUser" tu
SET "tenant_role_id" = b."cashier_id"
FROM "_tenant_role_backfill" b
WHERE tu."tenant_id" = b."tenant_id"
  AND tu."role" = 'CASHIER';

UPDATE "TenantUser" tu
SET "tenant_role_id" = b."accountant_id"
FROM "_tenant_role_backfill" b
WHERE tu."tenant_id" = b."tenant_id"
  AND tu."role" = 'ACCOUNTANT';

-- OWNER rows keep tenant_role_id NULL

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'UserInvitation'
    ) THEN
        UPDATE "UserInvitation" ui
        SET "tenant_role_id" = b."manager_id"
        FROM "_tenant_role_backfill" b
        WHERE ui."tenant_id" = b."tenant_id"
          AND ui."role" = 'MANAGER';

        UPDATE "UserInvitation" ui
        SET "tenant_role_id" = b."cashier_id"
        FROM "_tenant_role_backfill" b
        WHERE ui."tenant_id" = b."tenant_id"
          AND ui."role" = 'CASHIER';

        UPDATE "UserInvitation" ui
        SET "tenant_role_id" = b."accountant_id"
        FROM "_tenant_role_backfill" b
        WHERE ui."tenant_id" = b."tenant_id"
          AND ui."role" = 'ACCOUNTANT';

        UPDATE "UserInvitation" ui
        SET "tenant_role_id" = b."manager_id"
        FROM "_tenant_role_backfill" b
        WHERE ui."tenant_id" = b."tenant_id"
          AND ui."role" = 'OWNER'
          AND ui."tenant_role_id" IS NULL;

        UPDATE "UserInvitation" ui
        SET "tenant_role_id" = b."cashier_id"
        FROM "_tenant_role_backfill" b
        WHERE ui."tenant_id" = b."tenant_id"
          AND ui."tenant_role_id" IS NULL;

        ALTER TABLE "UserInvitation" DROP COLUMN "role";
        ALTER TABLE "UserInvitation" ALTER COLUMN "tenant_role_id" SET NOT NULL;
    ELSE
        CREATE TABLE "UserInvitation" (
            "id" TEXT NOT NULL,
            "tenant_id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "tenant_role_id" TEXT NOT NULL,
            "token_hash" TEXT NOT NULL,
            "invited_by" TEXT NOT NULL,
            "expires_at" TIMESTAMP(3) NOT NULL,
            "accepted_at" TIMESTAMP(3),
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "UserInvitation_pkey" PRIMARY KEY ("id")
        );

        CREATE UNIQUE INDEX "UserInvitation_token_hash_key" ON "UserInvitation"("token_hash");
        CREATE INDEX "UserInvitation_tenant_id_email_idx" ON "UserInvitation"("tenant_id", "email");

        ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

        ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_invited_by_fkey"
            FOREIGN KEY ("invited_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DROP TABLE "_tenant_role_backfill";

-- AddForeignKey
ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_tenant_role_id_fkey" FOREIGN KEY ("tenant_role_id") REFERENCES "TenantRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (only when UserInvitation existed before backfill; new table gets FK below)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'UserInvitation_tenant_role_id_fkey'
    ) THEN
        ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_tenant_role_id_fkey"
            FOREIGN KEY ("tenant_role_id") REFERENCES "TenantRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;