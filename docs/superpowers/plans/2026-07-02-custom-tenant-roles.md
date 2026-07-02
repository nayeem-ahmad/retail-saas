# Custom Tenant Roles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let tenant OWNER users create/edit role templates from existing `StorePermission` values, assign them to members, and auto-sync member branch permissions on every role-template or assignment change — while keeping OWNER unrestricted.

**Architecture:** Add `TenantRole` + `TenantRolePermission` tables. Non-owner `TenantUser` rows reference `tenant_role_id`. A shared `syncMemberPermissionsFromRole()` helper rewrites `UserStorePermission` rows. Role CRUD lives in `TeamService` (or extracted `TenantRolesService` in the same module). Hardcoded `MANAGER`/`ACCOUNTANT` gates migrate to permission checks via `/auth/me` exposing effective store permissions.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest, Next.js 15, Tailwind CSS, `@erp71/shared-types`

## Global Constraints

- OWNER bypass in `StorePermissionGuard` and `TeamService.assertPermission` must remain unchanged.
- Only existing `StorePermission` enum values — no new permissions in v1.
- Role-template edits auto-sync (option A) — overwrite all assigned members' per-branch permissions immediately.
- Role CRUD is OWNER-only; member management remains `MANAGE_USERS` permission (non-owner managers).
- All business queries tenant-scoped via `TenantInterceptor`.
- Update `TODO.md` when implementation is complete.
- Work on `dev` branch.

---

## File Map

| File | Change |
|------|--------|
| `packages/database/prisma/schema.prisma` | Add `TenantRole`, `TenantRolePermission`; modify `TenantUser`, `UserInvitation` |
| `packages/database/prisma/migrations/...` | Generated migration + backfill SQL |
| `packages/shared-types/index.ts` | Extend `TenantContextSummary`; add `TenantRoleSummary` type |
| `apps/backend/src/team/role-sync.util.ts` | **Create** — `syncMemberPermissionsFromRole()` |
| `apps/backend/src/team/role-sync.util.spec.ts` | **Create** — unit tests |
| `apps/backend/src/team/tenant-role.seed.ts` | **Create** — `seedDefaultTenantRoles(tx, tenantId)` |
| `apps/backend/src/team/team.dto.ts` | Replace enum DTOs with `tenantRoleId`; add role CRUD DTOs |
| `apps/backend/src/team/team.service.ts` | Role CRUD, updated member/invite flows, sync calls |
| `apps/backend/src/team/team.controller.ts` | Add `/team/roles` endpoints |
| `apps/backend/src/team/team.service.spec.ts` | Role CRUD + sync tests |
| `apps/backend/src/team/team.module.ts` | No change expected |
| `apps/backend/src/invitations/invitations.service.ts` | Use `tenant_role_id` |
| `apps/backend/src/invitations/invitations.controller.ts` | DTO uses `tenantRoleId` |
| `apps/backend/src/invitations/invitations.service.spec.ts` | Update tests |
| `apps/backend/src/auth/auth.service.ts` | Seed roles on signup; extend `getMe` with permissions |
| `apps/backend/src/auth/auth.service.spec.ts` | Update `getMe` tests |
| `apps/backend/src/admin-tenants/admin-tenants.service.ts` | Seed roles on admin tenant create |
| `apps/backend/src/audit/audit.controller.ts` | Permission-based gate |
| `apps/backend/src/billing/billing.service.ts` | Permission-based gate |
| `apps/backend/src/sms/sms-credit.service.ts` | Permission-based gate |
| `apps/backend/src/accounting/accounting.controller.ts` | Replace `@TenantRoles` with permissions |
| `apps/backend/src/sales-reports/sales-reports.controller.ts` | Replace `@TenantRoles` with permissions |
| `apps/frontend/src/lib/api.ts` | Role CRUD methods; update member/invite payloads |
| `apps/frontend/src/app/(app)/team/page.tsx` | Roles tab + updated member flows |
| `apps/frontend/src/app/(app)/layout.tsx` | Permission-based nav gates |
| `apps/frontend/src/lib/accounting-report-scope.ts` | Permission-based consolidated access |
| `apps/frontend/src/lib/localization/messages/en/core.ts` | Role management strings |
| `apps/frontend/src/lib/localization/messages/bn/core.ts` | Bengali strings |
| `packages/database/prisma/seed.ts` | Use `seedDefaultTenantRoles` |
| `TODO.md` | Mark complete when done |

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/<timestamp>_add_tenant_roles/migration.sql`

**Interfaces:**
- Produces: `TenantRole`, `TenantRolePermission` models; `TenantUser.tenant_role_id`; `UserInvitation.tenant_role_id`

- [ ] **Step 1: Add models to schema**

Add to `schema.prisma` after `TenantUser`:

```prisma
model TenantRole {
  id          String   @id @default(uuid())
  tenant_id   String
  name        String
  description String?
  is_system   Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  tenant       Tenant                 @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  permissions  TenantRolePermission[]
  members      TenantUser[]
  invitations  UserInvitation[]

  @@unique([tenant_id, name])
  @@index([tenant_id])
}

