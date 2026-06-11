CREATE TABLE IF NOT EXISTS cost_centers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code       TEXT NOT NULL,
    name       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON cost_centers(tenant_id);
ALTER TABLE voucher_details ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES cost_centers(id);
CREATE INDEX IF NOT EXISTS idx_voucher_details_cost_center ON voucher_details(cost_center_id);
