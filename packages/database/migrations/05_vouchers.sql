-- --- ACCOUNTING VOUCHERS ---

CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
    voucher_number TEXT NOT NULL,
    voucher_type TEXT NOT NULL,
    description TEXT,
    reference_number TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, voucher_number)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_tenant_id ON vouchers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_tenant_type ON vouchers(tenant_id, voucher_type);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);

CREATE TABLE IF NOT EXISTS voucher_details (
    id TEXT PRIMARY KEY,
    voucher_id TEXT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    debit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voucher_details_voucher_id ON voucher_details(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_details_account_id ON voucher_details(account_id);