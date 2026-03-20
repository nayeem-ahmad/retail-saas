# Epic 01: SaaS Foundation & Infrastructure

**Goal:** This epic focuses on establishing the technical and structural foundation of the Retail SaaS platform. By the end of this epic, the development environment will be fully operational, and the application will support basic multi-tenant store and user management.

## Stories

### [1.1] Project & Infrastructure Setup
*   **User Story:** As a DevOps Engineer, I want to set up the initial monorepo, CI/CD pipeline, and cloud infrastructure, so that the development team can start building and deploying the application.
*   **Acceptance Criteria:**
    1.  A Git monorepo is created with `apps/web` and `packages/shared-types` using npm workspaces.
    2.  Vercel is linked for deployment of the `apps/web` (Next.js App Router).
    3.  `.env.local` is configured with Supabase connection strings from the PRD.
*   **Technical Context:** Next.js 14+ (App Router), Tailwind CSS, TypeScript.

### [1.2] Database Schema & RLS Foundation
*   **User Story:** As a Shop Owner, I want my data to be strictly isolated from other stores, so that my business information is secure.
*   **Acceptance Criteria:**
    1.  `profiles`, `stores`, and `memberships` tables created in Supabase.
    2.  PostgreSQL Row-Level Security (RLS) policies implemented on all tables using `store_id`.
    3.  A `current_store_id()` helper function created in the database for RLS.
*   **Technical Context:** Supabase, PostgreSQL, RLS.

### [1.3] Multi-tenant Auth & Sign-up Flow
*   **User Story:** As a new Shop Owner, I want to sign up and create my store profile in one step, so that I can quickly start using the system.
*   **Acceptance Criteria:**
    1.  Sign-up page handles Supabase Auth registration.
    2.  Post-registration flow automatically creates a `store` and a `membership` record with role `OWNER`.
    3.  User redirected to the dashboard upon successful setup.
*   **Technical Context:** Supabase Auth, Next.js Server Actions.

### [1.4] RBAC & Store Invitations
*   **User Story:** As a Shop Owner, I want to define roles like Manager or Cashier, so that I can control access to my store's data.
*   **Acceptance Criteria:**
    1.  `roles` enum created (OWNER, MANAGER, CASHIER).
    2.  `memberships` table enforces unique `user_id` + `store_id` pairs.
    3.  Middleware implemented to check roles for protected routes.
*   **Technical Context:** RBAC, Next.js Middleware.

### [1.5] API Foundation & Global Error Handling
*   **User Story:** As a Developer, I want a standardized way to handle API calls and errors, so that our application is robust and easy to maintain.
*   **Acceptance Criteria:**
    1.  `apiClient` wrapper implemented in `lib/api.ts` with error handling.
    2.  `withErrorHandler` HOC/Wrapper for API routes to return standard `ApiError` JSON.
    3.  Zod schemas used for all request body validation.
*   **Technical Context:** Zod, TypeScript, Fetch API.

# Epic 02: Scalability & Infrastructure Resilience

**Goal:** Enhance the platform's infrastructure to handle high concurrency, large user volumes, and computationally intensive tasks without degrading performance.

## Stories

### [2.1] Implement API Rate Limiting
*   **User Story:** As a System Administrator, I want to implement rate limiting for our API, so that we can protect our infrastructure from abuse and ensure fair usage for all tenants.
*   **Acceptance Criteria:**
    1.  Rate limiting middleware implemented using Upstash Redis or Vercel KV.
    2.  Customizable rate limits per store (e.g., 100 req/min).
    3.  Automated 429 Too Many Requests response with "Retry-After" header.
*   **Technical Context:** Next.js Middleware, Redis.

### [2.2] Connection Pooling (PgBouncer)
*   **User Story:** As a DevOps Engineer, I want to enforce connection pooling for our database, so that we can prevent connection exhaustion under high load.
*   **Acceptance Criteria:**
    1.  Supabase "Transaction Mode" (PgBouncer) enabled.
    2.  Application configured to connect through the pooler (Port 6543).
    3.  Verified stable database performance under simulated concurrent users.
*   **Technical Context:** Supabase, PgBouncer, Connection Management.

### [2.3] Background Processing (Inngest)
*   **User Story:** As a Developer, I want to offload heavy tasks to a background worker, so that the API remains responsive for the end users.
*   **Acceptance Criteria:**
    1.  Inngest or similar background job engine integrated.
    2.  Retry logic and failure monitoring configured.
    3.  A sample background task (e.g., Daily Sales Aggregation) implemented.
*   **Technical Context:** Inngest, Webhooks, Asynchronous Processing.

### [2.4] Database Read Replicas
*   **User Story:** As a Shop Owner, I want my reports and dashboards to be fast, so that I can analyze my business performance in real-time.
*   **Acceptance Criteria:**
    1.  Database client configured to support separate Read/Write connections.
    2.  Heavy analytical queries (e.g., Dashboard summaries) routed to a read-only replica.
    3.  Failover strategy documented.
*   **Technical Context:** PostgreSQL Replicas, Query Routing.

### [2.5] Global CDN & Edge Caching
*   **User Story:** As a Shop Manager, I want the application to load instantly regardless of my location, so that I can serve customers without delay.
*   **Acceptance Criteria:**
    1.  Static assets and public pages cached at the Edge via Vercel CDN.
    2.  `Cache-Control` headers optimized for all API responses.
    3.  P95 load times under 200ms globally.
*   **Technical Context:** Vercel, Edge Runtime, Caching Headers.