model TenantRolePermission {
  id             String          @id @default(uuid())
  tenant_role_id String
  permission     StorePermission

  tenantRole TenantRole @relation(fields: [tenant_role_id], references: [id], onDelete: Cascade)

  @@unique([tenant_role_id, permission])
}
```

Update `TenantUser`:

```prisma
model TenantUser {
  id             String    @id @default(uuid())
  tenant_id      String
  user_id        String
  role           UserRole  @default(CASHIER)
  tenant_role_id String?

  tenant     Tenant      @relation(...)
  user       User        @relation(...)
  tenantRole TenantRole? @relation(fields: [tenant_role_id], references: [id], onDelete: SetNull)

  @@unique([tenant_id, user_id])
}
```

Update `UserInvitation` — add `tenant_role_id String`, relation to `TenantRole`, keep `role` column temporarily for migration backfill then drop in same migration.

Add `tenantRoles TenantRole[]` relation on `Tenant` model.

- [ ] **Step 2: Generate migration**

```bash
cd packages/database && npm run db:migrate -- --name add_tenant_roles
```

- [ ] **Step 3: Add backfill SQL to migration**

After the DDL, append SQL that for each tenant:
1. Inserts Manager/Cashier/Accountant roles with permissions from seed constants
2. Sets `tenant_role_id` on non-OWNER `TenantUser` rows
3. Sets `tenant_role_id` on `UserInvitation` rows
4. Drops `UserInvitation.role` column

Use a PL/pgSQL block or CTEs keyed on role name. Map:
- `MANAGER` → role named `Manager`
- `CASHIER` → `Cashier`
- `ACCOUNTANT` → `Accountant`

- [ ] **Step 4: Run migration**

```bash
cd packages/database && npm run db:migrate
```

Expected: migration applies cleanly; `npx prisma generate` runs via post-migrate hook.

- [ ] **Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/
git commit -m "feat(db): add TenantRole tables and backfill migration"
```

---

### Task 2: Seed helper + shared types

**Files:**
- Create: `apps/backend/src/team/tenant-role.seed.ts`
- Modify: `packages/shared-types/index.ts`

**Interfaces:**
- Produces: `seedDefaultTenantRoles(tx, tenantId): Promise<Record<'manager'|'cashier'|'accountant', string>>`
- Produces: `TenantRoleSummary` type

- [ ] **Step 1: Create seed helper**

