# Epic 8: Inventory Adjustments

### Epic Goal
This epic will provide a simple mechanism for users to manually adjust inventory levels. This is critical for maintaining accurate stock counts when products are lost, stolen, damaged, or during routine stock-taking.

### Epic Description

**Enhancement Details:**
*   **What's being added/changed:** A new feature to manually change a product's quantity and record a reason for the change. This creates an essential audit trail for inventory management.
*   **How it integrates:** A new API endpoint (`POST /inventory/adjustments`) and a new data model (`InventoryAdjustment`) will be created. The feature will update the existing `Product` model.

### Stories

1.  **Story 1: Implement Inventory Adjustment API**
    *   **Description:** Create the `InventoryAdjustment` table and the API endpoint to process adjustments. The endpoint must update the product's quantity and log the adjustment in a single transaction.
2.  **Story 2: Develop Inventory Adjustment UI**
    *   **Description:** Build a simple form (e.g., in a modal on the product details page) that allows a user to enter a quantity change and select a reason.

### Risk Mitigation
- **Primary Risk:** Unauthorized or accidental inventory changes.
- **Mitigation:** The feature should be restricted to authorized user roles (e.g., 'owner', 'manager'). All adjustments are logged in the new table for a clear audit trail.
