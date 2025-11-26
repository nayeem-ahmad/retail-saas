# Epic 10: Scalability & Infrastructure Resilience

## Goal
Enhance the platform's infrastructure to handle high concurrency, large user volumes, and computationally intensive tasks without degrading performance. This epic focuses on "serving many users efficiently" by implementing rate limiting, connection pooling, and background processing.

## Context
As the platform grows, the initial MVP architecture (direct synchronous API calls, single database connection) will face bottlenecks. A "lot of new users" signing up and viewing dashboards will cause database lockups and API timeouts. This epic proactively implements the necessary safeguards.

## User Stories

### Story 10.1: Implement API Rate Limiting
**As a** DevOps Engineer,
**I want** to implement application-level rate limiting for all API routes,
**So that** a single user or malicious script cannot overwhelm the system with requests.

**Acceptance Criteria:**
*   [ ] Middleware (e.g., using Upstash Redis or Vercel KV) intercepts all API requests.
*   [ ] Requests are limited to a configurable threshold (e.g., 100 requests per minute per IP/User).
*   [ ] Exceeding the limit returns a `429 Too Many Requests` status.
*   [ ] Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`) are included in responses.

### Story 10.2: Configure Database Connection Pooling
**As a** Backend Developer,
**I want** to configure the application to use a connection pooler (PgBouncer),
**So that** the database does not run out of connections during traffic spikes.

**Acceptance Criteria:**
*   [ ] Production database connection string is updated to use the Supabase Transaction Mode (PgBouncer) port (6543).
*   [ ] Local development environment is configured to mimic this behavior or verified to work safely.
*   [ ] Documentation is updated to reflect the required connection string format.

### Story 10.3: Implement Background Job Infrastructure
**As a** Backend Developer,
**I want** to set up a background job processing system (e.g., Inngest or BullMQ),
**So that** heavy tasks like data aggregation and email sending do not block the API response.

**Acceptance Criteria:**
*   [ ] Job queue library is installed and configured in the project.
*   [ ] A "Hello World" background job can be triggered via an API call and processed asynchronously.
*   [ ] Job dashboard or logging is set up to monitor job status (success/failure).

### Story 10.4: Offload Sales Dashboard Aggregation
**As a** Store Owner,
**I want** my sales dashboard to load instantly,
**So that** I don't have to wait for complex calculations every time I refresh the page.

**Acceptance Criteria:**
*   [ ] Create a background job that runs periodically (e.g., every 10 minutes) or on-demand (via webhook) to calculate daily sales summaries.
*   [ ] Store the pre-calculated results in a cache or dedicated "analytics" table.
*   [ ] Update the `GET /api/dashboard/sales-summary` endpoint to read from this pre-calculated source instead of running a raw aggregation query on the `sales` table.

### Story 10.5: Establish Read Replica Connection Strategy
**As a** System Architect,
**I want** to define a strategy for connecting to database read replicas,
**So that** we can easily switch heavy read operations to a replica in the future.

**Acceptance Criteria:**
*   [ ] Define a helper function or configuration in the Database Client to allow selecting a "read-only" connection.
*   [ ] Document the process for enabling a Read Replica in Supabase and updating the environment variables.

## Metrics for Success
*   **P95 API Latency:** Remains under 200ms even during load tests simulating 1000 concurrent users.
*   **Database Connection Errors:** Zero "too many clients" errors during peak traffic.
*   **Job Failure Rate:** Less than 0.1% of background jobs fail.
