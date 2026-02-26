# Epic 42: Discrepancy Entry & Stock Take

### Epic Goal
Enable periodic physical stock-taking to reconcile system numbers with actual on-hand quantities, documenting any discrepancies.

### Epic Description
This is a critical auditing feature that allows store managers to "correct" the system's stock level based on a physical count.

**Stories:**
1. **Story 1: Stock-Take Session Manager** - Start a session for a specific warehouse to perform a physical count.
2. **Story 2: Bulk Discrepancy Entry** - Fast interface to enter actual counts and automatically calculate the discrepancy (`system_count - actual_count`).
3. **Story 3: Discrepancy Approval** - Manager-only approval for reconciling large stock corrections.
