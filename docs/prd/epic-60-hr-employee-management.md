# Epic 60: HR & Employee Management

**Goal:** Establish a simple, unified structure for managing the people in a small retail business, from organizational hierarchy to digital employee records.

---

**Story 1: Organizational Structure Setup**
*   **As a** Shop Owner, **I want to** define my departments (e.g., Sales, Inventory) and designations (e.g., Cashier, Manager), **so that** I can organize my staff according to my business needs.
*   **Acceptance Criteria:**
    1.  A simple interface to add/edit/delete Departments and Designations.
    2.  The system prevents deleting designations currently assigned to employees.

---

**Story 2: Digital Employee Profiles**
*   **As a** Store Manager, **I want to** maintain a central digital record for each employee, **so that** I have their contact info, joining date, and NID on file.
*   **Acceptance Criteria:**
    1.  A "Staff Directory" showing all active and inactive employees.
    2.  A profile form capturing: Name, Email, Phone, NID, Date of Joining, Department, and Designation.
    3.  Ability to upload a profile photo and relevant documents (placeholders).

---

**Story 3: System Access Control**
*   **As a** Shop Owner, **I want to** link an employee record to a system user account, **so that** I can control who can log in to the POS or the dashboard.
*   **Acceptance Criteria:**
    1.  An admin can link an employee profile to a specific `User` (RBAC).
    2.  The system identifies the employee's role based on their designation for default permissions.
