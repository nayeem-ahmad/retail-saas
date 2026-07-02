# Master Data Bulk Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CSV/XLSX bulk import to all 11 master data tables, with a shared frontend dialog for file parsing, column mapping, skip/upsert mode, and per-row error reporting.

**Architecture:** Frontend parses the file (papaparse for CSV, xlsx for Excel), shows a multi-step mapping dialog, then POSTs already-mapped JSON rows to a per-module `POST /:entity/import` endpoint. A shared `runImport<T>` utility in `apps/backend/src/common/` handles the skip/upsert loop and error collection for all modules.

**Tech Stack:** NestJS (backend), Next.js 15 with Tailwind CSS (frontend), Prisma (ORM), papaparse (CSV), xlsx (already installed, XLSX), class-validator DTOs, Jest (tests).

## Global Constraints

- All backend controllers use `@UseGuards(JwtAuthGuard)` and `@UseInterceptors(TenantInterceptor)`.
- All service methods receive `tenantId: string` as first argument; never trust a client-supplied tenant ID.
- Frontend auth calls go through `fetchWithAuth` from `@/lib/api`.
- Import endpoints accept `{ rows: Record<string, unknown>[], mode: 'skip' | 'upsert' }` as JSON body (no file upload to backend).
- All text fields from imported rows are `.trim()`-ed; empty strings become `null` for nullable columns.
- On row error: push error message, continue processing remaining rows (never abort the whole batch).
- Row labels in error messages use 1-based row numbering offset by 1 for header: `Row ${i + 2}`.
- Branch: `dev` — all commits go to `dev`.

---

## File Map

**New files:**
- `apps/backend/src/common/import.util.ts` — shared `runImport<T>` + `ImportResult` + `ImportConfig<T>`
- `apps/backend/src/common/import.dto.ts` — `ImportRowsDto`
- `apps/backend/src/common/import.util.spec.ts` — unit tests for the utility
- `apps/frontend/src/components/import-dialog.tsx` — shared `<ImportDialog>` component

**Modified — Backend (service + controller per module):**
- `apps/backend/src/brands/brands.service.ts` + `brands.controller.ts` + `brands.service.spec.ts`
- `apps/backend/src/product-groups/product-groups.service.ts` + `product-groups.controller.ts`
- `apps/backend/src/product-subgroups/product-subgroups.service.ts` + `product-subgroups.controller.ts`
- `apps/backend/src/suppliers/suppliers.service.ts` + `suppliers.controller.ts`
- `apps/backend/src/customer-groups/customer-groups.service.ts` + `customer-groups.controller.ts`
- `apps/backend/src/customers/customers.service.ts` + `customers.controller.ts`
- `apps/backend/src/price-lists/price-lists.service.ts` + `price-lists.controller.ts`
- `apps/backend/src/payment-methods/payment-methods.service.ts` + `payment-methods.controller.ts`
- `apps/backend/src/territories/territories.service.ts` + `territories.controller.ts`
- `apps/backend/src/employees/employees.service.ts` + `employees.controller.ts`
- `apps/backend/src/inventory/inventory.service.ts` + `inventory.controller.ts`

**Modified — Frontend:**
- `apps/frontend/src/lib/api.ts` — 11 new `import*` methods
- `apps/frontend/src/app/(app)/inventory/brands/page.tsx`
- `apps/frontend/src/app/(app)/inventory/categories/page.tsx`
- `apps/frontend/src/app/(app)/purchases/suppliers/page.tsx`
- `apps/frontend/src/app/(app)/sales/customer-groups/page.tsx`
- `apps/frontend/src/app/(app)/sales/customers/page.tsx`
- `apps/frontend/src/app/(app)/sales/price-lists/page.tsx`
- `apps/frontend/src/app/(app)/settings/payment-methods/page.tsx`
- `apps/frontend/src/app/(app)/sales/territories/page.tsx`
- `apps/frontend/src/app/(app)/hr/employees/page.tsx`
- `apps/frontend/src/app/(app)/inventory/settings/page.tsx`

---

## Task 1: Shared Backend Import Utility + DTO

**Files:**
- Create: `apps/backend/src/common/import.util.ts`
- Create: `apps/backend/src/common/import.dto.ts`
- Create: `apps/backend/src/common/import.util.spec.ts`

**Interfaces:**
- Produces: `runImport<T>`, `ImportResult`, `ImportConfig<T>`, `ImportRowsDto` — consumed by all later tasks.

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/common/import.util.spec.ts`:

```ts
import { runImport, ImportConfig } from './import.util';

interface Row { name: string; description: string | null }

