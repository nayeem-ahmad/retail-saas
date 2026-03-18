-- --- ENUMS ---
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier', 'accountant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --- TENANTS (Organizations) ---
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL, -- References auth.users(id) in Supabase
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --- STORES ---
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --- USER PERMISSIONS (Memberships) ---
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References auth.users(id) in Supabase
    role user_role NOT NULL DEFAULT 'cashier',
    UNIQUE(tenant_id, user_id)
);

-- --- PROFILES (Extending auth.users) ---
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Will be linked to auth.users in Supabase
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);
