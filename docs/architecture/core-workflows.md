# Core Workflows

This section uses sequence diagrams to illustrate critical user journeys.

### Point of Sale (POS) Transaction Workflow

This diagram illustrates the workflow for an in-store POS transaction with payment processing.

```mermaid
sequenceDiagram
    participant User as (Cashier)
    participant Frontend as (Next.js App)
    participant Backend as (API Route)
    participant DB as (Supabase DB)

    User->>Frontend: 1. Adds items and payment details, then clicks "Complete Sale"
    Frontend->>Backend: 2. POST /api/sales (items, payments)
    Backend->>DB: 3. BEGIN TRANSACTION
    Backend->>Backend: 4. Calculate total_amount from items
    Backend->>Backend: 5. Calculate total_paid from payments
    alt total_paid < total_amount
        Backend->>Backend: 6. Set sale status = 'due'
    else
        Backend->>Backend: 7. Set sale status = 'paid'
    end
    Backend->>DB: 8. INSERT INTO sales (total_amount, amount_due, status)
    DB-->>Backend: 9. Returns new sale_id
    Backend->>DB: 10. For each item: INSERT INTO sale_items (...) & UPDATE products SET quantity = quantity - ?
    Backend->>DB: 11. For each payment: INSERT INTO payments (...)
    Backend->>DB: 12. COMMIT TRANSACTION
    DB-->>Backend: 13. Commit successful
    Backend-->>Frontend: 14. 201 Created (new sale details)
    Frontend->>User: 15. Display "Sale Complete" confirmation
```

### Sales Return Workflow

This diagram illustrates the process for a cashier processing a customer's return at the Point of Sale.

```mermaid
sequenceDiagram
    participant User as (Cashier)
    participant Frontend as (Next.js App)
    participant Backend as (API Route)
    participant DB as (Supabase DB)

    User->>Frontend: 1. Looks up original sale and selects items to return
    Frontend->>Backend: 2. POST /api/sales-returns (original_sale_id, items)
    Backend->>DB: 3. BEGIN TRANSACTION
    Backend->>DB: 4. SELECT id FROM sales WHERE id = ?
    DB-->>Backend: 5. Confirms original sale exists
    Backend->>DB: 6. INSERT INTO sales_returns (...)
    DB-->>Backend: 7. Returns new sales_return_id
    Backend->>DB: 8. For each item: INSERT INTO sales_return_items (...)
    Backend->>DB: 9. For each item: UPDATE products SET quantity = quantity + ? WHERE id = ?
    Backend->>DB: 10. COMMIT TRANSACTION
    DB-->>Backend: 11. Commit successful
    Backend-->>Frontend: 12. 201 Created (sales return details)
    Frontend->>User: 13. Display "Return Complete" and refund/credit info
```
