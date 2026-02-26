# Epic 43: Product Categorization & Hierarchy

### Epic Goal
Introduce a multi-level product hierarchy (Group > Subgroup > Product) to enable better inventory organization, reporting, and filtering.

### Epic Description
Currently, products are stored in a flat list. This epic will implement the database structures, APIs, and UI components required to categorize products into Groups and Subgroups.

**Integration Points:**
*   **Data Models:** Updates to `Product`, `ProductGroup`, and `ProductSubGroup` in `docs/architecture/data-models.md`.
*   **Sales Reports:** Future ability to filter sales by group/subgroup.
*   **Inventory Management:** Group-based stock taking and adjustments.

**Success Criteria:**
1. Users can create, edit, and delete Product Groups.
2. Users can create Subgroups within a parent Group.
3. Products can be assigned to a specific Group and Subgroup.
4. The product list can be filtered by Group and Subgroup.

### Stories

1. **Story 1: Categorization API & Schema**
   * **Description:** Implement the `ProductGroup` and `ProductSubGroup` tables and their corresponding CRUD API endpoints. Update the `Product` table with foreign keys.

2. **Story 2: Category Management UI**
   * **Description:** Create a settings interface for store owners to manage their product groups and subgroups.

3. **Story 3: Product-to-Category Mapping UI**
   * **Description:** Update the "Add/Edit Product" forms to allow selecting a Group and Subgroup.

4. **Story 4: Group-based Filtering in Inventory**
   * **Description:** Add dropdown filters to the main Inventory list to allow browsing by category.
