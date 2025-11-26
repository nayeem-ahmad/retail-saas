# Epic 6: Low-Stock Alerts Dashboard

### Epic Goal
This epic will provide store owners with a simple dashboard widget to see which products are running low. This adds value by preventing stockouts, saving time on manual inventory checks, and streamlining the reordering process.

### Epic Description

**Enhancement Details:**
*   **What's being added/changed:** A new field `reorder_level` will be added to products. A new API endpoint and a frontend dashboard widget will be created to display products where the current `quantity` is at or below this `reorder_level`.
*   **How it integrates:** The feature uses the existing `Product` model and `ProductRepository`, adding a new read-only method. It follows established patterns for API routes and frontend components.

### Stories

1.  **Story 1: Enhance Product Model & API**
    *   **Description:** Add the `reorder_level` field to the `Product` data model. Create the `GET /api/products/low-stock` endpoint.
2.  **Story 2: Develop Low-Stock Dashboard Widget**
    *   **Description:** Build the UI component that fetches data from the new endpoint and displays the list of low-stock products.

### Compatibility Requirements
- [X] All changes are backward compatible and additive.

### Risk Mitigation
- **Primary Risk:** Performance impact of the low-stock query on a large product database.
- **Mitigation:** Ensure the `quantity` and `reorder_level` columns are indexed for efficient querying.
- **Rollback Plan:** The feature can be disabled via feature flag if needed.
