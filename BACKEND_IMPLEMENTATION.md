# Estate Marketplace Backend Implementation Brief

**Status:** Backend foundation in progress  
**Product:** Estate Marketplace  
**Pilot estate:** Pavilion Court, Membley Estate  
**Audience:** Backend implementers and technical reviewers  
**API prefix proposal:** `/api/v1`

This document turns the project brief and current UI workflows into a backend starting point. It is not an authorization to choose unresolved product or financial policies. Sections marked **Open decision** should be settled before implementing the affected workflow.

## 1. Product and implementation context

The frontend is a React/Vite preview. Most records and actions currently live in browser memory; logo and theme previews use browser storage. There is no production sign-in, shared database, file service, notification service, or payment integration yet. Backend APIs must become the source of truth before the UI reports a durable change, verified payment, or permission update.

The confirmed backend stack is Node.js with Express, PostgreSQL, and Prisma. Server-side role checks and a modular feature structure are required. Hosting, object storage, and notification providers remain to be selected.

The pilot is Pavilion Court, while the data model should carry `estate_id` from the start to avoid a later tenant migration. The pilot uses one platform Super Admin account; there is no separate Estate Admin account. The Super Admin selects an estate before using estate operations.

## 2. Roles and authorization

Enforce permissions in the API and database access layer. Frontend route hiding is not an access control.

| Actor | Backend scope |
|---|---|
| Resident | Use resident capabilities after estate approval: browse, buy, list items, request or make contributions, view notices, vote where eligible, and report issues. |
| Estate Admin | Not used for the single-admin pilot. Estate operations are authorized to the Super Admin in a selected estate context. |
| Committee Member | Resident capabilities plus campaign and fund-release oversight and voting. Admin and committee are separate estate roles; one user must not hold both in the same estate under the project brief. |
| Super Admin | Platform-level user and estate lifecycle management, access suspension for payment, support ticket review/comments, platform configuration, and audit visibility. For the pilot, also performs estate operations after selecting the target estate. |
| Account Holder | Proposed finance role for performing approved fund transfers and attaching evidence. This role and its permissions are not yet confirmed. |

Model a person's estate membership separately from their platform account. Committee membership is granted through an approved election workflow, not by arbitrary client input. The bootstrap creates only a platform Super Admin, with no estate membership. Estate Admin membership values are retained for existing data compatibility but do not authorize pilot admin routes.

For every request, derive the actor from the authenticated session. Confirm the actor's active estate membership, role, estate access status, and resource estate before reading or mutating data. Reject cross-estate IDs even when they are valid UUIDs.

## 3. Core data model

Use UUID primary keys, `timestamptz` timestamps, integer minor units or `numeric` for money (never floating point), explicit foreign keys, and database constraints for invariants. Use soft deletion or lifecycle statuses for records with history or financial references.

### Platform and identity

- **Estate:** `id`, `name`, `location`, `logo_media_id`, `billing_status`, `access_status` (`active`, `suspended`, `archived`), timestamps, and audit actor IDs.
- **User:** normalized unique email, phone, password hash, account status, `must_reset_password`, verified contact timestamps, and timestamps. Do not store a one-time password in plain text.
- **EstateMembership:** `estate_id`, `user_id`, estate role, status, approval metadata. Enforce one active household-holder membership per unit. Enforce the Admin/Committee separation per estate.
- **Unit / EstateLocation:** estate, block or street label, unit/house identifier, status. Preserve units referenced by old resident, issue, listing, and payment records.
- **Household:** estate, unit, representative membership, occupancy, household size, verification state, next-of-kin contact fields, and lifecycle timestamps. Add a unique constraint preventing more than one active or pending household representative for a unit.
- **Invitation / RegistrationRequest:** secure, expiring self-registration token or request; submitted household details; review outcome and reviewer. Make invitation tokens single-use and store only a token hash.
- **PasswordChallenge:** hashed OTP/reset token, expiry, attempt count, use timestamp, and purpose. Apply rate limits and one-time use.

### Estate activity

