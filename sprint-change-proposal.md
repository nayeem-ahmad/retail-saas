# Sprint Change Proposal: Scalability & Infrastructure Upgrade

## 1. Analysis Summary
*   **Issue:** The initial MVP architecture relied heavily on serverless auto-scaling but lacked protections for database concurrency, traffic spikes, and heavy synchronous processing. This poses a high risk of system failure (timeouts, DB locks) if "a lot of new users" sign up.
*   **Impact:**
    *   **Database:** Single point of failure without connection pooling or read replicas.
    *   **API:** Vulnerable to abuse/DDoS due to "TBD" rate limits.
    *   **UX:** Slow dashboards due to synchronous on-demand aggregation.
*   **Recommended Path:** **Direct Adjustment / Integration.** We will integrate industry-standard scalability patterns (Rate Limiting, Connection Pooling, Job Queues) into the existing architecture *now*, rather than waiting for a crash. This requires a new Epic but does not invalidate existing work.

## 2. Specific Proposed Edits

### A. Architecture Documentation
*   **`docs/architecture.md`**: Added a new "Scalability & High Availability" section detailing strategies for Database Scalability (Pooling, Replicas), Traffic Management (Rate Limiting), and Async Processing (Job Queues).
*   **`docs/architecture/security-and-performance.md`**: Expanded the "Security and Performance" section with detailed specs for these strategies, including technologies (PgBouncer, Upstash/Redis, Inngest/BullMQ).
*   **`docs/architecture/monitoring-and-observability.md`**: Added "Job Queue Metrics" to the Backend Performance Metrics list.

### B. Product Requirements (PRD)
*   **`docs/prd/epic-10-scalability-infrastructure.md`**: Created a new Epic to track this work.
    *   **Story 10.1:** Implement API Rate Limiting.
    *   **Story 10.2:** Configure Database Connection Pooling.
    *   **Story 10.3:** Implement Background Job Infrastructure.
    *   **Story 10.4:** Offload Sales Dashboard Aggregation.
    *   **Story 10.5:** Establish Read Replica Connection Strategy.
*   **`docs/prd/epic-list.md`**: Updated to include Epic 10.

## 3. Next Steps
1.  **Approve** this proposal.
2.  **Prioritize** Epic 10 alongside current feature work (recommended to tackle Story 10.1 and 10.2 immediately).
3.  **Handoff** to Dev Agent to begin implementation of Story 10.1 (Rate Limiting).
