# Admin: Create New Tenant

**Date:** 2026-06-16  
**Status:** Approved

## Summary

Give platform admins the ability to create a new tenant directly from the admin dashboard — equivalent to a manual signup on behalf of a customer. The owner can be either a brand-new user (admin supplies email; temp password auto-generated and emailed) or an existing platform user.

---

## Backend

### New endpoint

`POST /admin/tenants`  
Protected by `JwtAuthGuard + PlatformAdminGuard` (same as the rest of `AdminTenantsController`).

### DTO: `CreateAdminTenantDto`

```ts
ownerMode: 'new' | 'existing'

// ownerMode = 'new'
ownerEmail: string          // required when ownerMode = 'new'
ownerName?: string          // optional

// ownerMode = 'existing'
ownerUserId?: string        // required when ownerMode = 'existing'

tenantName: string
storeName: string
address?: string
businessType?: string       // e.g. GROCERY, PHARMACY, SURGICAL_MEDICAL, COMPUTER_HARDWARE
planCode: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM'
```

Validation: `ownerEmail` required when `ownerMode = 'new'`; `ownerUserId` required when `ownerMode = 'existing'`. `tenantName`, `storeName`, and `planCode` always required.

### Service method: `createTenant(dto, adminUserId)`

Inline in `AdminTenantsService` (no new shared service). Steps:

1. **Resolve owner user**
   - `ownerMode = 'new'`: check email not already taken (throw `ConflictException` if it is) → create `User` with a random 16-char alphanumeric temp password (bcrypt-hashed) → fire-and-forget `EmailService.sendWelcome(email, name)`
   - `ownerMode = 'existing'`: `db.user.findUnique({ where: { id: ownerUserId } })` → throw `NotFoundException` if not found

2. **Provision inside `db.$transaction`**
   - Create `Tenant` (name, owner_id, business_type if provided)
   - Create `TenantUser` (role: OWNER)
   - Create `Store` (name, address)
   - Look up `SubscriptionPlan` by `planCode`; throw `BadRequestException` if not active
   - Create `TenantSubscription` (status: TRIALING, 14-day trial period, provider_name: 'manual')
   - Create `UserStoreAccess` (access_level: MULTI_STORE_CAPABLE)
   - Create `UserStorePermission` entries for all OWNER default permissions

3. **Post-transaction**
   - Fire-and-forget `bootstrapDefaultAccountingForTenant(db, tenantId)`
   - If `businessType` set: fire-and-forget `seedBusinessTypeTemplate(db, tenantId, businessType)`
   - Audit log: `tenant.admin_create` with `{ created_by: adminUserId, owner_email, owner_mode }`

4. **Response**: return `getTenant(tenant.id)` — same shape as the existing detail endpoint.

### Supporting lookup endpoint

`GET /admin/users/lookup?email=` — returns `{ id, email, name }` or 404. Used by the frontend "Existing User" tab to resolve a typed email to a user ID before submission. Added to `AdminUsersController` (already exists for the `/admin/users` list).

---

## Frontend

### Entry point

A **"New Tenant" button** (Plus icon) placed in the top-right of the left panel header on `dashboard/admin/tenants/page.tsx`, next to the search/filter row.

### Modal

Opens as an overlay dialog. Fields:

**Owner section** — two-tab toggle: "New User" / "Existing User"

| Tab | Fields |
|-----|--------|
| New User | Email (required), Name (optional) |
| Existing User | Email field → on blur, calls `GET /admin/users/lookup?email=` → shows resolved name or "User not found" |

**Tenant & Store section**

| Field | Required |
|-------|----------|
| Tenant Name | Yes |
| Store Name | Yes |
| Address | No |
| Business Type | No (dropdown: blank, GROCERY, PHARMACY, SURGICAL_MEDICAL, COMPUTER_HARDWARE) |

**Plan section**

Dropdown: FREE / BASIC / STANDARD / PREMIUM (defaults to FREE)

**Footer:** Cancel + Create (spinner while in-flight)

### Behaviour

- **On success:** modal closes → toast "{name} created" → tenant list reloads → new tenant auto-selected in detail panel
- **On error:** error message shown inside modal; modal stays open for retry
- **Existing user not found:** inline error shown below the email field in the "Existing User" tab; form blocks submission

### API client additions (`lib/api.ts`)

```ts
createAdminTenant: (data: CreateAdminTenantPayload) =>
  fetchWithAuth('/admin/tenants', { method: 'POST', body: JSON.stringify(data) })

lookupAdminUser: (email: string) =>
  fetchWithAuth(`/admin/users/lookup?email=${encodeURIComponent(email)}`)
```

### i18n

New keys under `tenants.createModal` added to `en/admin.ts`, `bn/admin.ts`, and `ms/admin.ts`:

```
createModal.trigger         — "New Tenant"
createModal.title           — "Create New Tenant"
createModal.ownerSection    — "Owner"
createModal.tabNewUser      — "New User"
createModal.tabExistingUser — "Existing User"
createModal.ownerEmail      — "Owner Email"
createModal.ownerName       — "Owner Name (optional)"
createModal.lookupEmail     — "Search by email"
createModal.userNotFound    — "No user found with this email"
createModal.tenantName      — "Tenant Name"
createModal.storeName       — "Store Name"
createModal.address         — "Address (optional)"
createModal.businessType    — "Business Type (optional)"
createModal.plan            — "Subscription Plan"
createModal.cancel          — "Cancel"
createModal.create          — "Create Tenant"
createModal.creating        — "Creating..."
createModal.successToast    — "{name} created successfully"
createModal.emailTaken      — "This email is already registered"
```

---

## Files changed

| File | Change |
|------|--------|
| `apps/backend/src/admin-tenants/admin-tenants.dto.ts` | Add `CreateAdminTenantDto` |
| `apps/backend/src/admin-tenants/admin-tenants.controller.ts` | Add `POST /` handler |
| `apps/backend/src/admin-tenants/admin-users.controller.ts` | Add `GET /lookup` handler (`GET /admin/users/lookup?email=`) |
| `apps/backend/src/admin-tenants/admin-tenants.service.ts` | Add `createTenant()` method |
| `apps/frontend/src/lib/api.ts` | Add `createAdminTenant`, `lookupAdminUser` |
| `apps/frontend/src/lib/localization/messages/en/admin.ts` | Add `createModal` keys |
| `apps/frontend/src/lib/localization/messages/bn/admin.ts` | Add `createModal` keys (Bengali) |
| `apps/frontend/src/lib/localization/messages/ms/admin.ts` | Add `createModal` keys (Malay) |
| `apps/frontend/src/app/dashboard/admin/tenants/page.tsx` | Add button + modal component |

---

## Out of scope

- Email verification for the auto-created user (owner can trigger via settings after first login)
- Sending a set-password link (welcome email is sufficient; owner uses forgot-password flow if needed)
- Assigning a store to an existing user who already has another tenant