- **Listing:** estate, owner membership, title, description, category, condition, price, quantity, status (`pending_review`, `approved`, `rejected`, `removed`, `sold`), selected payment methods, payment details, timestamps, moderation actor and reason.
- **ListingImage:** listing, object-storage key, order, dimensions, content type, size, and scan state. Require 3–6 valid images before submission; enforce count and estate ownership on the server.
- **MarketplaceOrder / OrderLine:** buyer, listing, quantity, unit price snapshot, total, payment choice, payment state, fulfilment state, seller/estate, and immutable purchase snapshot. Use integer money and database transactions for stock.
- **MarketplacePayment:** order, method, provider/reference, amount, initiation and confirmation state, bank proof metadata if used, reconciliation status. A pending payment must not mark the listing sold.
- **Campaign:** estate, author, beneficiary type (`estate` or `resident`), target, deadline, purpose, status, submitted version, and progress entries.
- **CampaignVersion:** immutable submitted snapshots for resubmissions so existing votes and audit evidence stay understandable.
- **CampaignVote:** campaign/version, committee membership, decision, rejection reason, timestamp. Unique vote per eligible member per version; enforce eligibility and own-campaign conflict rules on the server.
- **HouseholdAssessment:** live estate-benefiting campaign, household, assigned amount, currency, and status. The amount is fixed per household for that campaign.
- **ContributionPayment:** assessment or resident-beneficiary campaign, payer, amount, selected prompt phone, payment provider request, provider transaction ID, status, timestamps. Store every partial payment independently; derive paid total and balance from confirmed payments.
- **FundRelease / ReleaseVote / Disbursement:** separate auditable release request and votes, followed by account-holder transfer reference and proof. Enforce approved amount against available confirmed funds.
- **Notice:** estate, author, category, title, body, display timing, publication state, and timestamps. Preserve delete/unpublish history through status changes or tombstones.
- **IssueReport / IssueUpdate:** reporter, estate, location, category, description, status, and append-only resident-facing updates. Every status change requires a non-empty report explaining the change and next step.
- **SupportTicket / SupportComment:** platform support data, requester, estate if applicable, subject, detailed description, priority, status, internal comment visibility, and timestamps.
- **AuditEvent:** append-only actor, estate/platform scope, action, entity type and ID, timestamp, request ID, and safe metadata. Never include passwords, OTPs, full payment credentials, or unnecessary personal details.
- **OutboxEvent / Notification:** reliable post-commit notifications for email/SMS/push. Store delivery attempts and provider result without making notification delivery part of the database transaction.

## 4. API surface proposal

Use JSON, consistent validation/error envelopes, pagination, and versioned routes. Return `401` for unauthenticated, `403` for insufficient role, `404` for missing/out-of-scope records, `409` for state conflicts or duplicate household registrations, and `422` for field/domain validation errors. Include a request/correlation ID in responses and logs.

### Authentication and household onboarding

- `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` (if refresh tokens are selected), `POST /auth/password/complete-setup`, `POST /auth/password/forgot`, `POST /auth/password/reset`.
- `POST /estates/:estateId/registration-invitations` (Super Admin in selected estate), `GET /register/:token` (public, read-only invite validation), `POST /register/:token` (public, rate-limited submission).
- `GET /admin/registration-requests`, `POST /admin/registration-requests/:id/approve`, `POST /admin/registration-requests/:id/decline`.
- `GET /admin/households`, `POST /admin/households`, `GET /admin/households/:id`, `PATCH /admin/households/:id`, `DELETE /admin/households/:id` (prefer lifecycle removal and preserve finance history), `POST /admin/households/:id/password-reset`, and a separately audited next-of-kin promotion action.
- Registration accepts one representative per household, household member count, unit/block or street, occupancy, and required next-of-kin details. Detect duplicate household registration on the server and return a useful conflict.

When an admin provisions a resident login, generate an expiring one-time credential/challenge and send it through the configured delivery service. Require password setup on first successful use. A requested admin reset must invalidate prior challenges/sessions and notify the resident without exposing a reusable password to staff. Never return OTP values in API responses or logs.

### Estate and platform administration

