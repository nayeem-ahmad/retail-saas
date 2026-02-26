# Epic 04: Main Executive Dashboard (Landing)

### Epic Goal
Provide store owners and executives with a high-level, real-time overview of the entire business's health immediately upon logging in.

### Epic Description
The Main Dashboard is the "cockpit" of the SaaS platform. It doesn't just show data; it highlights trends, alerts, and actionable tasks (e.g., "5 low stock items", "2 pending deliveries").

**Key Components:**
*   **KPI Summary Tiles:** Total Sales (Today), Net Profit, Total Orders, Active Deliveries.
*   **Quick Action Buttons:** "New Sale", "Add Stock", "Record Expense".
*   **Consolidated Alerts:** Low stock notifications, pending purchase returns, and leave approvals.
*   **Revenue Trend Graph:** Weekly/Monthly sales vs. expenses visualization.

**Stories:**
1. **Story 1: Global Aggregation API** - A high-performance endpoint that fetches summary data from Sales, Inventory, and Accounting modules.
2. **Story 2: Interactive Dashboard UI** - The landing page layout with customizable widgets and real-time data refreshes.
3. **Story 3: Critical Alert Notification Center** - A "Tasks to Do" widget that lists items requiring immediate attention across all modules.
