# Epic 03: SaaS Multi-Tenancy & Billing

### Epic Goal
Transform the single-store architecture into a true multi-tenant SaaS platform. This epic enables businesses to subscribe to different tiers, manage billing, and control multiple stores under a single organizational account.

### Epic Description
Currently, the system is architected for a single store per owner. To operate as a commercial SaaS, we need to introduce a "Tenant" layer to manage subscriptions (Basic vs. Premium), handle recurring billing, and restrict feature access based on the active plan.

**Integration Points:**
*   **Data Models:** Introduction of `Tenant`, `SubscriptionPlan`, and `TenantSubscription`. Restructuring of `Store` to belong to a `Tenant`.
*   **Authentication & RLS:** Update database Row-Level Security (RLS) policies to isolate data by `tenant_id` instead of just `store_id` or `owner_id`.
*   **Payment Gateway:** Integration with a payment provider (e.g., Stripe, bKash) for handling subscription payments.

**Success Criteria:**
1. A new user can register and create a Tenant (Organization).
2. A Tenant can subscribe to a specific pricing plan (Basic or Premium).
3. Access to Premium features is blocked if the Tenant's subscription is basic or inactive.
4. A Tenant can create and manage multiple Stores under their account.

### Stories

1. **Story 1: Tenant & Subscription Schema Migration**
   * **Description:** Update the database schema to include Tenant and Subscription models. Migrate existing User/Store relationships to the new Tenant model. Update RLS policies.

2. **Story 2: SaaS Onboarding Flow**
   * **Description:** Build the UI flow for a new business owner to sign up, create their organization (Tenant), and select a subscription plan.

3. **Story 3: Subscription Billing Integration**
   * **Description:** Integrate a payment gateway to process recurring monthly/annual subscription fees. Create webhooks to automatically update the `TenantSubscription` status upon successful or failed payments.

4. **Story 4: Feature Flagging Middleware**
   * **Description:** Implement backend middleware that intercepts API requests for Premium features and verifies the Tenant's active subscription status before allowing access.

5. **Story 5: Tenant Management Dashboard**
   * **Description:** Create an admin interface for the platform owners (us) to view tenants, manage subscription plans, and assist with billing issues.