function makeConfig(overrides: Partial<ImportConfig<Row>> = {}): ImportConfig<Row> {
  return {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
    }),
    findDuplicate: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('runImport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates new records and returns created count', async () => {
    const config = makeConfig();
    const result = await runImport([{ name: 'A', description: 'Desc' }], 'skip', 'tenant-1', config);
    expect(result).toEqual({ created: 1, updated: 0, skipped: 0, errors: [] });
    expect(config.create).toHaveBeenCalledWith({ name: 'A', description: 'Desc' }, 'tenant-1');
  });

  it('skips duplicate when mode is skip', async () => {
    const config = makeConfig({ findDuplicate: jest.fn().mockResolvedValue('existing-id') });
    const result = await runImport([{ name: 'A' }], 'skip', 'tenant-1', config);
    expect(result).toEqual({ created: 0, updated: 0, skipped: 1, errors: [] });
    expect(config.create).not.toHaveBeenCalled();
    expect(config.update).not.toHaveBeenCalled();
  });

  it('updates duplicate when mode is upsert', async () => {
    const config = makeConfig({ findDuplicate: jest.fn().mockResolvedValue('existing-id') });
    const result = await runImport([{ name: 'A', description: 'New' }], 'upsert', 'tenant-1', config);
    expect(result).toEqual({ created: 0, updated: 1, skipped: 0, errors: [] });
    expect(config.update).toHaveBeenCalledWith('existing-id', { name: 'A', description: 'New' }, 'tenant-1');
    expect(config.create).not.toHaveBeenCalled();
  });

  it('collects error for missing required field and continues', async () => {
    const config = makeConfig({ findDuplicate: jest.fn().mockResolvedValue(null) });
    const result = await runImport(
      [{ description: 'no name' }, { name: 'B' }],
      'skip', 'tenant-1', config,
    );
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Row 2.*name/);
  });

  it('collects error on db failure and continues', async () => {
    const config = makeConfig({
      findDuplicate: jest.fn().mockResolvedValue(null),
      create: jest.fn()
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(undefined),
    });
    const result = await runImport([{ name: 'A' }, { name: 'B' }], 'skip', 'tenant-1', config);
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Row 2.*DB error/);
  });

  it('handles empty rows array', async () => {
    const config = makeConfig();
    const result = await runImport([], 'skip', 'tenant-1', config);
    expect(result).toEqual({ created: 0, updated: 0, skipped: 0, errors: [] });
  });

  it('trims whitespace from required field before checking empty', async () => {
    const config = makeConfig();
    const result = await runImport([{ name: '   ' }], 'skip', 'tenant-1', config);
    expect(result.errors).toHaveLength(1);
    expect(config.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx jest src/common/import.util.spec.ts --no-coverage
```

Expected: FAIL with "Cannot find module './import.util'"

- [ ] **Step 3: Create the utility**

Create `apps/backend/src/common/import.util.ts`:

```ts
export interface ImportConfig<T extends object> {
  requiredFields: string[];
  castRow: (raw: Record<string, unknown>) => T;
  findDuplicate: (row: T, tenantId: string) => Promise<string | null>;
  create: (row: T, tenantId: string) => Promise<void>;
  update: (id: string, row: T, tenantId: string) => Promise<void>;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function runImport<T extends object>(
  rawRows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
  tenantId: string,
  config: ImportConfig<T>,
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2;
    const raw = rawRows[i];

    const missing = config.requiredFields.filter(
      (f) => raw[f] === undefined || raw[f] === null || String(raw[f]).trim() === '',
    );
    if (missing.length) {
      result.errors.push(`Row ${rowNum}: missing required field(s): ${missing.join(', ')}`);
      continue;
    }

    try {
      const row = config.castRow(raw);
      const existingId = await config.findDuplicate(row, tenantId);

      if (existingId) {
        if (mode === 'skip') {
          result.skipped++;
        } else {
          await config.update(existingId, row, tenantId);
          result.updated++;
        }
      } else {
        await config.create(row, tenantId);
        result.created++;
      }
    } catch (err: any) {
      result.errors.push(`Row ${rowNum}: ${err?.message ?? 'unknown error'}`);
    }
  }

  return result;
}
```

- [ ] **Step 4: Create the DTO**

Create `apps/backend/src/common/import.dto.ts`:

```ts
import { IsArray, IsEnum } from 'class-validator';

export class ImportRowsDto {
  @IsArray()
  rows: Record<string, unknown>[];

  @IsEnum(['skip', 'upsert'])
  mode: 'skip' | 'upsert';
}
```

- [ ] **Step 5: Run tests and verify they pass**

```bash
cd apps/backend && npx jest src/common/import.util.spec.ts --no-coverage
```

Expected: PASS — 7 tests

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/common/import.util.ts apps/backend/src/common/import.dto.ts apps/backend/src/common/import.util.spec.ts
git commit -m "feat: shared runImport utility and ImportRowsDto for bulk import"
```

---

## Task 2: Brands Import Endpoint (Full Pattern Example)

**Files:**
- Modify: `apps/backend/src/brands/brands.service.ts`
- Modify: `apps/backend/src/brands/brands.controller.ts`
- Modify: `apps/backend/src/brands/brands.service.spec.ts`

**Interfaces:**
- Consumes: `runImport`, `ImportResult` from `../common/import.util`; `ImportRowsDto` from `../common/import.dto`
- Produces: `POST /brands/import` — `{ rows, mode }` → `ImportResult`

- [ ] **Step 1: Write the failing tests**

Add to the end of `apps/backend/src/brands/brands.service.spec.ts`:

```ts
// ─── importRows ─────────────────────────────────────────────────────────────

describe('importRows', () => {
  const tenantId = 'tenant-1';

  it('creates new brands', async () => {
    db.brand.findUnique.mockResolvedValue(null);
    db.brand.create.mockResolvedValue({});
    const result = await service.importRows(tenantId, [{ name: 'Nike', description: 'Sport' }], 'skip');
    expect(result).toEqual({ created: 1, updated: 0, skipped: 0, errors: [] });
    expect(db.brand.create).toHaveBeenCalledWith({
      data: { tenant_id: tenantId, name: 'Nike', description: 'Sport' },
    });
  });

  it('skips duplicate when mode is skip', async () => {
    db.brand.findUnique.mockResolvedValue({ id: 'brand-1' });
    const result = await service.importRows(tenantId, [{ name: 'Nike' }], 'skip');
    expect(result).toEqual({ created: 0, updated: 0, skipped: 1, errors: [] });
    expect(db.brand.create).not.toHaveBeenCalled();
  });

  it('updates duplicate when mode is upsert', async () => {
    db.brand.findUnique.mockResolvedValue({ id: 'brand-1' });
    db.brand.update.mockResolvedValue({});
    const result = await service.importRows(tenantId, [{ name: 'Nike', description: 'Updated' }], 'upsert');
    expect(result).toEqual({ created: 0, updated: 1, skipped: 0, errors: [] });
    expect(db.brand.update).toHaveBeenCalledWith({
      where: { id: 'brand-1' },
      data: { name: 'Nike', description: 'Updated' },
    });
  });

  it('errors on missing required name field', async () => {
    const result = await service.importRows(tenantId, [{ description: 'no name' }], 'skip');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Row 2.*name/);
    expect(db.brand.create).not.toHaveBeenCalled();
  });

  it('continues on row error and processes remaining rows', async () => {
    db.brand.findUnique.mockResolvedValue(null);
    db.brand.create.mockRejectedValueOnce(new Error('DB error')).mockResolvedValueOnce({});
    const result = await service.importRows(tenantId, [{ name: 'A' }, { name: 'B' }], 'skip');
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/backend && npx jest src/brands/brands.service.spec.ts --no-coverage
```

Expected: FAIL — "service.importRows is not a function"

- [ ] **Step 3: Add `importRows` to the service**

In `apps/backend/src/brands/brands.service.ts`, add at the top:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add the method after the `remove` method:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.brand.findUnique({
        where: { tenant_id_name: { tenant_id: tenantId, name: row.name } },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      await this.db.brand.create({
        data: { tenant_id: tenantId, name: row.name, description: row.description },
      });
    },
    update: async (id, row) => {
      await this.db.brand.update({
        where: { id },
        data: { name: row.name, description: row.description },
      });
    },
  });
}
```

- [ ] **Step 4: Add the endpoint to the controller**

In `apps/backend/src/brands/brands.controller.ts`, add at the top:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add the endpoint after the existing `create` method (before `findAll`):

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.brandsService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 5: Run tests and verify they pass**

```bash
cd apps/backend && npx jest src/brands/brands.service.spec.ts --no-coverage
```

Expected: PASS — all tests including the 5 new ones

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/brands/brands.service.ts apps/backend/src/brands/brands.controller.ts apps/backend/src/brands/brands.service.spec.ts
git commit -m "feat(brands): add POST /brands/import endpoint"
```

---

## Task 3: Product Groups + Customer Groups Import Endpoints

**Files:**
- Modify: `apps/backend/src/product-groups/product-groups.service.ts`
- Modify: `apps/backend/src/product-groups/product-groups.controller.ts`
- Modify: `apps/backend/src/customer-groups/customer-groups.service.ts`
- Modify: `apps/backend/src/customer-groups/customer-groups.controller.ts`

**Interfaces:**
- Consumes: `runImport`, `ImportResult`, `ImportRowsDto`
- Produces: `POST /product-groups/import`, `POST /customer-groups/import`

- [ ] **Step 1: Add `importRows` to ProductGroupsService**

In `apps/backend/src/product-groups/product-groups.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after existing `remove`:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.productGroup.findUnique({
        where: { tenant_id_name: { tenant_id: tenantId, name: row.name } },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      await this.db.productGroup.create({
        data: { tenant_id: tenantId, name: row.name, description: row.description },
      });
    },
    update: async (id, row) => {
      await this.db.productGroup.update({
        where: { id },
        data: { name: row.name, description: row.description },
      });
    },
  });
}
```

- [ ] **Step 2: Add endpoint to ProductGroupsController**

In `apps/backend/src/product-groups/product-groups.controller.ts`, add import:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint (after `create`, before `findAll`):

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.productGroupsService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 3: Add `importRows` to CustomerGroupsService**

In `apps/backend/src/customer-groups/customer-groups.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after existing `remove`:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
      discount_percent: raw.discount_percent != null && raw.discount_percent !== ''
        ? Number(raw.discount_percent)
        : null,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.customerGroup.findUnique({
        where: { tenant_id_name: { tenant_id: tenantId, name: row.name } },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      await this.db.customerGroup.create({
        data: {
          tenant_id: tenantId,
          name: row.name,
          description: row.description,
          ...(row.discount_percent != null ? { discount_percent: row.discount_percent } : {}),
        },
      });
    },
    update: async (id, row) => {
      await this.db.customerGroup.update({
        where: { id },
        data: {
          name: row.name,
          description: row.description,
          ...(row.discount_percent != null ? { discount_percent: row.discount_percent } : {}),
        },
      });
    },
  });
}
```

- [ ] **Step 4: Add endpoint to CustomerGroupsController**

In `apps/backend/src/customer-groups/customer-groups.controller.ts`, add import:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint:

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.customerGroupsService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 5: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "product-groups|customer-groups" | head -20
```

Expected: no errors for these files

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/product-groups/ apps/backend/src/customer-groups/
git commit -m "feat(inventory,sales): add import endpoints for product groups and customer groups"
```

---

## Task 4: Product Subgroups Import Endpoint (Relational Group Lookup)

**Files:**
- Modify: `apps/backend/src/product-subgroups/product-subgroups.service.ts`
- Modify: `apps/backend/src/product-subgroups/product-subgroups.controller.ts`

**Interfaces:**
- Consumes: `runImport`, `ImportResult`, `ImportRowsDto`
- Produces: `POST /product-subgroups/import` — accepts `group_name` field, resolved to `group_id` by lookup

- [ ] **Step 1: Add `importRows` to ProductSubgroupsService**

In `apps/backend/src/product-subgroups/product-subgroups.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after existing `remove`:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name', 'group_name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      group_name: String(raw.group_name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      const group = await this.db.productGroup.findFirst({
        where: { tenant_id: tenantId, name: { equals: row.group_name, mode: 'insensitive' } },
      });
      if (!group) return null;
      const existing = await this.db.productSubgroup.findUnique({
        where: { group_id_name: { group_id: group.id, name: row.name } },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      const group = await this.db.productGroup.findFirst({
        where: { tenant_id: tenantId, name: { equals: row.group_name, mode: 'insensitive' } },
      });
      if (!group) throw new Error(`Product group "${row.group_name}" not found`);
      await this.db.productSubgroup.create({
        data: { tenant_id: tenantId, group_id: group.id, name: row.name, description: row.description },
      });
    },
    update: async (id, row) => {
      await this.db.productSubgroup.update({
        where: { id },
        data: { name: row.name, description: row.description },
      });
    },
  });
}
```

- [ ] **Step 2: Add endpoint to ProductSubgroupsController**

In `apps/backend/src/product-subgroups/product-subgroups.controller.ts`, add import:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint:

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.productSubgroupsService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep "product-subgroup" | head -10
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/product-subgroups/
git commit -m "feat(inventory): add POST /product-subgroups/import with group_name lookup"
```

---

## Task 5: Suppliers + Territories + Payment Methods Import Endpoints

**Files:**
- Modify: `apps/backend/src/suppliers/suppliers.service.ts` + `suppliers.controller.ts`
- Modify: `apps/backend/src/territories/territories.service.ts` + `territories.controller.ts`
- Modify: `apps/backend/src/payment-methods/payment-methods.service.ts` + `payment-methods.controller.ts`

**Interfaces:**
- Produces: `POST /suppliers/import`, `POST /territories/import`, `POST /payment-methods/import`

- [ ] **Step 1: Add `importRows` to SuppliersService**

In `apps/backend/src/suppliers/suppliers.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after the `remove` method:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      phone: raw.phone ? String(raw.phone).trim() || null : null,
      email: raw.email ? String(raw.email).trim() || null : null,
      address: raw.address ? String(raw.address).trim() || null : null,
      contact_person: raw.contact_person ? String(raw.contact_person).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.supplier.findUnique({
        where: { tenant_id_name: { tenant_id: tenantId, name: row.name } },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      await this.db.supplier.create({
        data: { tenant_id: tenantId, name: row.name, phone: row.phone, email: row.email, address: row.address },
      });
    },
    update: async (id, row) => {
      await this.db.supplier.update({
        where: { id },
        data: { name: row.name, phone: row.phone, email: row.email, address: row.address },
      });
    },
  });
}
```

- [ ] **Step 2: Add endpoint to SuppliersController**

In `apps/backend/src/suppliers/suppliers.controller.ts`, add:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint:

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.suppliersService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 3: Add `importRows` to TerritoriesService**

In `apps/backend/src/territories/territories.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after `remove`:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.territory.findFirst({
        where: { tenant_id: tenantId, name: { equals: row.name, mode: 'insensitive' }, parent_id: null },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      await this.db.territory.create({
        data: { tenant_id: tenantId, name: row.name, description: row.description },
      });
    },
    update: async (id, row) => {
      await this.db.territory.update({
        where: { id },
        data: { name: row.name, description: row.description },
      });
    },
  });
}
```

- [ ] **Step 4: Add endpoint to TerritoriesController**

In `apps/backend/src/territories/territories.controller.ts`, add:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint:

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.territoriesService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 5: Add `importRows` to PaymentMethodsService**

In `apps/backend/src/payment-methods/payment-methods.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after `remove` (or equivalent delete method):

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
      is_active: raw.is_active !== undefined ? String(raw.is_active).toLowerCase() !== 'false' : true,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.paymentMethod.findFirst({
        where: { tenant_id: tenantId, name: row.name },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      await this.db.paymentMethod.create({
        data: { tenant_id: tenantId, name: row.name, description: row.description, is_active: row.is_active },
      });
    },
    update: async (id, row) => {
      await this.db.paymentMethod.update({
        where: { id },
        data: { name: row.name, description: row.description, is_active: row.is_active },
      });
    },
  });
}
```

- [ ] **Step 6: Add endpoint to PaymentMethodsController**

In `apps/backend/src/payment-methods/payment-methods.controller.ts`, add:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint:

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.paymentMethodsService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 7: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "suppliers|territories|payment-methods" | head -20
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/suppliers/ apps/backend/src/territories/ apps/backend/src/payment-methods/
git commit -m "feat: add import endpoints for suppliers, territories, payment methods"
```