- Super Admin: `GET/POST /platform/estates`, `GET/PATCH/DELETE /platform/estates/:id`, `POST /platform/estates/:id/suspend`, `POST /platform/estates/:id/restore`; equivalent `/platform/users` CRUD and access revoke/restore endpoints.
- Super Admin in selected estate: `GET/POST /estate/locations`, `PATCH/DELETE /estate/locations/:id`. Block deletion while referenced; mark inactive instead.
- User/estate deletion should normally archive or deactivate, revoke sessions, and preserve financial/audit history. Suspension for nonpayment must block estate-member access while preserving records and Super Admin support/audit access.
- `GET /platform/support-tickets`, `GET /platform/support-tickets/:id`, `PATCH /platform/support-tickets/:id`, `POST /platform/support-tickets/:id/comments`.
- `GET /platform/audit-events` (read-only, filterable, paginated).

### Estate operations and community workflows

- Marketplace: `GET/POST /estate/listings`, `GET/PATCH/DELETE /estate/listings/:id`, `POST /estate/listings/:id/submit`, Super Admin `POST .../:id/approve` or `/reject`, and resident `POST /estate/listings/:id/flags`.
- Orders: `POST /estate/orders`, `GET /estate/orders`, `GET /estate/orders/:id`, and explicit payment initiation/reconciliation routes. Snapshot price and seller payment instructions at order creation so later listing edits do not alter an existing order.
- Notices: `GET /estate/notices`, `POST /estate/notices`, `GET /estate/notices/:id`, `PATCH /estate/notices/:id`, and `DELETE /estate/notices/:id` (soft delete/unpublish, audited). Publish notices only to the estate they belong to.
- Issues: `GET/POST /estate/issues`, `GET /estate/issues/:id`, `POST /estate/issues/:id/updates` (Super Admin in selected estate), and `POST /estate/issues/:id/comments` only if resident comments are later approved. Status and resident update should commit atomically.
- Elections: Super Admin in selected estate `POST /estate/elections`; residents `GET /estate/elections`, `POST /estate/elections/:id/votes`; Super Admin closes election and records winner. Enforce one eligible vote per household/user and write the Committee role grant in the same transaction as election finalization.
- Campaigns: `GET/POST /estate/campaigns`, `GET/PATCH /estate/campaigns/:id`, submit/resubmit endpoints, committee vote endpoint, progress update endpoint, and resident contribution history.
- Assessments and contributions: show assigned amount, confirmed paid amount, and balance; accept partial amounts. Prompt a registered phone or a resident-supplied phone and store the selected number and amount as an initiation request.
- Fund releases: separate requests, votes, and transfer confirmation/proof endpoints once the Account Holder role and release rules are agreed.

All list endpoints should support bounded `limit`/`cursor` (or `page`), stable sorting, and filters. Use a default page size of 10 to match the current UI and cap the maximum. Do not accept arbitrary sort expressions or unbounded page sizes.

## 5. Payment and transaction integrity

There are two distinct payment workflows; do not treat displayed instructions or a successful prompt request as a settled payment.

### Marketplace purchases

- A listing can offer M-Pesa, bank transfer, or both. Store the seller's selected M-Pesa receive mode and number/paybill/till/reference, or bank name/account holder/account number/optional branch. Validate the details required for the selected mode.
- On checkout, create a pending order and payment attempt. For Daraja STK push, record request IDs and only mark paid after a verified callback/reconciliation. For manual bank transfer, collect a bank reference and optional receipt, then require authorized verification. Never trust a client-supplied `paid` status.
- On confirmed payment, atomically decrement stock and transition the order/listing. Protect against overselling with row locks or conditional updates. Define reservation expiry and cancellation behavior before production.
- Do not store card data. Card is not an allowed marketplace payment mode in the current product requirement.

### Campaign giving

