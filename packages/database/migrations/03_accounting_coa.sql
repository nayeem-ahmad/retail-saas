-- --- ACCOUNTING COA TABLES ---

CREATE TABLE IF NOT EXISTS account_groups (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_account_groups_tenant_id ON account_groups(tenant_id);

CREATE TABLE IF NOT EXISTS account_subgroups (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL REFERENCES account_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, name)
);

CREATE INDEX IF NOT EXISTS idx_account_subgroups_tenant_id ON account_subgroups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_account_subgroups_group_id ON account_subgroups(group_id);

CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL REFERENCES account_groups(id),
    subgroup_id TEXT REFERENCES account_subgroups(id),
    name TEXT NOT NULL,
    code TEXT,
    type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_group_id ON accounts(group_id);
CREATE INDEX IF NOT EXISTS idx_accounts_subgroup_id ON accounts(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_type ON accounts(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_category ON accounts(tenant_id, category);