```ts
// apps/backend/src/team/tenant-role.seed.ts
import { ROLE_DEFAULT_PERMISSIONS, UserRole } from '@erp71/shared-types';

const SYSTEM_ROLES: { key: 'manager' | 'cashier' | 'accountant'; name: string; role: UserRole }[] = [
  { key: 'manager', name: 'Manager', role: UserRole.MANAGER },
  { key: 'cashier', name: 'Cashier', role: UserRole.CASHIER },
  { key: 'accountant', name: 'Accountant', role: UserRole.ACCOUNTANT },
];

export async function seedDefaultTenantRoles(tx: any, tenantId: string) {
  const ids: Record<string, string> = {};
  for (const entry of SYSTEM_ROLES) {
    const role = await tx.tenantRole.create({
      data: { tenant_id: tenantId, name: entry.name, is_system: true },
    });
    const perms = ROLE_DEFAULT_PERMISSIONS[entry.role] ?? [];
    if (perms.length > 0) {
      await tx.tenantRolePermission.createMany({
        data: perms.map((permission) => ({ tenant_role_id: role.id, permission })),
        skipDuplicates: true,
      });
    }
    ids[entry.key] = role.id;
  }
  return ids;
}
```

- [ ] **Step 2: Add shared types**

In `packages/shared-types/index.ts`:

```ts
export interface TenantRoleSummary {
  id: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  permissions: StorePermission[];
  member_count?: number;
}

export interface TenantContextSummary {
  // existing fields...
  role: UserRole | null;  // 'OWNER' or null for tenant-role members
  tenant_role?: { id: string; name: string } | null;
  permissions?: StorePermission[];  // effective permissions for active store
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/team/tenant-role.seed.ts packages/shared-types/index.ts
git commit -m "feat: add tenant role seed helper and shared types"
```

---

### Task 3: Role sync utility (TDD)

**Files:**
- Create: `apps/backend/src/team/role-sync.util.ts`
- Create: `apps/backend/src/team/role-sync.util.spec.ts`

**Interfaces:**
- Produces: `syncMemberPermissionsFromRole(tx, { tenantId, userIds, tenantRoleId, grantedBy }): Promise<number>`

- [ ] **Step 1: Write failing tests**

```ts
// role-sync.util.spec.ts
import { syncMemberPermissionsFromRole } from './role-sync.util';
import { StorePermission } from '@erp71/shared-types';

describe('syncMemberPermissionsFromRole', () => {
  it('rewrites UserStorePermission for each user×store access', async () => {
    const tx = {
      tenantRolePermission: {
        findMany: jest.fn().mockResolvedValue([
          { permission: StorePermission.CREATE_SALE },
          { permission: StorePermission.VIEW_LEDGER },
        ]),
      },
      userStoreAccess: {
        findMany: jest.fn().mockResolvedValue([
          { user_id: 'u1', store_id: 's1' },
          { user_id: 'u1', store_id: 's2' },
        ]),
      },
      userStorePermission: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        createMany: jest.fn().mockResolvedValue({ count: 4 }),
      },
    };

    const count = await syncMemberPermissionsFromRole(tx, {
      tenantId: 't1',
      userIds: ['u1'],
      tenantRoleId: 'role-1',
      grantedBy: 'owner',
    });

    expect(count).toBe(1);
    expect(tx.userStorePermission.deleteMany).toHaveBeenCalledWith({
      where: { tenant_id: 't1', user_id: { in: ['u1'] } },
    });
    expect(tx.userStorePermission.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ user_id: 'u1', store_id: 's1', permission: StorePermission.CREATE_SALE }),
      ]),
      skipDuplicates: true,
    });
  });

  it('returns 0 when userIds is empty', async () => {
    const count = await syncMemberPermissionsFromRole({} as any, {
      tenantId: 't1', userIds: [], tenantRoleId: 'r1', grantedBy: 'o',
    });
    expect(count).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/backend && npx jest src/team/role-sync.util.spec.ts -v
```

- [ ] **Step 3: Implement**