---

## Task 6: Price Lists Import Endpoint

**Files:**
- Modify: `apps/backend/src/price-lists/price-lists.service.ts`
- Modify: `apps/backend/src/price-lists/price-lists.controller.ts`

**Interfaces:**
- Produces: `POST /price-lists/import` — imports `name` + `description` only (no `is_default` to avoid transaction complexity; set manually post-import)

- [ ] **Step 1: Add `importRows` to PriceListsService**

In `apps/backend/src/price-lists/price-lists.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after `remove`:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.priceList.findUnique({
        where: { tenant_id_name: { tenant_id: tenantId, name: row.name } },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      await this.db.priceList.create({
        data: { tenant_id: tenantId, name: row.name, description: row.description },
      });
    },
    update: async (id, row) => {
      await this.db.priceList.update({
        where: { id },
        data: { name: row.name, description: row.description },
      });
    },
  });
}
```

- [ ] **Step 2: Add endpoint to PriceListsController**

In `apps/backend/src/price-lists/price-lists.controller.ts`, add:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint:

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.priceListsService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep "price-lists" | head -10
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/price-lists/
git commit -m "feat(sales): add POST /price-lists/import endpoint"
```

---

## Task 7: Customers Import Endpoint (Phone Unique Key + Group Lookup)

**Files:**
- Modify: `apps/backend/src/customers/customers.service.ts`
- Modify: `apps/backend/src/customers/customers.controller.ts`

**Interfaces:**
- Produces: `POST /customers/import`
- Unique key: `phone` if provided; `email` fallback; if both absent, no duplicate check (always creates).
- Optional `customer_group_name` resolved to `customer_group_id` by name lookup.

- [ ] **Step 1: Add `importRows` to CustomersService**

In `apps/backend/src/customers/customers.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after `remove`:

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      phone: raw.phone ? String(raw.phone).trim() || null : null,
      email: raw.email ? String(raw.email).trim() || null : null,
      address: raw.address ? String(raw.address).trim() || null : null,
      customer_group_name: raw.customer_group_name ? String(raw.customer_group_name).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      if (row.phone) {
        const byPhone = await this.db.customer.findUnique({
          where: { tenant_id_phone: { tenant_id: tenantId, phone: row.phone } },
        });
        if (byPhone) return byPhone.id;
      }
      if (row.email) {
        const byEmail = await this.db.customer.findFirst({
          where: { tenant_id: tenantId, email: row.email },
        });
        if (byEmail) return byEmail.id;
      }
      return null;
    },
    create: async (row) => {
      const customer_code = await this.generateCustomerCode(tenantId);
      let customer_group_id: string | null = null;
      if (row.customer_group_name) {
        const group = await this.db.customerGroup.findFirst({
          where: { tenant_id: tenantId, name: { equals: row.customer_group_name, mode: 'insensitive' } },
        });
        if (!group) throw new Error(`Customer group "${row.customer_group_name}" not found`);
        customer_group_id = group.id;
      }
      await this.db.customer.create({
        data: {
          tenant_id: tenantId,
          customer_code,
          name: row.name,
          phone: row.phone,
          email: row.email,
          address: row.address,
          customer_group_id,
        },
      });
    },
    update: async (id, row) => {
      let customer_group_id: string | null | undefined = undefined;
      if (row.customer_group_name !== null) {
        const group = await this.db.customerGroup.findFirst({
          where: { tenant_id: tenantId, name: { equals: row.customer_group_name ?? '', mode: 'insensitive' } },
        });
        customer_group_id = group?.id ?? null;
      }
      await this.db.customer.update({
        where: { id },
        data: {
          name: row.name,
          phone: row.phone ?? undefined,
          email: row.email ?? undefined,
          address: row.address ?? undefined,
          ...(customer_group_id !== undefined ? { customer_group_id } : {}),
        },
      });
    },
  });
}
```

- [ ] **Step 2: Add endpoint to CustomersController**

In `apps/backend/src/customers/customers.controller.ts`, add:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint:

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.customersService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep "customers" | head -10
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/customers/
git commit -m "feat(sales): add POST /customers/import with phone dedup and group lookup"
```

