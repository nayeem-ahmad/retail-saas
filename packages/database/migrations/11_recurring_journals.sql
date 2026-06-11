CREATE TABLE IF NOT EXISTS recurring_journals (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    description    TEXT,
    frequency      TEXT NOT NULL,
    next_due_date  TIMESTAMPTZ NOT NULL,
    last_run_date  TIMESTAMPTZ,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recurring_journals_tenant ON recurring_journals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_journals_tenant_due ON recurring_journals(tenant_id, next_due_date, is_active);

CREATE TABLE IF NOT EXISTS recurring_journal_lines (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_journal_id UUID NOT NULL REFERENCES recurring_journals(id) ON DELETE CASCADE,
    account_id           UUID NOT NULL REFERENCES accounts(id),
    debit_amount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    credit_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    comment              TEXT
);
CREATE INDEX IF NOT EXISTS idx_recurring_journal_lines_journal ON recurring_journal_lines(recurring_journal_id);
