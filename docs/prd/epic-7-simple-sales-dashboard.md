# Epic 7: Simple Sales Dashboard

### Epic Goal
This epic will provide store owners with an at-a-glance summary of the current day's sales activity, including total revenue, number of sales, and average sale value. This provides a real-time pulse of the business.

### Epic Description

**Enhancement Details:**
*   **What's being added/changed:** A new API endpoint and a corresponding frontend dashboard will be created to display key sales metrics.
*   **How it integrates:** The feature uses the existing `Sale` model and a new method in the `SaleRepository` to perform simple aggregations.

### Stories

1.  **Story 1: Implement Sales Summary API**
    *   **Description:** Create the `GET /api/dashboard/sales-summary` endpoint that calculates and returns total revenue, sale count, and average sale value for the day.
2.  **Story 2: Develop Sales Dashboard UI**
    *   **Description:** Build the UI component that calls the new API and displays the key metrics on the main dashboard.

### Compatibility Requirements
- [X] All changes are backward compatible and additive.

### Risk Mitigation
- **Primary Risk:** Performance of the aggregation query on a very large `sales` table.
- **Mitigation:** Ensure the `created_at` column on the `sales` table is indexed. For larger-scale future versions, consider a separate analytics data store.