---

## Task 8: Employees Import Endpoint

**Files:**
- Modify: `apps/backend/src/employees/employees.service.ts`
- Modify: `apps/backend/src/employees/employees.controller.ts`

**Interfaces:**
- Produces: `POST /employees/import`
- Required: `name`. Optional: `phone`, `email`, `joining_date` (ISO date string), `salary`.
- Unique key: `phone` if provided; if absent, no duplicate check (always creates).
- `employee_code` is auto-generated (not expected in import file).

- [ ] **Step 1: Add `importRows` to EmployeesService**

In `apps/backend/src/employees/employees.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after the `remove` employee method (before department/designation methods):

```ts
async importRows(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      phone: raw.phone ? String(raw.phone).trim() || null : null,
      email: raw.email ? String(raw.email).trim() || null : null,
      joining_date: raw.joining_date ? String(raw.joining_date).trim() || null : null,
      salary: raw.salary != null && raw.salary !== '' ? Number(raw.salary) : null,
    }),
    findDuplicate: async (row) => {
      if (!row.phone) return null;
      const existing = await this.db.employee.findFirst({
        where: { tenant_id: tenantId, phone: row.phone },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      const employee_code = await this.generateEmployeeCode(tenantId);
      await this.db.employee.create({
        data: {
          tenant_id: tenantId,
          employee_code,
          name: row.name,
          phone: row.phone,
          email: row.email,
          ...(row.joining_date ? { joining_date: new Date(row.joining_date) } : {}),
          ...(row.salary != null ? { salary: row.salary } : {}),
        },
      });
    },
    update: async (id, row) => {
      await this.db.employee.update({
        where: { id },
        data: {
          name: row.name,
          phone: row.phone ?? undefined,
          email: row.email ?? undefined,
          ...(row.joining_date ? { joining_date: new Date(row.joining_date) } : {}),
          ...(row.salary != null ? { salary: row.salary } : {}),
        },
      });
    },
  });
}
```

- [ ] **Step 2: Add endpoint to EmployeesController**

In `apps/backend/src/employees/employees.controller.ts`, add:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint (in the employee CRUD section, not near department/designation endpoints):

```ts
@Post('import')
importRows(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.employeesService.importRows(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep "employees" | head -10
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/employees/
git commit -m "feat(hr): add POST /employees/import endpoint"
```

---

## Task 9: Warehouses Import Endpoint (In Inventory Module)

**Files:**
- Modify: `apps/backend/src/inventory/inventory.service.ts`
- Modify: `apps/backend/src/inventory/inventory.controller.ts`

**Interfaces:**
- Produces: `POST /inventory/warehouses/import`
- Required: `name`. Optional: `address`.
- Auto-assigns to the tenant's first active store. Unique check by `name` within the store.
- `code` is auto-generated via `generateWarehouseCode`.

- [ ] **Step 1: Add `importWarehouses` to InventoryService**

In `apps/backend/src/inventory/inventory.service.ts`, add import:

```ts
import { runImport, ImportResult } from '../common/import.util';
```

Add method after the `updateWarehouse` method:

```ts
async importWarehouses(
  tenantId: string,
  rows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
): Promise<ImportResult> {
  const store = await this.db.store.findFirst({
    where: { tenant_id: tenantId, is_active: true },
    orderBy: { created_at: 'asc' },
  });
  if (!store) throw new BadRequestException('No active store found for this tenant.');

  return runImport(rows, mode, tenantId, {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      address: raw.address ? String(raw.address).trim() || null : null,
    }),
    findDuplicate: async (row) => {
      const existing = await this.db.warehouse.findFirst({
        where: { tenant_id: tenantId, store_id: store.id, name: { equals: row.name, mode: 'insensitive' } },
      });
      return existing?.id ?? null;
    },
    create: async (row) => {
      const code = await this.generateWarehouseCode(tenantId, row.name);
      await this.db.warehouse.create({
        data: {
          tenant_id: tenantId,
          store_id: store.id,
          name: row.name,
          code,
          address: row.address,
        },
      });
    },
    update: async (id, row) => {
      await this.db.warehouse.update({
        where: { id },
        data: { name: row.name, address: row.address },
      });
    },
  });
}
```

- [ ] **Step 2: Add endpoint to InventoryController**

In `apps/backend/src/inventory/inventory.controller.ts`, add:

```ts
import { ImportRowsDto } from '../common/import.dto';
```

Add endpoint after the existing `createWarehouse` endpoint:

```ts
@Post('warehouses/import')
importWarehouses(@Tenant() tenant: TenantContext, @Body() body: ImportRowsDto) {
  return this.service.importWarehouses(tenant.tenantId, body.rows, body.mode);
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep "inventory" | head -10
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/inventory/inventory.service.ts apps/backend/src/inventory/inventory.controller.ts
git commit -m "feat(inventory): add POST /inventory/warehouses/import endpoint"
```

---

## Task 10: Frontend ImportDialog Component

**Files:**
- Create: `apps/frontend/src/components/import-dialog.tsx`

**Interfaces:**
- Produces: `<ImportDialog open entityLabel fields importFn onSuccess onClose>` — consumed by all 11 list pages in Task 11.

- [ ] **Step 1: Install papaparse**

```bash
cd apps/frontend && npm install papaparse @types/papaparse
```

Expected: `package.json` updated, no errors

- [ ] **Step 2: Create the component**

Create `apps/frontend/src/components/import-dialog.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import { Upload, X, ChevronRight, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  entityLabel: string;
  fields: ImportField[];
  importFn: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') => Promise<ImportResult>;
  onSuccess: () => void;
}

type Step = 'upload' | 'map' | 'preview' | 'result';

async function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || file.type === 'text/csv') {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => resolve({ headers: r.meta.fields ?? [], rows: r.data }),
        error: (err) => reject(new Error(err.message)),
      });
    });
  }
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

