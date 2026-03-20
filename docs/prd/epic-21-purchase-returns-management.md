# Epic 21: Purchase Returns Management

### Epic Goal
This epic will introduce a system for managing purchase returns to suppliers. This ensures accurate inventory tracking and correct financial accounting for goods returned to vendors.

### Epic Description

**Existing System Context:**
*   **Current relevant functionality:** The system currently supports purchasing workflows and inventory management.
*   **Technology stack:** Next.js API Routes with a Supabase (PostgreSQL) backend.
*   **Integration points:** The new functionality will integrate with the existing `Product`, `Purchase`, and `Supplier` data models.

**Enhancement Details:**
*   **What's being added/changed:** This epic introduces a system for managing purchase returns to suppliers (FR10).
*   **How it integrates:** Integration will be achieved via new API endpoints (`/api/purchase-returns`) and new database tables (`PurchaseReturn`, `PurchaseReturnItem`).
*   **Success criteria:**
    1.  Users can create and track a purchase return to a supplier.
    2.  Inventory stock levels are automatically decreased when a purchase return is completed.
    3.  All new API endpoints are documented and tested.

### Stories

1. **Story 1: Purchase Return Schema & API Foundation**
    * **Description:** Create the database tables (`PurchaseReturn`, `PurchaseReturnItem`) and baseline CRUD endpoints required to create, list, view, update, and delete supplier returns.

2. **Story 2: Purchase Return Validation & Inventory Reversal**
    * **Description:** Add quantity validation, stock-availability guards, transactional stock decrement behavior, and test coverage for create, update, and delete flows.

3. **Story 3: Purchase Returns List & Creation UI**
    * **Description:** Build the dashboard module, list page, and purchase lookup workflow used to initiate supplier returns from original purchases.

4. **Story 4: Purchase Return Detail, Edit & Print Workflow**
    * **Description:** Build the detail view, edit mode, delete flow, and print-friendly supplier return document experience.

### Compatibility Requirements
- [X] Existing APIs remain unchanged.
- [X] Database schema changes are backward compatible (additive).
- [X] UI changes will follow existing design patterns.

### Risk Mitigation
- **Primary Risk:** Incorrectly updating inventory or financial records during a return process.
- **Mitigation:** All database operations for a single return will be wrapped in a transaction to ensure atomicity.
- **Rollback Plan:** Automatic database transaction rollback on failure.

### Definition of Done
- [ ] All stories completed with acceptance criteria met.
- [ ] Existing functionality verified through regression testing.
- [ ] All relevant documentation (`prd`, `architecture`) is updated.