- Contributions and fundraisers share one resident payment area, but retain beneficiary-specific behavior. Estate-benefiting campaigns assess a constant amount per household; resident-benefiting fundraisers accept voluntary amounts.
- Accept partial payments, keep an immutable payment record for each attempt/confirmation, and calculate the remaining household balance from confirmed payments only.
- Allow a resident to choose the registered phone or enter another permitted phone for the M-Pesa prompt. Record the phone, amount, campaign, estate, provider checkout request, provider transaction ID, and state.
- Verify Daraja callbacks using provider-supported controls, validate amount/reference/checkout identity, and make callback processing idempotent. Store raw callback payloads in restricted storage for reconciliation, with secrets and unnecessary personal data removed from operational logs.
- A payment-provider timeout has an uncertain outcome: check provider status before retrying to avoid duplicate prompts/charges. Keep pending, failed, reversed, and confirmed states distinct.

No payment provider credentials or live integration are part of the current frontend. Use sandbox credentials and callbacks in a separate environment; never commit credentials to the repository.

## 6. Campaign and governance invariants

Implement the project brief's agreed workflow inside transactions:

1. Estate Admin submits a campaign for committee review; preserve the submitted campaign version.
2. Committee member votes once per version, can change the vote until the campaign becomes Live, must give a reason to reject, and cannot vote on their own campaign.
3. Campaign goes Live at 3 approvals. It is rejected when `ceil(committee_size / 2)` eligible rejections are reached; whichever threshold is reached first decides.
4. Record every vote and state transition in the audit trail. A resubmission starts a new version and does not rewrite prior votes.
5. The Admin can report campaign progress after committee approval. Payment totals are computed from confirmed transactions, not UI-submitted totals.

The brief labels a frozen rejection threshold and blocking submission with fewer than three eligible voters as proposed. Treat both as **Open decision** until approved. Fund-release policy is also partly proposed and should be confirmed before implementing releases.

## 7. File and media handling

Use private object storage with short-lived signed uploads/downloads or server-mediated uploads. Validate MIME type from file content, size, image dimensions, extension, ownership, and count on the server. Do not trust browser `accept` attributes. Limit estate logos to the agreed supported image types and size; listing images must be 3–6. Keep unapproved marketplace images inaccessible to resident browse endpoints. Scan uploads where the chosen service supports it. Store object keys and metadata in PostgreSQL, not large base64 images.

## 8. Security, privacy, and reliability

- Use a maintained password hashing scheme (Argon2id or bcrypt with a reviewed work factor); add login and OTP rate limits, lockout/backoff, expiry, one-time use, and generic account-recovery responses.
- Choose a secure session design. Prefer `HttpOnly`, `Secure`, `SameSite` cookies with CSRF protection for browser sessions, or document the threat model and refresh-token rotation if using JWTs. Revoke sessions after password resets, user removal, estate suspension, or role changes.
- Validate request bodies with a schema library, reject unknown privileged fields, and derive estate/user IDs and state transitions server-side.
- Use TLS, secret management, least-privilege database and storage credentials, backups with restore drills, and environment separation (local, test, staging, production).
- Apply database transactions to approvals, election finalization, order settlement, contribution callback processing, and releases. Add unique constraints/idempotency keys to prevent duplicate requests and webhook events.
- Keep audit events append-only and separate from normal edit/delete APIs. Include before/after summaries for important changes without copying sensitive fields.
- Protect household membership, phone, next-of-kin, issue attachments, and payment data with least-privilege access and retention rules. Define retention/deletion obligations before pilot launch.
- Add structured logs, provider callback monitoring, payment reconciliation, health/readiness endpoints, backups, and alerting. Do not log passwords, OTPs, session tokens, or full callback secrets.

## 9. Suggested backend module structure

```text
server/
  src/
    app.ts
    config/
    middleware/       # authentication, estate scope, authorization, validation, errors
    modules/
      auth/
      platform/       # estates, platform users, support, settings
      households/     # registrations, memberships, locations, next of kin
      marketplace/    # listings, media, moderation, orders
      campaigns/      # versions, votes, progress, assessments
      payments/       # Daraja, bank verification, callbacks, reconciliation
      releases/
      notices/
      issues/
      elections/
      notifications/
      audit/
    db/
    storage/
    jobs/             # outbox delivery, expiry, reconciliation
  prisma/             # schema and migrations if Prisma is selected
  tests/
```

