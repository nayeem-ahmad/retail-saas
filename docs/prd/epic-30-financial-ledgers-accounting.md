# Epic 30: Financial Ledgers & Core Accounting

### Epic Goal
Implement a robust double-entry accounting system that tracks every monetary transaction within the business through standardized vouchers and ledgers.

### Epic Description
This epic is the financial core of the platform. It enables store owners to move beyond simple sales tracking to full financial management, including cash flow, bank reconciliations, and internal fund transfers.

**Standard Voucher Types:**
*   **Cash Payment / Receive:** For all transactions involving physical cash.
*   **Bank Payment / Receive:** For transactions via bank transfer or mobile wallets (bKash, etc.).
*   **Fund Transfer:** For internal movements between Cash and Bank accounts.
*   **Journal Voucher:** For general adjustments and non-cash/bank entries.

**Key Reports:**
*   **General Ledger:** A detailed transaction history for any specific account (e.g., "Cash in Hand"), showing a running balance.
*   **Journal Report:** A chronological list of all vouchers with their full multi-row details.

**Stories:**
1. **Story 1: Chart of Accounts (COA) Setup** - Interface to define Asset, Liability, Equity, Revenue, and Expense accounts.
2. **Story 2: Multi-Row Voucher Entry** - A standardized entry form where users can select accounts and enter debits/credits. Must ensure the voucher balances (Debits = Credits) before saving.
3. **Story 3: Automated Voucher Numbering** - Sequential, tenant-specific voucher numbers (e.g., CP-001, BR-052).
4. **Story 4: Real-time Ledger Generation** - API logic to calculate running balances for any account across a date range.
5. **Story 5: Journal Viewer** - A comprehensive list view of all vouchers with advanced filtering by type and date.
