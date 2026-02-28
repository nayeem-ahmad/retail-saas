# Epic 71: Production Work Orders

**Goal:** Enable users to initiate and track the production process, moving from "Planned" to "Finished" goods.

---

**Story 71.1: Create Production Work Order**
*   **As a** Store Manager, **I want to** create a Work Order for a specific quantity of a manufactured product, **so that** I can authorize the production run.
*   **Acceptance Criteria:**
    1.  A "New Work Order" screen where a user selects a product with a BOM and enters the target quantity.
    2.  The system automatically calculates the total raw materials required for the target quantity.
    3.  The system checks current stock levels and warns if there are insufficient raw materials.
    4.  Work Orders start in a "Planned" status.

---

**Story 71.2: Work Order Tracking & Status**
*   **As a** Production Staff, **I want to** update the status of a work order as it moves through the process, **so that** the manager knows the current progress.
*   **Acceptance Criteria:**
    1.  A list view of all Work Orders with status badges: "Planned", "In Progress", "Completed", "Cancelled".
    2.  Users can transition a Work Order from "Planned" to "In Progress" when work starts.
