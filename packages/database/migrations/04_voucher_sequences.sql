-- --- ACCOUNTING VOUCHER SEQUENCES ---

CREATE TABLE IF NOT EXISTS voucher_sequences (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
    voucher_type TEXT NOT NULL,
    prefix TEXT NOT NULL,
    next_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, voucher_type)
);

CREATE INDEX IF NOT EXISTS idx_voucher_sequences_tenant_id ON voucher_sequences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voucher_sequences_tenant_type ON voucher_sequences(tenant_id, voucher_type);