Keep route handlers thin: parse/validate input, authenticate and authorize, call domain services, commit data, then return a DTO. Keep provider integrations behind adapters so Daraja/email/SMS can be mocked and changed without embedding provider logic in routes.

## 10. Delivery phases

### Phase 0 — Decisions and foundation

- Confirm final backend framework, ORM, hosting, email/SMS provider, session strategy, media provider, and secrets management.
- Resolve account holder role and authority, marketplace bank-transfer verification, Daraja flow and environment, campaign shortfall/refund rules, resident-list verification source, retention policy, estate billing/suspension behavior, and remaining campaign-vote proposals.
- Establish migrations, API error conventions, audit writer, auth/session foundation, tenant-scoping helpers, CI, test DB, and local seed for Pavilion Court.

### Phase 1 — Accounts and estate operations

- Estate/user CRUD, block/street/unit records, household self-registration, approval/decline, one-time login setup/reset, notices CRUD, issues with required progress reports, and support ticket comments under the single Super Admin model.
- Connect React pages to APIs; remove browser-only authority for these records.

### Phase 2 — Marketplace

- Listing media, 3–6 image validation, moderation, M-Pesa/bank instructions, orders, stock consistency, manual transfer verification, and Daraja sandbox payment flow.

### Phase 3 — Elections and campaign giving

- Elections and Committee grants, campaign submission/versioning/votes, estate assessments, partial contributions, provider callbacks, and reconciliation reports.

### Phase 4 — Releases and operations hardening

- Approved fund releases and disbursement evidence after policy decisions; notification outbox, production monitoring, restore drills, access review, and pilot rollout.

## 11. Acceptance criteria for the backend MVP

- An unverified account cannot use resident services; estate membership and estate suspension are checked on every protected request.
- One active or pending representative is permitted per estate household/unit; Admin decisions are authorized and audited.
- Admin-created resident credentials are one-time, expiring, never returned in plaintext, and require password setup at first login.
- Super Admin can manage platform estates and users, suspend/restore estate access, read/comment on support tickets, and perform estate governance operations in a selected estate.
- Super Admin can create/edit/delete notices; changes are scoped to the selected estate and deletion retains audit/history.
- Every issue status change includes a resident-facing update in the same transaction.
- Marketplace accepts M-Pesa and/or bank transfer only; required seller details validate, and residents see the chosen method's instructions. Orders are not paid until verified.
- Listing image count is enforced as 3–6 by the API, and listing moderation controls resident visibility.
- Each campaign vote follows the agreed thresholds, eligibility, rejection-reason, vote-change, and own-campaign rules; all transitions are auditable.
- Partial contributions reconcile to provider-confirmed payments and produce an accurate household balance without duplicates.
- Pagination, field validation, consistent errors, audit trails, and tenant-isolation checks are present on all relevant endpoints.

## 12. Open decisions to preserve

Keep these questions open until the product owner resolves them; do not hard-code assumptions into payment or authorization policy:

1. Marketplace fees/commission. Escrow is required; fee/commission policy remains open.
2. Who legally holds estate/campaign money and whether the Account Holder role is adopted.
3. Marketplace bank transfer: seller account direct, platform/estate account, and who verifies payment. Buyer-submitted transfer transaction ID/code is the proof reference.
4. M-Pesa product flow for marketplace purchases versus contribution prompts, including Daraja account and reference strategy.
5. Campaign outcome below target: proceed, refund, or reallocate. Confirmed: proceed.
6. Resident verification source of truth and the Admin's review evidence. Confirmed: Admin review.
7. Fund-release requester, voting conflict rules, release threshold details, and account-holder evidence/confirmation. - Release threshold details and account holder confirmation (may be transaction code)
8. Committee size changes during an open vote, frozen threshold behavior, and minimum eligible voters.
9. Estate subscription/payment grace period, suspension timing, restore process, and data handling after estate closure. -to be worked on future
10. Data retention, deletion requests, notification channels, and privacy/legal review for resident, next-of-kin, and financial data.
