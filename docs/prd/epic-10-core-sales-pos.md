# Epic 10: Core Sales & POS Transactions

### Epic Goal
Provide a high-performance, resilient Point of Sale (POS) interface for processing retail transactions with support for multiple payment methods and real-time inventory updates.

### Epic Description
This epic defines the primary revenue-generating loop for the SaaS platform. It expands the MVP to handle sophisticated retail requirements like split payments, tax calculations, and cashier session management.

**Key Features:**
*   **Search & Add:** Rapid product lookup by name, SKU, or category.
*   **Advanced Payments:** Support for multiple payment methods (Cash, bKash, Cards) per sale.
*   **Tax/Discounting:** Apply line-item or transaction-level discounts and calculate VAT/taxes.
*   **Receipt Generation:** Automated SMS receipts and thermal print support.

**Stories:**

**Story 1.3: Basic Product Management**
*   As a Shop Owner, I want to add and view products in my inventory, so that I can manage my stock.
*   **Acceptance Criteria:**
    1.  A logged-in user can access an "Inventory" section.
    2.  The user can create a new product with at least a name, price, and initial stock quantity.
    3.  The user can view a list of all their products with their current stock levels.

**Story 1.5: End-to-End POS Transaction**
*   As a Shop Owner, I want to sell a product through a simple POS interface, so that I can serve my customers and automatically decrement my inventory.
*   **Acceptance Criteria:**
    1.  A user can access a "Point of Sale" screen.
    2.  The user can select a product from their inventory to add to a cart.
    3.  The system displays the total price.
    4.  The user can complete the sale (assuming a simple cash transaction for the MVP).
    5.  Upon completion of the sale, the stock level for the sold product is correctly decreased.

1. **Story 1: POS Interface UI** - Fast, touch-friendly UI for selecting products and managing a cart.
2. **Story 2: Split Payment Logic** - API and UI support for multiple payment records against a single `Sale`.
3. **Story 3: Real-time Stock Lock/Decrement** - Atomically update `ProductStock` per warehouse upon sale completion.
4. **Story 4: Cashier Session Tracking** - Daily register opening/closing and cash reconciliation.
