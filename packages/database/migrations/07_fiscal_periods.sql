CREATE TABLE IF NOT EXISTS fiscal_periods (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    year              INT NOT NULL,
    month             INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_label      TEXT NOT NULL,
    start_date        TIMESTAMPTZ NOT NULL,
    end_date          TIMESTAMPTZ NOT NULL,
    is_locked         BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at         TIMESTAMPTZ,
    locked_by_user_id UUID,
    UNIQUE (tenant_id, year, month)
);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_tenant ON fiscal_periods(tenant_id);