# Epic 10: Core Sales & POS Transactions

**Goal:** Provide a high-performance, resilient Point of Sale (POS) interface for processing retail transactions with support for multiple payment methods and real-time inventory updates.

**Delivered Scope Update:** Epic 10 now also includes a shared sales ledger experience with searchable list views, payment-aware transaction summaries, editable sale detail screens, and browser print support for transaction documents.

## Stories

### [10.1] Product Catalog Management
*   **User Story:** As a Shop Owner, I want to add and view products in my inventory, so that I can manage my stock and have items to sell in the POS.
*   **Acceptance Criteria:**
    1.  A "Products" dashboard screen exists to list all items.
    2.  A user can create a new product with Name, SKU, Price, and Initial Stock.
    3.  Data is saved to the `products` and `product_stocks` tables with proper tenant isolation.
*   **Technical Context:** Server Actions, Zod Validation, Supabase RLS.

### [10.2] POS Interface UI
*   **User Story:** As a Cashier, I want a fast, touch-friendly interface to select products and manage a cart, so that I can quickly ring up customers.
*   **Acceptance Criteria:**
    1.  A "Point of Sale" screen exists with a grid of products.
    2.  Clicking a product adds it to the cart (or increments quantity).
    3.  The cart displays line items, individual prices, and a calculated total.
    4.  The UI is responsive and optimized for tablet-sized screens.
*   **Technical Context:** React State (Zustand/Context), Tailwind Grid, Client Components.

### [10.3] Atomic Sale Transaction
*   **User Story:** As a Shop Owner, I want sales to automatically and safely deduct from my inventory, so that my stock levels are always perfectly accurate.
*   **Acceptance Criteria:**
    1.  A "Checkout" button triggers a backend transaction.
    2.  The backend securely verifies stock availability before processing.
    3.  A `sales` record and associated `sale_items` are created.
    4.  The `product_stocks` quantity is atomically decremented.
    5.  If stock is insufficient, the transaction rolls back and returns a clear error.
    6.  Sales appear in a searchable dashboard log with refund-aware status badges and quick access to view or edit the transaction.
*   **Technical Context:** PostgreSQL Functions/RPC, Database Transactions, Concurrency Control.

### [10.4] Advanced Payments (Split/Cards)
*   **User Story:** As a Cashier, I want to accept multiple forms of payment for a single sale (e.g., partial cash, partial bKash), so that I can accommodate customer preferences.
*   **Acceptance Criteria:**
    1.  The checkout modal allows specifying amounts for Cash, Card, and Mobile Money.
    2.  The sale record accurately reflects the split payment methods.
    3.  Change due is calculated correctly.
    4.  Sales detail and list views surface paid amount, payment method breakdowns, and printable receipt output.
*   **Technical Context:** UI State Management, Complex Form Validation.

# Epic 11: Sales Returns Management

**Goal:** Provide a reliable returns workflow that lets teams issue partial or full refunds, re-increment stock, and maintain a clear operational history through list, detail, edit, print, and delete flows.

# Epic 12: Sales Orders & Fulfillment

**Goal:** Support draft-to-delivery order management for non-immediate sales with order creation, editing, deposits, fulfillment state transitions, printable documents, and guarded stock deduction on delivery.

# Epic 13: Quotations & Conversion Workflow

**Goal:** Enable sales teams to create, revise, edit, print, delete, and convert quotations through a consistent dashboard workflow aligned with the Sales and Orders user experience.

## Epic 80: Customer Management & Segmentation

**Goal:** Provide a structured customer management foundation with rich customer profiles, reusable customer groups, and territory hierarchy management that all follow the same searchable dashboard list experience used across Sales.

**Delivered Scope Update:** Epic 80 now includes shared DataTable-based list views for Customers, Customer Groups, and Territories, aligning those operational pages with the Sales ledger UI pattern for search, sorting, exports, filters, and consistent row-level actions.

### Story Summary

### [80.1] Customer CRUD API & UI

* **User Story:** As a Shop Owner or Manager, I want to create, edit, and view rich customer profiles with segmentation context, so that I can maintain a structured customer database that supports downstream sales workflows.
* **Acceptance Criteria:**
    1. A "Customers" menu item and dashboard screen exists.
    2. The customer list surfaces code, type, group, territory, spend, segment, and registration date.
    3. Customer workflows remain connected to customer group and territory assignments.
* **Technical Context:** Next.js dashboard UI, shared DataTable component, customer/customer-group/territory APIs.

### [80.4] Customer Group CRUD

* **User Story:** As a Shop Owner or Manager, I want to define and manage Customer Groups, so that I can classify customers for targeted pricing, discounts, and reporting.
* **Acceptance Criteria:**
    1. A dedicated customer group management screen exists.
    2. The list view supports search and presents name, description, default discount, and customer count.
    3. Edit and delete actions are available from the list while preserving the inline form workflow.
* **Technical Context:** NestJS customer-group APIs, shared DataTable component, inline form workflow.

### [80.5] Territory CRUD

* **User Story:** As a Shop Owner or Manager, I want to define and manage Territories, so that I can assign customers to geographic regions for delivery planning, sales coverage, and reporting.
* **Acceptance Criteria:**
    1. A dedicated territory management screen exists.
    2. The list view surfaces hierarchy context through parent and level columns while keeping the flat API contract.
    3. Edit and delete actions remain available alongside the territory form workflow.
* **Technical Context:** NestJS territory APIs, shared DataTable component, parent-child hierarchy display.
