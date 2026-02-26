# Epic 40: Warehouse to Warehouse Transfer

### Epic Goal
Enable the reliable and documented movement of stock from one warehouse (or storefront) to another within the same store account.

### Epic Description
This epic focuses on the internal logistics of stock movement. It ensures that when products are transferred, the stock is atomically deducted from the source and added to the destination, providing a clear audit trail.

**Key Features:**
*   **Transfer Initiation:** Request a stock movement from Source A to Destination B.
*   **Transit Management:** Optionally track the status (e.g., `Sent`, `Received`) for longer-distance transfers.
*   **Auto-Stock Rebalancing:** Atomically update `ProductStock` records in both locations.

**Stories:**
1. **Story 1: Transfer Creation API** - Record the source, destination, items, and quantities for a move.
2. **Story 2: Transfer Approval Flow** - A "Receive" action at the destination to confirm the stock has arrived.
3. **Story 3: Transit History & Auditing** - View all historical movements for a specific product.
