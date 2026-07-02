# Custom Tenant Roles

**Date:** 2026-07-02  
**Status:** Approved

## Summary

Let tenant **OWNER** users create and edit role templates scoped to their organization. Each role is a named set of existing `StorePermission` values. Non-owner members are assigned a `TenantRole` instead of a fixed enum (`MANAGER`, `CASHIER`, `ACCOUNTANT`). **OWNER** remains a special system role with unrestricted access — unchanged.

When an owner edits a role template, permissions **auto-sync immediately** to every member assigned that role, across all branches they have access to.

---

## Goals

1. OWNER can CRUD tenant roles and toggle permissions from the existing `StorePermission` enum.
2. OWNER bypass of all permission checks is unchanged.
3. Editing a role template immediately updates all assigned members' `UserStorePermission` rows.
4. Assigning a different role to a member always syncs their branch permissions (no optional "reseed" checkbox).
5. Migrate hardcoded `MANAGER` / `ACCOUNTANT` role gates to permission-based checks.

## Non-Goals (v1)

- Creating new permission types beyond the existing `StorePermission` enum.
- Per-user permission overrides that survive role-template edits (auto-sync overwrites them).
- Assigning OWNER via the role picker (inviting another owner stays blocked).
- Custom roles for platform-admin context.

---

## Data Model

### New tables

```prisma
model TenantRole {
  id          String   @id @default(uuid())
  tenant_id   String
  name        String
  description String?
  is_system   Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  tenant      Tenant   @relation(...)
  permissions TenantRolePermission[]
  members     TenantUser[]
  invitations UserInvitation[]

  @@unique([tenant_id, name])
  @@index([tenant_id])
}

model TenantRolePermission {
  id             String          @id @default(uuid())
  tenant_role_id String
  permission     StorePermission

  tenantRole     TenantRole      @relation(...)

  @@unique([tenant_role_id, permission])
}
```

### Modified tables

```prisma
model TenantUser {
  role           UserRole   // OWNER only — unchanged field
  tenant_role_id String?    // FK → TenantRole; required when role ≠ OWNER
  tenantRole     TenantRole? @relation(...)
}

model UserInvitation {
  tenant_role_id String     // replaces role enum
  tenantRole     TenantRole   @relation(...)
}
```

### OWNER special case

- `TenantUser.role = OWNER`, `tenant_role_id = null`
- Never represented as a `TenantRole` record
- `StorePermissionGuard` and `TeamService.assertPermission` OWNER bypass unchanged

### Seeding

**New tenant provisioning** (`auth.service`, `admin-tenants.service`):
- Create 3 system roles from `ROLE_DEFAULT_PERMISSIONS`: Manager, Cashier, Accountant (`is_system: true`)
- Do not create an Owner role template

**Backfill migration** for existing tenants:
1. Create 3 system roles per tenant with current default permissions
2. Map `TenantUser`: `MANAGER` → Manager role id, `CASHIER` → Cashier, `ACCOUNTANT` → Accountant; `OWNER` → `tenant_role_id = null`
3. Update `UserInvitation` rows to reference `tenant_role_id`

`ROLE_DEFAULT_PERMISSIONS` in shared-types becomes **seed-only** after migration — not used at runtime.

---

## Auto-Sync Behavior

### On role template save (`PATCH /team/roles/:id`)

```
1. Replace TenantRolePermission rows for that role
2. Find all TenantUser where tenant_role_id = roleId
3. For each member × each UserStoreAccess branch:
     DELETE UserStorePermission (user_id, store_id)
     INSERT permissions from updated role template
4. Audit: team.role_template_updated, team.role_permissions_synced
```

### On member role assignment (`PATCH /team/members/:userId/role`)

- Set `tenant_role_id`
- Sync that user's permissions across all accessible branches (same algorithm, single user)
- Remove `reseedPermissions` option — always syncs

### Per-member permission tweaks

The existing per-branch permission matrix on `/team` remains. Owners can still customize individual members. Those customizations are **overwritten** on the next role-template edit or role reassignment.

---

## API

