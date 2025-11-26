# Epic 1: Foundation & Core Retail Operations (MVP)

**Expanded Goal:** This epic focuses on delivering the absolute core value proposition of the product. By the end of this epic, a user will be able to set up their store, manage their basic inventory and purchases, and conduct daily sales through the POS system. This establishes the foundational loop of a retail business and provides immediate utility.

---
**Story 1.1: Project & Infrastructure Setup**
*   As a DevOps Engineer, I want to set up the initial monorepo, CI/CD pipeline, and cloud infrastructure, so that the development team can start building and deploying the application.
*   **Acceptance Criteria:**
    1.  A Git monorepo is created and accessible to the team.
    2.  A basic CI/CD pipeline is configured to run on commit to the main branch.
    3.  The pipeline can successfully build and deploy a simple "Hello World" or health-check endpoint to the target cloud environment.

---
**Story 1.2: Basic User & Store Setup**
*   As a Shop Owner, I want to sign up for the service and create my store profile, so that I can begin using the application.
*   **Acceptance Criteria:**
    1.  A user can register for a new account with an email and password.
    2.  A registered user can log in to the application.
    3.  Upon first login, the user is prompted to create a store with a name and address.

---
**Story 1.3: Basic Product Management**
*   As a Shop Owner, I want to add and view products in my inventory, so that I can manage my stock.
*   **Acceptance Criteria:**
    1.  A logged-in user can access an "Inventory" section.
    2.  The user can create a new product with at least a name, price, and initial stock quantity.
    3.  The user can view a list of all their products with their current stock levels.

---
**Story 1.4: Basic Purchase Recording**
*   As a Shop Owner, I want to record a purchase of stock from a supplier, so that my inventory levels are accurately updated.
*   **Acceptance Criteria:**
    1.  From the inventory section, a user can select a product and choose to "Add Stock".
    2.  The user can enter a quantity for the purchased stock.
    3.  Upon saving the purchase, the stock level for the selected product is correctly increased.

---
**Story 1.5: End-to-End POS Transaction**
*   As a Shop Owner, I want to sell a product through a simple POS interface, so that I can serve my customers and automatically decrement my inventory.
*   **Acceptance Criteria:**
    1.  A user can access a "Point of Sale" screen.
    2.  The user can select a product from their inventory to add to a cart.
    3.  The system displays the total price.
    4.  The user can complete the sale (assuming a simple cash transaction for the MVP).
    5.  Upon completion of the sale, the stock level for the sold product is correctly decreased.

---
**Story 1.6: Customer SMS Notification**
*   As a Shop Owner, I want my customers to receive an SMS notification when they make a purchase or payment, so that they have an immediate record of the transaction.
*   **Acceptance Criteria:**
    1.  When a new sale is completed, the system checks if a customer phone number is associated with the sale.
    2.  If a phone number is present, the system sends an SMS containing the store name, total amount, and transaction ID.
    3.  The system handles SMS sending asynchronously to avoid delaying the POS response.
    4.  (Optional for MVP) If the SMS fails, the error is logged, but the sale remains valid.

---
