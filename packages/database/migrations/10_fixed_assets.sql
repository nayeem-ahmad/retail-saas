DO $$ BEGIN
    CREATE TYPE depreciation_method AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS fixed_assets (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_code               TEXT NOT NULL,
    name                     TEXT NOT NULL,
    purchase_date            TIMESTAMPTZ NOT NULL,
    cost                     NUMERIC(12, 2) NOT NULL,
    residual_value           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    useful_life_months       INT NOT NULL,
    depreciation_method      depreciation_method NOT NULL DEFAULT 'STRAIGHT_LINE',
    accumulated_depreciation NUMERIC(12, 2) NOT NULL DEFAULT 0,
    disposal_date            TIMESTAMPTZ,
    asset_account_id         UUID,
    depreciation_account_id  UUID,
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, asset_code)
);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_tenant ON fixed_assets(tenant_id);

CREATE TABLE IF NOT EXISTS asset_depreciation_entries (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id             UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
    period_year          INT NOT NULL,
    period_month         INT NOT NULL,
    depreciation_amount  NUMERIC(12, 2) NOT NULL,
    voucher_id           UUID,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (asset_id, period_year, period_month)
);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_asset ON asset_depreciation_entries(asset_id);
