# Epic 9: Advanced Payment Handling

### Epic Goal
This epic will refactor the core sales process to properly handle multiple, configurable payment methods. This is a foundational requirement for accurate accounting and ledger functionality.

### Epic Description

**Enhancement Details:**
*   **What's being added/changed:** The `Sale` model will be made payment-aware. New `PaymentMethod` and `Payment` models will be introduced. The sales creation process will be updated to accept multiple payments against a single sale. Users will have a new settings area to manage their payment methods.
*   **How it integrates:** This is a core refactoring of the sales process. It involves changes to the `POST /api/sales` endpoint and the addition of a new CRUD service for `/api/payment-methods`.

### Stories

1.  **Story 1: Refactor Sale & Implement Payment Models**
    *   **Description:** Update the database schema with the new models. Refactor the `POST /api/sales` endpoint to handle the new request body and create `Sale`, `SaleItem`, and `Payment` records within a single transaction.
2.  **Story 2: Implement Payment Method Management**
    *   **Description:** Build the API and UI for users to create, view, update, and deactivate their payment methods.
3.  **Story 3: Update POS UI for Split Payments**
    *   **Description:** Update the Point of Sale interface to allow cashiers to select one or more payment methods and enter the amount for each, enabling split payments.

### Risk Mitigation
- **Primary Risk:** Breaking the core sales creation process.
- **Mitigation:** This change will be heavily tested with integration tests covering numerous payment scenarios (full payment, partial payment, multiple payments).