function applyMapping(
  rawRows: Record<string, string>[],
  mapping: Record<string, string>,
): Record<string, unknown>[] {
  return rawRows.map((raw) => {
    const out: Record<string, unknown> = {};
    for (const [key, header] of Object.entries(mapping)) {
      if (header) out[key] = raw[header] ?? null;
    }
    return out;
  });
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'map', label: 'Map Fields' },
  { key: 'preview', label: 'Preview' },
  { key: 'result', label: 'Result' },
];

export function ImportDialog({
  open,
  onClose,
  entityLabel,
  fields,
  importFn,
  onSuccess,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'skip' | 'upsert'>('skip');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setStep('upload');
    setRawHeaders([]);
    setRawRows([]);
    setMapping({});
    setMode('skip');
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    try {
      const { headers, rows } = await parseFile(file);
      if (rows.length === 0) { setParseError('File has no data rows.'); return; }
      setRawHeaders(headers);
      setRawRows(rows);
      const auto: Record<string, string> = {};
      for (const field of fields) {
        const match = headers.find(
          (h) =>
            h.trim().toLowerCase() === field.label.toLowerCase() ||
            h.trim().toLowerCase() === field.key.toLowerCase(),
        );
        auto[field.key] = match ?? '';
      }
      setMapping(auto);
      setStep('map');
    } catch (e: any) {
      setParseError(`Failed to parse file: ${e?.message ?? 'unknown error'}`);
    }
  };

  const handleImport = async () => {
    setSubmitting(true);
    try {
      const mapped = applyMapping(rawRows, mapping);
      const res = await importFn(mapped, mode);
      setResult(res);
      setStep('result');
      if (res.created > 0 || res.updated > 0) onSuccess();
    } catch (e: any) {
      setResult({ created: 0, updated: 0, skipped: 0, errors: [`Import failed: ${e?.message ?? 'unknown error'}`] });
      setStep('result');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedFromMap = fields.filter((f) => f.required).every((f) => mapping[f.key]);
  const mappedFields = fields.filter((f) => mapping[f.key]);
  const previewRows = applyMapping(rawRows.slice(0, 5), mapping);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight">Import {entityLabel}</h2>
            <div className="flex items-center gap-2 mt-2">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className={`text-xs font-black uppercase tracking-widest ${i <= stepIndex ? 'text-blue-600' : 'text-gray-300'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' && (
            <div>
              <div
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void handleFile(f); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <Upload className="w-10 h-10 text-gray-300 mb-4" />
                <p className="font-black text-gray-700 text-sm">Drag & drop or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports .csv and .xlsx</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
              />
              {parseError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{parseError}</div>
              )}
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Map your spreadsheet columns to system fields. Required fields are marked <span className="text-red-500">*</span>.
              </p>
              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-700 w-44 shrink-0">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <select
                      value={mapping[field.key] ?? ''}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none"
                    >
                      <option value="">— skip —</option>
                      {rawHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Duplicate handling</p>
                <div className="flex gap-6">
                  {(['skip', 'upsert'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={m} checked={mode === m} onChange={() => setMode(m)} className="accent-blue-600" />
                      <span className="text-sm font-bold text-gray-700">
                        {m === 'skip' ? 'Skip duplicates' : 'Update existing'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Showing first {previewRows.length} of {rawRows.length} rows after mapping.
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {mappedFields.map((f) => (
                        <th key={f.key} className="px-3 py-2 text-left font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {mappedFields.map((f) => (
                          <td key={f.key} className="px-3 py-2 text-gray-700 font-medium max-w-[160px] truncate">{String(row[f.key] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                <p className="text-sm">
                  <span className="font-black text-green-700">{result.created}</span> created ·{' '}
                  <span className="font-black text-blue-700">{result.updated}</span> updated ·{' '}
                  <span className="font-black text-gray-500">{result.skipped}</span> skipped
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-600">
                      {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped due to errors
                    </span>
                  </div>
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600 font-medium">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center shrink-0">
          <div>
            {step === 'map' && (
              <button onClick={() => setStep('upload')} className="text-sm font-black text-gray-400 hover:text-gray-600">
                ← Back
              </button>
            )}
            {step === 'preview' && (
              <button onClick={() => setStep('map')} className="text-sm font-black text-gray-400 hover:text-gray-600">
                ← Back
              </button>
            )}
            {step === 'result' && (
              <button onClick={reset} className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700">
                <RotateCcw className="w-4 h-4" />
                Import another file
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {step !== 'result' && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            {step === 'map' && (
              <button
                onClick={() => setStep('preview')}
                disabled={!canProceedFromMap}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => void handleImport()}
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md disabled:opacity-50"
              >
                {submitting ? 'Importing…' : `Import ${rawRows.length} rows`}
              </button>
            )}
            {step === 'result' && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | grep "import-dialog" | head -10
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/import-dialog.tsx apps/frontend/package.json apps/frontend/package-lock.json
git commit -m "feat(frontend): add shared ImportDialog component with CSV/XLSX parsing and field mapping"
```

---

## Task 11: Wire All 11 List Pages + api.ts Import Methods

**Files:**
- Modify: `apps/frontend/src/lib/api.ts`
- Modify: `apps/frontend/src/app/(app)/inventory/brands/page.tsx`
- Modify: `apps/frontend/src/app/(app)/inventory/categories/page.tsx`
- Modify: `apps/frontend/src/app/(app)/purchases/suppliers/page.tsx`
- Modify: `apps/frontend/src/app/(app)/sales/customer-groups/page.tsx`
- Modify: `apps/frontend/src/app/(app)/sales/customers/page.tsx`
- Modify: `apps/frontend/src/app/(app)/sales/price-lists/page.tsx`
- Modify: `apps/frontend/src/app/(app)/settings/payment-methods/page.tsx`
- Modify: `apps/frontend/src/app/(app)/sales/territories/page.tsx`
- Modify: `apps/frontend/src/app/(app)/hr/employees/page.tsx`
- Modify: `apps/frontend/src/app/(app)/inventory/settings/page.tsx`

**Interfaces:**
- Consumes: `ImportDialog`, `ImportField`, `ImportResult` from `@/components/import-dialog`; `fetchWithAuth` from `@/lib/api`

### Step 1: Add import API methods to api.ts

- [ ] **Step 1: Add 11 import methods to `apps/frontend/src/lib/api.ts`**

Find the section with `getBrands` (around line 803) and add the following import methods alongside the existing CRUD methods for each entity. Add them after the existing methods for each entity:

```ts
// After getBrands / createBrand methods:
importBrands: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/brands/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getProductGroups / createProductGroup methods:
importProductGroups: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/product-groups/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getProductSubgroups / createProductSubgroup methods:
importProductSubgroups: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/product-subgroups/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getSuppliers / createSupplier methods:
importSuppliers: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/suppliers/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getCustomerGroups / createCustomerGroup methods:
importCustomerGroups: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/customer-groups/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getCustomers / createCustomer methods:
importCustomers: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/customers/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getPriceLists / createPriceList methods:
importPriceLists: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/price-lists/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getPaymentMethods / createPaymentMethod methods:
importPaymentMethods: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/payment-methods/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getTerritories / createTerritory methods:
importTerritories: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/territories/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getEmployees / createEmployee methods:
importEmployees: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/employees/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),

// After getWarehouses / createWarehouse methods:
importWarehouses: (rows: Record<string, unknown>[], mode: 'skip' | 'upsert') =>
  fetchWithAuth('/inventory/warehouses/import', {
    method: 'POST',
    body: JSON.stringify({ rows, mode }),
    headers: { 'Content-Type': 'application/json' },
  }),
```

### Steps 2-12: Add Import button to each list page

For each page below, the changes follow the same pattern:

**A)** Add import to the component imports at the top:
```ts
import { ImportDialog, type ImportField } from '@/components/import-dialog';
import { Upload } from 'lucide-react';
```

**B)** Add state inside the component function:
```ts
const [importOpen, setImportOpen] = useState(false);
```

**C)** Define the fields constant (just before or inside the component):
```ts
const IMPORT_FIELDS: ImportField[] = [ ... ];
```

**D)** Add Import button in the `actions` prop of `PageHeader` (before the existing Add button):
```tsx
<button
  onClick={() => setImportOpen(true)}
  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-all hover:border-blue-300 hover:text-blue-700"
>
  <Upload className="w-4 h-4 mr-1.5" />
  Import
</button>
```

