-- --- ROW LEVEL SECURITY (RLS) ---

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- --- MULTI-TENANCY HELPERS ---

-- Get the tenant_id for the current authenticated user
-- Renamed to current_store_id to align with story specification
CREATE OR REPLACE FUNCTION current_store_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --- POLICIES ---

-- TENANTS: Only owners and assigned users can see their tenant info
CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL
    TO authenticated
    USING (id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- STORES: Filter by tenant_id
CREATE POLICY store_tenant_isolation_policy ON stores
    FOR ALL
    TO authenticated
    USING (tenant_id = current_store_id());

-- TENANT_USERS: Filter by tenant_id
CREATE POLICY user_tenant_isolation_policy ON tenant_users
    FOR ALL
    TO authenticated
    USING (tenant_id = current_store_id());

-- PROFILES: Only the user themselves or users in the same tenant can see profiles
CREATE POLICY profile_self_and_tenant_policy ON profiles
    FOR ALL
    TO authenticated
    USING (
        id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM tenant_users tu1
            JOIN tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
            WHERE tu1.user_id = auth.uid() AND tu2.user_id = profiles.id
        )
    );
