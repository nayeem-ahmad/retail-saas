# Epic 31: Automated Accounting Integration & Posting Rules

## Epic Goal

Ensure operational modules (Sales, Purchase, Inventory, and related returns/adjustments) automatically create balanced accounting vouchers using tenant-configurable posting rules.

## Epic Description

This epic connects day-to-day operational transactions to accounting without requiring manual voucher entry for standard flows. It introduces a centralized posting-rule configuration where default account mappings are seeded for new tenants and can be updated safely by authorized users.

**Core Principles:**

* **Automatic Posting:** Eligible operational events create vouchers automatically.
* **Configurable Mappings:** A settings layer controls which accounts are used for each event type.
* **Safe Defaults:** New tenants receive a seed template of default mappings.
* **Atomic Integrity:** Source transaction and voucher posting must succeed together or fail together.
* **Auditability:** Each auto-created voucher stores source module and source record references.

**Stories:**

1. **Story 1: Posting Rules Settings & Default Mapping Seed** - Add accounting posting settings with seeded defaults for common events (sale, sale return, purchase, purchase return, stock adjustment, and fund movement).
2. **Story 2: Sales and Sales-Return Auto Posting** - Finalized sales and approved sales returns automatically generate vouchers based on configured mappings and payment method context.
3. **Story 3: Purchase and Purchase-Return Auto Posting** - Posted purchases and purchase returns automatically generate vouchers, including payable or cash/bank impact according to configured rules.
4. **Story 4: Inventory and Transfer Accounting Events** - Inventory adjustments, shrinkage/discrepancy postings, and warehouse-transfer financial impacts generate accounting entries when configured.
5. **Story 5: Posting Reliability, Replay, and Reconciliation** - Add observability, retry/replay support, and reconciliation views to identify and recover failed posting events.

## Acceptance Criteria (Epic Level)

1. A tenant-scoped posting-rule configuration exists and supports mapping each supported event type to required debit and credit accounts.
2. Seed/bootstrap logic creates a default mapping set for new tenants using the default Chart of Accounts skeleton.
3. Auto-created vouchers store trace fields for source module and source transaction ID.
4. Standard operational events (sales, purchases, returns, and inventory adjustments) can post vouchers without manual accounting entry.
5. Posting failures are observable and recoverable without duplicate vouchers.
6. RBAC limits posting-rule configuration to authorized roles (for example, OWNER and ACCOUNTANT).
