# Epic 72: Manufacturing Inventory Sync

**Goal:** Ensure that the production process accurately reflects in the store's inventory, automatically consuming raw materials and adding finished goods.

---

**Story 72.1: Automated Inventory Consumption & Completion**
*   **As a** Store Owner, **I want** the system to automatically update my stock levels when a production order is completed, **so that** my inventory is always accurate.
*   **Acceptance Criteria:**
    1.  When a Work Order is marked as "Completed", the system performs an atomic transaction:
        -   **Decrements** the stock of all raw material components used.
        -   **Increments** the stock of the finished product.
    2.  The transaction is logged in the inventory history for audit purposes.
    3.  The cost of the finished product is updated (optional/configurable) based on the total cost of materials consumed.

---

**Story 72.2: Production Wastage Recording**
*   **As a** Production Manager, **I want to** record any raw material wastage during a production run, **so that** I can track material efficiency and shrinkage.
*   **Acceptance Criteria:**
    1.  Upon completing a Work Order, the user has an option to record "Additional Material Consumption" (wastage).
    2.  Wastage is logged separately from the standard BOM consumption for reporting.
