# Epic 20: Core Purchase Transactions

### Epic Goal
Provide a streamlined workflow for recording the procurement of stock from suppliers, ensuring accurate inventory updates and financial liabilities.

### Epic Description
This epic defines the primary loop for replenishing inventory. It handles the manual recording of purchases, link to suppliers, and tax/discount calculations.

**Key Features:**
*   **Direct Purchase Entry:** Record items received without a prior PO.
*   **Supplier Linkage:** Select from existing suppliers or add a new one on the fly.
*   **Cost Management:** Track cost price per unit and apply freight or landing costs.
*   **Auto-Stock Increment:** Update `ProductStock` per warehouse upon completion.

**Stories:**

**Story 1.4: Basic Purchase Recording**
*   As a Shop Owner, I want to record a purchase of stock from a supplier, so that my inventory levels are accurately updated.
*   **Acceptance Criteria:**
    1.  From the inventory section, a user can select a product and choose to "Add Stock".
    2.  The user can enter a quantity for the purchased stock.
    3.  Upon saving the purchase, the stock level for the selected product is correctly increased.

1. **Story 1: Purchase Entry UI** - Interface for selecting products and entering quantities and cost prices.
2. **Story 2: Supplier Selection & Add** - Link a purchase to a supplier and store their details.
3. **Story 3: Transactional Inventory Updates** - Atomically increase stock levels in the destination warehouse.
