# Epic 61: Attendance & Leave Management

**Goal:** Provide a lightweight mechanism for tracking staff presence and managing leave requests without complex hardware or processes.

---

**Story 1: POS-Integrated Attendance**
*   **As a** Cashier, **I want to** clock-in and clock-out directly from the POS interface, **so that** my work hours are automatically logged without needing a separate system.
*   **Acceptance Criteria:**
    1.  A "Clock In/Out" toggle or button is accessible on the POS login or main screen.
    2.  The system logs the exact timestamp and the terminal ID for each attendance event.
    3.  A manager can manually adjust logs in case of missed entries.

---

**Story 2: Simple Shift & Work Hours**
*   **As a** Store Manager, **I want to** define standard work hours and view attendance logs, **so that** I can track punctuality and total hours worked per employee.
*   **Acceptance Criteria:**
    1.  Basic "Shift" definition (Start Time, End Time) for different roles.
    2.  A daily attendance report showing who is "Present", "Late", or "Absent".
    3.  Automatic calculation of daily "Working Hours" based on clock-in/out logs.

---

**Story 3: Integrated Leave Management**
*   **As an** Employee, **I want to** submit a digital leave request, and **As a** Manager, **I want to** approve it, **so that** our leave records are always up-to-date and transparent.
*   **Acceptance Criteria:**
    1.  A simple form for employees to request leave with "Reason" and "Dates".
    2.  Managers receive an in-app notification for pending leave requests.
    3.  The system maintains a "Leave Balance" for each employee (Sick, Casual, Earned).
    4.  Approved leave is automatically reflected in the attendance report as "On Leave".