```ts
// role-sync.util.ts
import { StorePermission } from '@erp71/shared-types';

type SyncParams = {
  tenantId: string;
  userIds: string[];
  tenantRoleId: string;
  grantedBy: string;
};

export async function syncMemberPermissionsFromRole(tx: any, params: SyncParams): Promise<number> {
  const { tenantId, userIds, tenantRoleId, grantedBy } = params;
  if (userIds.length === 0) return 0;

  const permRows = await tx.tenantRolePermission.findMany({
    where: { tenant_role_id: tenantRoleId },
    select: { permission: true },
  });
  const permissions: StorePermission[] = permRows.map((r: any) => r.permission);

  const accessRows = await tx.userStoreAccess.findMany({
    where: { tenant_id: tenantId, user_id: { in: userIds } },
    select: { user_id: true, store_id: true },
  });

  await tx.userStorePermission.deleteMany({
    where: { tenant_id: tenantId, user_id: { in: userIds } },
  });

  if (permissions.length > 0 && accessRows.length > 0) {
    await tx.userStorePermission.createMany({
      data: accessRows.flatMap((a: any) =>
        permissions.map((permission) => ({
          user_id: a.user_id,
          store_id: a.store_id,
          tenant_id: tenantId,
          permission,
          granted_by: grantedBy,
        })),
      ),
      skipDuplicates: true,
    });
  }

  return userIds.length;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/backend && npx jest src/team/role-sync.util.spec.ts -v
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/team/role-sync.util.ts apps/backend/src/team/role-sync.util.spec.ts
git commit -m "feat(team): add role permission sync utility"
```

---

### Task 4: Role CRUD in TeamService (TDD)

**Files:**
- Modify: `apps/backend/src/team/team.dto.ts`
- Modify: `apps/backend/src/team/team.service.ts`
- Modify: `apps/backend/src/team/team.controller.ts`
- Modify: `apps/backend/src/team/team.service.spec.ts`

**Interfaces:**
- Consumes: `syncMemberPermissionsFromRole`, `seedDefaultTenantRoles`
- Produces: `listRoles`, `createRole`, `updateRole`, `deleteRole` methods

- [ ] **Step 1: Update DTOs**

Replace `InviteMemberDto.role` and `UpdateRoleDto.role` with `tenantRoleId: string`.

Add:

```ts
export class CreateTenantRoleDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @IsIn(STORE_PERMISSION_VALUES, { each: true })
  permissions: StorePermission[];
}

export class UpdateTenantRoleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsIn(STORE_PERMISSION_VALUES, { each: true })
  permissions?: StorePermission[];
}
```

- [ ] **Step 2: Write failing role CRUD tests**

In `team.service.spec.ts`, add tests:
- `listRoles` returns roles with permission + member counts (OWNER only)
- `createRole` rejects duplicate name and "Owner" name
- `updateRole` triggers sync for all members with that role
- `deleteRole` blocks when member_count > 0
- non-OWNER gets ForbiddenException on role CRUD

- [ ] **Step 3: Implement `assertOwner` helper and role CRUD methods**

```ts
private assertOwner(ctx: TenantContext): void {
  if (ctx.userRole !== UserRole.OWNER) {
    throw new ForbiddenException('Only the organization owner can manage roles.');
  }
}

async listRoles(ctx: TenantContext) { /* ... */ }
async createRole(ctx: TenantContext, dto: CreateTenantRoleDto) { /* ... */ }
async updateRoleTemplate(ctx: TenantContext, roleId: string, dto: UpdateTenantRoleDto) {
  // transaction: update role + permissions + syncMemberPermissionsFromRole for all members
}
async deleteRole(ctx: TenantContext, roleId: string) { /* ... */ }
```

- [ ] **Step 4: Add controller routes**

```ts
@Get('roles') listRoles(...)
@Post('roles') createRole(...)
@Patch('roles/:id') updateRoleTemplate(...)
@Delete('roles/:id') deleteRole(...)
```

- [ ] **Step 5: Run tests**

```bash
cd apps/backend && npx jest src/team/team.service.spec.ts -v
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/team/
git commit -m "feat(team): add tenant role CRUD with auto-sync"
```

