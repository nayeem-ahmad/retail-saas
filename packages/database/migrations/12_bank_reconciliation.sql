CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id                UUID NOT NULL,
    statement_date            TIMESTAMPTZ NOT NULL,
    statement_closing_balance NUMERIC(12, 2) NOT NULL,
    status                    TEXT NOT NULL DEFAULT 'OPEN',
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_tenant ON bank_reconciliations(tenant_id, account_id);

CREATE TABLE IF NOT EXISTS bank_statement_entries (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id         UUID NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    entry_date                TIMESTAMPTZ NOT NULL,
    description               TEXT,
    amount                    NUMERIC(12, 2) NOT NULL,
    entry_type                TEXT NOT NULL,
    is_matched                BOOLEAN NOT NULL DEFAULT FALSE,
    matched_voucher_detail_id UUID,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bank_statement_entries_recon ON bank_statement_entries(reconciliation_id);
