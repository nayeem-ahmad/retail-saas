# Epic 70: Simple Manufacturing Setup (BOM)

**Goal:** Provide a simple way for small businesses to define "recipes" or Bills of Materials (BOM) for products they produce in-house from other inventory items.

---

**Story 70.1: Bill of Materials (BOM) Definition**
*   **As a** Store Owner, **I want to** define which raw materials and quantities are needed to produce a finished product, **so that** I have a standard recipe for production.
*   **Acceptance Criteria:**
    1.  A "Manufacturing" tab is added to the Product details screen for eligible products.
    2.  Users can add one or more existing inventory items as "Components" with their required quantities.
    3.  The system calculates the estimated "Raw Material Cost" based on the current cost prices of the components.
    4.  A product can only have one active BOM at a time for simplicity.

---

**Story 70.2: BOM List & Ingredient Search**
*   **As a** Production Manager, **I want to** quickly see which products have recipes and search by ingredients, **so that** I can manage my production planning.
*   **Acceptance Criteria:**
    1.  A centralized "Recipes" (BOM) list showing all manufactured products.
    2.  Search functionality to find all products that use a specific raw material (e.g., "Which products use Sugar?").