---

### Task 5: Update member + invite flows

**Files:**
- Modify: `apps/backend/src/team/team.service.ts`
- Modify: `apps/backend/src/invitations/invitations.service.ts`
- Modify: `apps/backend/src/invitations/invitations.controller.ts`
- Modify: `apps/backend/src/team/team.service.spec.ts`
- Modify: `apps/backend/src/invitations/invitations.service.spec.ts`

**Interfaces:**
- Consumes: `syncMemberPermissionsFromRole`
- Produces: updated `updateRole(member)`, `invite`, `grantStoreAccess` using `tenantRoleId`

- [ ] **Step 1: Update `team.service.updateRole` (member assignment)**

- Accept `tenantRoleId` instead of `UserRole` enum
- Set `tenant_role_id` on `TenantUser` (keep `role` as non-OWNER default, e.g. `CASHIER` — or add migration to make role nullable for non-owners; simplest: set `role = CASHIER` as legacy placeholder)
- Always call `syncMemberPermissionsFromRole` for that user
- Remove `reseedPermissions` parameter

- [ ] **Step 2: Update `grantStoreAccess` seeding**

Replace `ROLE_DEFAULT_PERMISSIONS[membership.role]` with permissions from `membership.tenantRole.permissions`. For OWNER members, skip (no store permission rows needed for bypass).

- [ ] **Step 3: Update list/get member responses**

Return:
```ts
{
  isOwner: membership.role === UserRole.OWNER,
  roleName: membership.role === UserRole.OWNER ? 'Owner' : membership.tenantRole.name,
  tenantRoleId: membership.tenant_role_id,
}
```

- [ ] **Step 4: Update invitations service**

- `invite(..., tenantRoleId)` — validate role belongs to tenant
- On accept: set `tenant_role_id`, seed permissions from role template
- Update `INVITABLE_ROLES` check → validate `tenantRoleId` is not OWNER (no Owner role exists)

- [ ] **Step 5: Update and run tests**

```bash
cd apps/backend && npx jest src/team/team.service.spec.ts src/invitations/invitations.service.spec.ts -v
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/team/ apps/backend/src/invitations/
git commit -m "feat(team): wire member flows to tenant roles"
```

---

### Task 6: Provisioning + auth/me permissions

