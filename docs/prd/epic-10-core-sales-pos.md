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
1. **Story 1: POS Interface UI** - Fast, touch-friendly UI for selecting products and managing a cart.
2. **Story 2: Split Payment Logic** - API and UI support for multiple payment records against a single `Sale`.
3. **Story 3: Real-time Stock Lock/Decrement** - Atomically update `ProductStock` per warehouse upon sale completion.
4. **Story 4: Cashier Session Tracking** - Daily register opening/closing and cash reconciliation.
