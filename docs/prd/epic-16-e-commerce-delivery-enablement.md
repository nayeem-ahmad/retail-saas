# Epic 11: E-commerce & Delivery Enablement

**Expanded Goal:** This epic introduces a major new sales channel for the business. It enables shop owners to create and manage their own customer-facing online store, accept orders, and manage the entire fulfillment and delivery process, transforming their brick-and-mortar operation into a multi-channel retail business.

---
**Story 3.1: E-commerce Storefront Setup**
*   As a Store Owner, I want to enable and configure my public e-commerce storefront, so that my customers can browse my products online.
*   **Acceptance Criteria:**
    1.  An Admin can enable the storefront from a new "E-commerce" settings page.
    2.  When enabled, the storefront is available at a unique, publicly accessible URL.
    3.  Products from the inventory that are marked as "available online" are displayed on the storefront with their name and price.

---
**Story 3.2: Customer Registration & Shopping Cart**
*   As a Shopper, I want to create an account on the storefront and add items to a shopping cart, so that I can prepare to place an order.
*   **Acceptance Criteria:**
    1.  A new customer can register for an account directly on the storefront website.
    2.  A logged-in customer can add products to a persistent shopping cart.
    3.  The cart view correctly displays the selected items and the total price.

---
**Story 3.3: Online Checkout & Order Placement**
*   As a Shopper, I want to check out and pay for my order online, so that I can complete my purchase.
*   **Acceptance Criteria:**
    1.  From the cart, a customer can proceed to a checkout page.
    2.  The customer can enter or select a delivery address.
    3.  The customer can pay for the order using the integrated bKash/Nagad payment gateway.
    4.  A successful payment creates a new order in the system and shows the customer a confirmation page.

---
**Story 3.4: Online Order Management**
*   As a Store Owner, I want to see and manage new online orders from within the main application, so that I can prepare them for fulfillment.
*   **Acceptance Criteria:**
    1.  A new "Online Orders" section is available to Admin users.
    2.  New, paid orders from the storefront appear in a list with a "New" status.
    3.  The owner can view the order details, including the customer's information, the items ordered, and the delivery address.
    4.  The owner can update an order's status to "Processing".

---
**Story 3.5: Basic Delivery Management**
*   As a Store Owner, I want to manage the delivery of an online order, so that the customer receives their items.
*   **Acceptance Criteria:**
    1.  The owner can update an order's status from "Processing" to "Out for Delivery" and then to "Delivered".
    2.  The owner can assign an order to a delivery person (from a simple list of delivery people managed in settings).
    3.  The customer can view the current status of their order in their account's order history page on the storefront.

---
