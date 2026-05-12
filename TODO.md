# TODO

Track all work here. Check off items as they're completed. Add new items as they're identified.

---

## CRITICAL — Blocking commercial launch

### Security
- [ ] Remove `.env` from git history and rotate all exposed secrets (SUPABASE_SERVICE_ROLE_KEY, payment credentials)
- [x] Ensure `.env` is in `.gitignore` and never committed again
- [ ] Add `helmet` middleware to NestJS app (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Implement CSRF protection (`@nestjs/csrf` or double-submit cookie pattern)
- [ ] Deploy rate limiting — Upstash Redis is wired in `.env.example` but not used in code
- [ ] Add input sanitization (beyond class-validator) to prevent XSS at API boundary
- [ ] Audit all endpoints for missing auth guards
- [ ] Implement audit logging table (who changed what, when — needed for billing disputes)

### Email & Notifications (nothing exists)
- [ ] Integrate email service (AWS SES, SendGrid, or Resend)
- [ ] Transactional emails: billing invoices, payment confirmations, payment failures
- [ ] Onboarding welcome email
- [ ] Password reset flow (no email = no self-service account recovery)
- [ ] User invitation emails (tenant owner inviting staff)
- [ ] Low-stock / reorder point alert emails
- [ ] Subscription expiry warnings (7 days and 1 day before)

### Infrastructure / Ops
- [ ] Upgrade Render plan (free tier has no SLA, cold starts, limited RAM)
- [ ] Set up staging environment (separate from prod)
- [ ] Configure automated database backups (daily minimum, point-in-time recovery)
- [ ] Verify PgBouncer connection pooling is correctly configured
- [ ] Add `/health` endpoint with DB connectivity check for Render's health probe
- [ ] Implement graceful shutdown in NestJS (SIGTERM → drain → exit)
- [ ] Write and test production deployment runbook

### Monitoring & Observability
- [ ] Integrate Sentry in backend and frontend
- [ ] Add structured logging (Winston or Pino) — replace bare Logger.debug calls
- [ ] Set up uptime monitoring (BetterStack or similar)
- [ ] Configure alerts for: error rate spikes, payment webhook failures, DB connection exhaustion

### Billing & Payments
- [ ] Implement dunning management (define what happens after PAST_DUE — auto-cancel after N days)
- [ ] Build payment retry logic for failed transactions
- [ ] Add refund processing flow
- [ ] Test all payment webhooks end-to-end in staging (SSL Wireless, bKash, Nagad IPN)
- [ ] Add idempotency keys to webhook handlers (prevent duplicate processing on retry)
- [ ] Audit `SubscriptionAccessGuard` — verify it correctly gates all premium features
- [ ] Build billing portal page (tenants view invoices and billing history)

---

## HIGH PRIORITY — Ship within first 2 weeks of launch

### Auth & Account Management
- [ ] Password reset flow (email-based expiring token)
- [ ] Email verification on signup
- [ ] Account lockout after N failed login attempts
- [ ] Session invalidation on password change
- [ ] Consider TOTP 2FA for OWNER role
- [ ] Implement refresh token rotation

### API Hardening
- [ ] Add API versioning (`/api/v1/`) before any external integrations are built
- [ ] Standardize response envelope (`{ data, meta, error }`) across all endpoints
- [ ] Enforce pagination on all list endpoints (unbounded queries will kill DB under load)
- [ ] Add Swagger/OpenAPI docs via `@nestjs/swagger`
- [ ] Add request ID header for distributed tracing

### Data & Compliance
- [ ] Implement soft deletes — current hard deletes break accounting record integrity
- [ ] Define and document data retention policy
- [ ] Encrypt sensitive fields at rest (NID, banking details if stored)
- [ ] GDPR/PDPA basics: privacy policy page, data deletion request flow, data export
- [ ] Terms of Service page
- [ ] Privacy Policy page

### Testing
- [ ] Verify 80% coverage threshold is actually met (no coverage reports in repo)
- [x] Fix 2 failing tests in warranty-claims service (TypeScript error: `warrantyClaim` model not recognized in transaction context) — regenerated Prisma client and added warranty-claims.service.spec.ts
- [ ] Add E2E tests for critical paths: signup → onboarding → POS sale → billing
- [ ] Add integration tests for payment webhook handlers
- [ ] Add load tests for POS endpoint (peak: multiple cashiers × multiple tenants)
- [ ] Verify GitHub Actions CI actually runs tests on every push

---

## IMPORTANT — First month after launch

### Marketing & Onboarding
- [ ] Build real marketing/landing page (current `page.tsx` is a placeholder)
- [ ] Pricing page with feature comparison table across all 4 tiers
- [ ] Onboarding wizard for new tenants (add store → add products → first sale)
- [ ] In-app contextual help / tooltips for complex features (COA, posting rules, stock takes)
- [ ] Demo/sandbox account for prospects to try before subscribing
- [ ] Video walkthroughs or screenshot tours of key workflows

### Localization
- [ ] Bangla (Bengali) language support — documented as market requirement in PRD, not built
- [ ] Verify consistent BDT currency formatting throughout UI
- [ ] Date format localization (BD convention)
- [ ] Bangla number formatting option

### Product Completeness
- [ ] Customer-facing invoice/receipt email after a sale
- [ ] Bulk product import via CSV/Excel
- [ ] Barcode scanning support in POS (hardware scanner input via keyboard wedge)
- [ ] Stockout guard — prevent selling items with zero stock
- [ ] Dashboard KPI widgets (revenue today, low stock count, pending orders)
- [ ] Proper 404 and error pages in frontend

### Performance
- [ ] Implement Redis caching for hot data (product catalog, active pricing) — Redis is provisioned but unused
- [ ] Switch large list endpoints to cursor-based pagination
- [ ] Run `EXPLAIN ANALYZE` on the 10 most frequent queries
- [ ] Add DB query timeout to prevent runaway queries
- [ ] Enable Next.js Image optimization for product images

---

## OPERATIONAL — Pre-launch or ongoing

### Business / Legal
- [ ] Terms of Service (finalized, linked from UI)
- [ ] Privacy Policy (finalized, linked from UI)
- [ ] Refund / cancellation policy
- [ ] Define and publish SLA commitments
- [ ] Verify VAT/tax handling in invoices meets Bangladesh NBR requirements

### Support
- [ ] Set up support email or ticket system before first paying customer
- [ ] Status page (statuspage.io or similar)
- [ ] In-app feedback mechanism
- [ ] Basic documentation / help center (Notion, GitBook, or Docs)

### DevOps & Reliability
- [ ] Set up log aggregation (Logtail, Papertrail, or CloudWatch)
- [ ] Review DB indexes after first real load (`pg_stat_user_indexes`)
- [ ] Configure Render auto-scaling or upgrade to a plan that supports it
- [ ] Disaster recovery drill — practice restoring from backup
- [ ] Add dependency vulnerability scanning to CI (`npm audit` or Dependabot)
- [ ] Establish secret rotation schedule (quarterly minimum)

### Mobile App
- [ ] Decide: launch web-first and defer Flutter, or build Flutter MVP in parallel
- [ ] If deferring: remove mobile references from marketing materials
- [ ] If deferring near-term: evaluate PWA wrapper as stopgap (Next.js supports this)

---

## ROADMAP — Post-launch features

- [ ] E-commerce storefront (Standard/Premium tier feature per PRD)
- [ ] Manufacturing / BOM module (Premium tier)
- [ ] Delivery / fulfillment management
- [ ] Offline-capable POS (service worker + IndexedDB sync)
- [ ] Multi-branch consolidated reporting
- [ ] Third-party accounting exports (Tally/QuickBooks format)
- [ ] Public API + API key management for enterprise customers
- [ ] White-label option

---

## COMPLETED

- [x] Ensure `.env` is in `.gitignore` — confirmed present on line 32 of `.gitignore` — done 2026-05-09