All role-management endpoints are **OWNER-only** (existing `TeamService.assertPermission` OWNER bypass + explicit OWNER check on role CRUD).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/team/roles` | List roles with permissions + member count |
| `POST` | `/team/roles` | Create `{ name, description?, permissions[] }` |
| `PATCH` | `/team/roles/:id` | Update name/description/permissions → auto-sync |
| `DELETE` | `/team/roles/:id` | Delete if member count = 0 |

### Validation rules

- Name unique per tenant (case-insensitive)
- At least 1 permission required
- Permissions must be valid `StorePermission` values
- Cannot create/rename a role to "Owner" (case-insensitive)
- System roles (`is_system: true`) can be edited and renamed; cannot delete while members are assigned
- Cannot delete any role with `memberCount > 0`

### Updated member endpoints

| Change | Detail |
|--------|--------|
| `POST /team/invitations` | Accept `tenantRoleId` instead of `role` enum |
| `PATCH /team/members/:userId/role` | Accept `tenantRoleId`; always sync permissions |
| `GET /team/members` | Return `{ isOwner, roleName, tenantRoleId }` |
| `GET /team/members/:userId` | Same shape |

### `/auth/me` response extension

```ts
tenants: [{
  role: 'OWNER' | null,
  tenant_role: { id: string; name: string } | null,
  permissions: StorePermission[]  // active-store effective permissions; all for OWNER
}]
```

Frontend uses `permissions` for nav gating instead of role name checks.

---

## Permission Gate Migration

Replace hardcoded role-name checks with permission checks (OWNER still bypasses):

| Location | Current | New |
|----------|---------|-----|
| Team page | `OWNER \|\| MANAGER` | `OWNER \|\| MANAGE_USERS` |
| Billing | `OWNER \|\| MANAGER` | `OWNER \|\| MANAGE_USERS` |
| SMS credits | `OWNER \|\| MANAGER` | `OWNER \|\| MANAGE_USERS` |
| Audit logs | `OWNER \|\| MANAGER` | `OWNER \|\| MANAGE_USERS` |
| Accounting module | `OWNER \|\| MANAGER \|\| ACCOUNTANT` | `OWNER \|\| VIEW_LEDGER` + plan entitlement |
| Consolidated reports | `OWNER \|\| ACCOUNTANT` | `OWNER \|\| VIEW_CONSOLIDATED_REPORTS` |
| Fiscal period unlock | `OWNER` only | unchanged |
| `@TenantRoles(...)` decorators | role enum list | `@RequireStorePermissions(...)` where applicable |

Files affected:
- `apps/frontend/src/app/(app)/layout.tsx`
- `apps/frontend/src/lib/accounting-report-scope.ts`
- `apps/backend/src/audit/audit.controller.ts`
- `apps/backend/src/billing/billing.service.ts`
- `apps/backend/src/sms/sms-credit.service.ts`
- `apps/backend/src/accounting/accounting.controller.ts`
- `apps/backend/src/sales-reports/sales-reports.controller.ts`
- `apps/backend/src/invitations/invitations.service.ts`

---

## UI (`/team`)

Two tabs:

### Roles tab (OWNER only)

- List roles: name, permission count, member count
- Create / edit: name + permission matrix (`STORE_PERMISSION_GROUPS`)
- Delete (disabled when members assigned)
- Save warning: *"This will immediately update permissions for N members across all branches."*

### Members tab (updated)

- Role dropdown shows tenant roles (not enum)
- OWNER shown as fixed "Owner" badge — no role picker
- Per-branch permission matrix unchanged for non-owners
- Invite form uses tenant role picker

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Last owner demotion | Blocked (existing rule) |
| Delete role with members | 400 — reassign members first |
| Edit role with 0 members | Update template only |
| Member with no branch access | Role assignment updates `tenant_role_id`; permissions sync when branches granted |
| New `StorePermission` added platform-wide | Not auto-added to existing roles; owner opts in via editor |
| Manager with `MANAGE_USERS` | Can manage members (existing API rule); cannot CRUD role templates (OWNER only) |

---

## Testing

### Unit
- Role CRUD validation (duplicate name, empty permissions, "Owner" name blocked)
- Auto-sync transaction on role template update
- Auto-sync on member role change
- OWNER bypass unchanged
- Delete blocked when members assigned

### Integration
- Migration backfill maps existing enum roles correctly
- New tenant provisioning creates 3 system roles

### E2E
- Owner creates custom role → invites member → member has correct permissions
- Owner edits role → existing member permissions update immediately

---

## Audit Events

| Action | Entity |
|--------|--------|
| `team.role_created` | `TenantRole` |
| `team.role_updated` | `TenantRole` |
| `team.role_deleted` | `TenantRole` |
| `team.role_permissions_synced` | `TenantRole` |
| `team.role_updated` (member) | `TenantUser` |