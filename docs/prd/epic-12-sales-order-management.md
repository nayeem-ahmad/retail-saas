# Epic 12: Sales Order Management

### Epic Goal
Manage customer orders that are pending fulfillment, allowing for partial payments, delivery scheduling, and stock reservation.

### Epic Description
Unlike POS transactions, Sales Orders track items that have been committed but not necessarily delivered or paid for in full.

**Key Features:**
*   **Order Creation:** Draft and confirm customer orders.
*   **Stock Reservation:** Optionally hold stock for pending orders to prevent overselling.
*   **Status Tracking:** Manage orders through cycles: `Draft`, `Confirmed`, `Processing`, `Delivered`, `Paid`.
*   **Payment Links:** Integration with payment gateways to allow customers to pay for orders remotely.

**Stories:**
1. **Story 1: Sales Order API** - CRUD operations for `SalesOrder` and `SalesOrderItem`.
2. **Story 2: Order Fulfillment Workflow** - Transition orders from confirmed to delivered, triggering stock decrement.
3. **Story 3: Partial Payment Handling** - Record deposits against an order and track the remaining `amount_due`.
