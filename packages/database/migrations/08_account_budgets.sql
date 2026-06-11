CREATE TABLE IF NOT EXISTS account_budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    fiscal_year INT NOT NULL,
    month       INT CHECK (month BETWEEN 1 AND 12),
    amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, account_id, fiscal_year, month)
);
CREATE INDEX IF NOT EXISTS idx_account_budgets_tenant_year ON account_budgets(tenant_id, fiscal_year);