**E)** Add `<ImportDialog>` just before the closing `</div>` of the page return:
```tsx
<ImportDialog
  open={importOpen}
  onClose={() => setImportOpen(false)}
  entityLabel="ENTITY_LABEL"
  fields={IMPORT_FIELDS}
  importFn={(rows, mode) => api.importENTITY(rows, mode)}
  onSuccess={() => void load()}
/>
```

Apply the pattern to each page using the field lists below:

- [ ] **Step 2: Brands page** (`inventory/brands/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', required: false },
];
// importFn={(rows, mode) => api.importBrands(rows, mode)}
// entityLabel="Brands"
```

- [ ] **Step 3: Categories page** (`inventory/categories/page.tsx`) — covers both product groups and product subgroups; add two separate Import buttons, one for groups and one for subgroups

```ts
// Product Groups section:
const GROUP_IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', required: false },
];
// importFn={(rows, mode) => api.importProductGroups(rows, mode)}
// entityLabel="Product Groups"

// Product Subgroups section:
const SUBGROUP_IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'group_name', label: 'Group Name', required: true },
  { key: 'description', label: 'Description', required: false },
];
// importFn={(rows, mode) => api.importProductSubgroups(rows, mode)}
// entityLabel="Product Subgroups"
```

Add two separate `importOpen` states: `importGroupOpen` and `importSubgroupOpen`.

- [ ] **Step 4: Suppliers page** (`purchases/suppliers/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'contact_person', label: 'Contact Person', required: false },
];
// importFn={(rows, mode) => api.importSuppliers(rows, mode)}
// entityLabel="Suppliers"
```

- [ ] **Step 5: Customer Groups page** (`sales/customer-groups/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'discount_percent', label: 'Discount %', required: false },
];
// importFn={(rows, mode) => api.importCustomerGroups(rows, mode)}
// entityLabel="Customer Groups"
```

- [ ] **Step 6: Customers page** (`sales/customers/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'customer_group_name', label: 'Customer Group', required: false },
];
// importFn={(rows, mode) => api.importCustomers(rows, mode)}
// entityLabel="Customers"
```

- [ ] **Step 7: Price Lists page** (`sales/price-lists/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', required: false },
];
// importFn={(rows, mode) => api.importPriceLists(rows, mode)}
// entityLabel="Price Lists"
```

- [ ] **Step 8: Payment Methods page** (`settings/payment-methods/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'is_active', label: 'Is Active', required: false },
];
// importFn={(rows, mode) => api.importPaymentMethods(rows, mode)}
// entityLabel="Payment Methods"
```

- [ ] **Step 9: Territories page** (`sales/territories/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', required: false },
];
// importFn={(rows, mode) => api.importTerritories(rows, mode)}
// entityLabel="Territories"
```

- [ ] **Step 10: Employees page** (`hr/employees/page.tsx`)

```ts
const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'joining_date', label: 'Joining Date', required: false },
  { key: 'salary', label: 'Salary', required: false },
];
// importFn={(rows, mode) => api.importEmployees(rows, mode)}
// entityLabel="Employees"
```

- [ ] **Step 11: Inventory Settings page** (`inventory/settings/page.tsx`) — warehouses section

```ts
const WAREHOUSE_IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'address', label: 'Address', required: false },
];
// importFn={(rows, mode) => api.importWarehouses(rows, mode)}
// entityLabel="Warehouses"
```

- [ ] **Step 12: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 13: Start dev server and test the full flow manually**

```bash
cd apps/frontend && npm run dev
```

Test checklist (do in browser):
1. Go to Inventory → Brands → click Import → verify dialog opens
2. Drop a CSV file with columns `Name,Description` → verify auto-mapping
3. Proceed to Preview → verify first 5 rows shown
4. Click Import → verify result (X created)
5. Go to Purchases → Suppliers → Import → test with `.xlsx` file
6. Test the "Update existing" mode on a second import of the same file
7. Test with a file that has a wrong column name → verify manual mapping works
8. Test with a row missing the required Name field → verify error appears in result

- [ ] **Step 14: Commit**

```bash
git add apps/frontend/src/lib/api.ts \
  apps/frontend/src/app/\(app\)/inventory/brands/page.tsx \
  apps/frontend/src/app/\(app\)/inventory/categories/page.tsx \
  apps/frontend/src/app/\(app\)/purchases/suppliers/page.tsx \
  apps/frontend/src/app/\(app\)/sales/customer-groups/page.tsx \
  apps/frontend/src/app/\(app\)/sales/customers/page.tsx \
  apps/frontend/src/app/\(app\)/sales/price-lists/page.tsx \
  apps/frontend/src/app/\(app\)/settings/payment-methods/page.tsx \
  apps/frontend/src/app/\(app\)/sales/territories/page.tsx \
  apps/frontend/src/app/\(app\)/hr/employees/page.tsx \
  apps/frontend/src/app/\(app\)/inventory/settings/page.tsx
git commit -m "feat(frontend): wire ImportDialog into all 11 master data list pages"
```