**Files:**
- Modify: `apps/backend/src/auth/auth.service.ts`
- Modify: `apps/backend/src/admin-tenants/admin-tenants.service.ts`
- Modify: `packages/database/prisma/seed.ts`
- Modify: `apps/backend/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Call `seedDefaultTenantRoles` in signup transaction**

In `auth.service.ts` `provisionTenant`, after creating tenant, call `seedDefaultTenantRoles(tx, tenant.id)`.

- [ ] **Step 2: Same in `admin-tenants.service.ts` create flow**

- [ ] **Step 3: Extend `getMe` / `mapTenantMembership`**

Include tenant role info and effective permissions. Add helper:

```ts
private async resolveStorePermissions(userId: string, tenantId: string, storeId: string | null, role: string) {
  if (role === 'OWNER') return Object.values(StorePermission);
  if (!storeId) return [];
  const grants = await this.db.userStorePermission.findMany({
    where: { user_id: userId, store_id: storeId, tenant_id: tenantId },
    select: { permission: true },
  });
  return grants.map((g) => g.permission);
}
```

Pass `storeId` from request is not available in getMe — return permissions **per store** or all union across accessible stores. Simplest v1: return union of all permissions across user's accessible stores in that tenant (frontend caches; refine later if needed).

- [ ] **Step 4: Update seed.ts to use `seedDefaultTenantRoles` and set `tenant_role_id` on demo users**

- [ ] **Step 5: Run auth tests**

```bash
cd apps/backend && npx jest src/auth/auth.service.spec.ts -v
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/auth/ apps/backend/src/admin-tenants/ packages/database/prisma/seed.ts
git commit -m "feat(auth): seed tenant roles and expose permissions in getMe"
```

---

### Task 7: Migrate backend role gates

**Files:**
- Modify: `apps/backend/src/audit/audit.controller.ts`
- Modify: `apps/backend/src/billing/billing.service.ts`
- Modify: `apps/backend/src/sms/sms-credit.service.ts`
- Modify: `apps/backend/src/accounting/accounting.controller.ts`
- Modify: `apps/backend/src/sales-reports/sales-reports.controller.ts`

- [ ] **Step 1: Add shared helper `hasStorePermission(ctx, permission)`**

Either in `team.service.ts` or new `apps/backend/src/auth/permission.util.ts`:

```ts
export async function hasStorePermission(db, ctx: TenantContext, permission: StorePermission): Promise<boolean> {
  if (ctx.userRole === 'OWNER') return true;
  if (!ctx.storeId) return false;
  const grant = await db.userStorePermission.findFirst({
    where: { user_id: ctx.userId, store_id: ctx.storeId, permission },
    select: { id: true },
  });
  return Boolean(grant);
}
```

- [ ] **Step 2: Replace role checks**

| File | Change |
|------|--------|
| `audit.controller.ts` | `OWNER` or `hasStorePermission(MANAGE_USERS)` |
| `billing.service.ts` | replace `isOwnerOrManager` with `OWNER` or `MANAGE_USERS` |
| `sms-credit.service.ts` | same |
| `accounting.controller.ts` | replace class-level `@TenantRoles` with `@RequireStorePermissions(VIEW_LEDGER)`; keep `@TenantRoles('OWNER')` on unlock-only endpoints |
| `sales-reports.controller.ts` | `@RequireStorePermissions(VIEW_CONSOLIDATED_REPORTS)` |

- [ ] **Step 3: Run affected tests**

```bash
cd apps/backend && npx jest src/accounting/accounting.controller.spec.ts src/billing/billing.service.spec.ts src/sms/sms-credit.service.spec.ts -v
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/audit/ apps/backend/src/billing/ apps/backend/src/sms/ apps/backend/src/accounting/ apps/backend/src/sales-reports/
git commit -m "refactor: replace role-name gates with permission checks"
```

---

### Task 8: Frontend API client

**Files:**
- Modify: `apps/frontend/src/lib/api.ts`

- [ ] **Step 1: Add role endpoints**

```ts
getTeamRoles: () => fetchWithAuth('/team/roles'),
createTeamRole: (data: { name: string; description?: string; permissions: string[] }) =>
  fetchWithAuth('/team/roles', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
updateTeamRole: (id: string, data: { name?: string; description?: string; permissions?: string[] }) =>
  fetchWithAuth(`/team/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
deleteTeamRole: (id: string) => fetchWithAuth(`/team/roles/${id}`, { method: 'DELETE' }),
```

- [ ] **Step 2: Update member/invite methods**

```ts
sendTeamInvitation: (data: { email: string; tenantRoleId: string }) => ...
updateMemberRole: (userId: string, data: { tenantRoleId: string }) => ...
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/lib/api.ts
git commit -m "feat(frontend): add tenant role API methods"
```

---

### Task 9: Frontend /team UI — Roles tab

**Files:**
- Modify: `apps/frontend/src/app/(app)/team/page.tsx`
- Modify: `apps/frontend/src/lib/localization/messages/en/core.ts`
- Modify: `apps/frontend/src/lib/localization/messages/bn/core.ts`

- [ ] **Step 1: Add localization keys**

Under `teamManagement.roles`:
- `title`, `createRole`, `editRole`, `deleteRole`, `permissionCount`, `memberCount`, `syncWarning`, `cannotDeleteInUse`, `nameLabel`, `saveRole`, `roleCreated`, `roleUpdated`, `roleDeleted`

- [ ] **Step 2: Add tab state (`members` | `roles`)**

Show Roles tab only when `activeTenant.role === 'OWNER'` (from session).

- [ ] **Step 3: Implement `RolesPanel` component**

- Fetch `api.getTeamRoles()` on mount
- List roles with edit/delete actions
- Create/edit modal with `STORE_PERMISSION_GROUPS` matrix (reuse pattern from `MemberPanel`)
- On save of edit: confirm dialog with `syncWarning` showing member count
- Delete disabled when `member_count > 0`

- [ ] **Step 4: Update `MemberPanel`**

- Replace `ROLES` enum dropdown with roles from `getTeamRoles()`
- Use `tenantRoleId` in invite and role update calls
- Remove reseed checkbox
- Show "Owner" badge for `isOwner` members

- [ ] **Step 5: Manual smoke test**

```bash
cd apps/frontend && npm run dev
```

Verify: Roles tab visible for owner; create role; edit syncs; member assignment uses new roles.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/(app)/team/page.tsx apps/frontend/src/lib/localization/
git commit -m "feat(frontend): add Roles tab and update team member flows"
```

---

### Task 10: Frontend permission-based nav gates

**Files:**
- Modify: `apps/frontend/src/app/(app)/layout.tsx`
- Modify: `apps/frontend/src/lib/accounting-report-scope.ts`

- [ ] **Step 1: Add permission helper**

```ts
// apps/frontend/src/lib/permissions.ts
export function hasPermission(permissions: string[] | undefined, perm: string): boolean {
  return Boolean(permissions?.includes(perm));
}

export function isOwner(role: string | null | undefined): boolean {
  return role === 'OWNER';
}
```

- [ ] **Step 2: Update layout.tsx**

```ts
const perms = activeTenant?.permissions ?? [];
const owner = isOwner(primaryRole);
const canManageTeam = owner || hasPermission(perms, 'MANAGE_USERS');
const canManageBilling = owner || hasPermission(perms, 'MANAGE_USERS');
const canAccessAccounting =
  (owner || hasPermission(perms, 'VIEW_LEDGER')) && hasPaidPlan && hasAccountingEntitlement;
```

- [ ] **Step 3: Update accounting-report-scope.ts**

```ts
export function canViewConsolidatedReports(role: string | null, permissions?: string[]) {
  return role === 'OWNER' || permissions?.includes('VIEW_CONSOLIDATED_REPORTS');
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/(app)/layout.tsx apps/frontend/src/lib/
git commit -m "refactor(frontend): permission-based nav gates"
```

---

### Task 11: Final verification + TODO

**Files:**
- Modify: `TODO.md`

- [ ] **Step 1: Run backend test suite**

```bash
cd apps/backend && npm test
```

- [ ] **Step 2: Run frontend typecheck**

```bash
cd apps/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Update TODO.md**

Add to COMPLETED:
`- [x] Custom tenant roles — OWNER can CRUD role templates from StorePermission enum; auto-sync member permissions on edit/assignment; permission-based nav gates — done 2026-07-02`

- [ ] **Step 4: Commit**

```bash
git add TODO.md
git commit -m "docs: mark custom tenant roles complete"
```

---

## Plan Self-Review

**Spec coverage:**
- [x] TenantRole tables + migration backfill → Task 1
- [x] OWNER unchanged → Tasks 4–7 explicit checks
- [x] Auto-sync on template edit → Tasks 3, 4
- [x] Auto-sync on member assignment → Task 5
- [x] Role CRUD API OWNER-only → Task 4
- [x] Updated invite/member flows → Task 5
- [x] `/auth/me` permissions → Task 6
- [x] Permission gate migration → Task 7, 10
- [x] UI Roles tab + Members update → Task 9
- [x] Localization → Task 9
- [x] Tests → Tasks 3–7, 11

**Placeholder scan:** No TBD/TODO entries.

**Type consistency:** `tenantRoleId` used consistently across DTOs, API client, and UI. `syncMemberPermissionsFromRole` signature stable across Tasks 3–5.