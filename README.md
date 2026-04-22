# Shoptimity License Management Platform

Production-ready product and technical specification for the license system powering Shoptimity.

Primary site: https://shoptimity.com

## 1. Project Summary

Shoptimity License Management Platform extends the Shoptimity website with a complete purchase-to-license lifecycle.

It allows users to:

- Purchase license slots
- Assign and manage Shopify domains
- Access premium theme templates after authentication
- View payment and account history

## 2. Scope

### In Scope

- License purchase and provisioning
- Permanent one-time licenses (no recurring renewal cycle)
- Domain assignment CRUD under license slot limits
- Stripe checkout and webhook-based payment confirmation
- Email-based authentication (magic link, optional credentials fallback)
- Queue-based email delivery and retry handling
- Protected dashboard pages for post-purchase management
- Admin panel with full records visibility (users, payments, licenses, domains, manage templates)

## 3. Tech Stack

### Framework and Runtime

- **Next.js 16** (App Router) — fullstack framework for pages, API routes, server actions, and middleware
- **React 19** — UI rendering (ships with Next.js 16)
- **TypeScript** — strict mode across the entire codebase

### Database and ORM

- **PostgreSQL** — self-hosted or managed, pure Postgres (no Neon, Supabase, or serverless proxies)
- **Drizzle ORM** — schema definitions, typed queries, migrations via `drizzle-kit`

### Authentication

- **Custom magic link implementation** — built on top of the `auth_tokens` table; no external auth library required
- **Optional credentials fallback** — bcrypt-based password hashing when needed
- **Session management** — encrypted HTTP-only cookies using `jose` for JWT signing/verification

### Payments

- **Stripe** — Checkout Sessions for payment, webhooks for server-side confirmation
- **stripe** (Node.js SDK) — server-side Stripe API calls

### Email

- **React Email** — component-based email template authoring
- **Nodemailer** — SMTP transport for sending emails
- No third-party email SaaS (SendGrid, Resend, etc.) — direct SMTP connection

### Background Jobs / Queue

- **pg-boss** — PostgreSQL-backed job queue for all async work
- Runs on the same Postgres instance as the application database (no Redis dependency)
- Handles: email delivery, license metadata JSON generation, and any future long-running tasks

### UI and Styling

- **Tailwind CSS 4** — utility-first styling
- **shadcn/ui** — pre-built accessible components (built on Radix UI primitives)
- **Lucide React** — icon library

### Validation

- **Zod** — runtime schema validation for API inputs, form data, environment variables, and Stripe webhook payloads

### File Storage (Cloudflare R2)

- **Cloudflare R2** — S3-compatible object storage for license metadata JSON files and theme template zip files
- Uses the `@aws-sdk/client-s3` package (R2 is S3-API-compatible, no Cloudflare-specific SDK needed)

### Dev Tooling

- **drizzle-kit** — database migrations and schema push
- **ESLint + Prettier** — code quality and formatting
- **dotenv** — environment variable loading (`.env.local` for dev)

### What We Are NOT Using (Keeping It Simple)

- No Redis — pg-boss runs on Postgres, rate limiting uses in-memory tracking
- No Neon / PlanetScale / serverless DB proxies — direct Postgres connection
- No NextAuth / Auth.js — custom lightweight auth fits better for a magic-link-first system with Stripe webhook user creation
- No external email SaaS — Nodemailer + SMTP is sufficient
- No Docker required for dev — just Node.js and a Postgres instance

## 4. Product Architecture

### Frontend

- Next.js 16 App Router with React Server Components
- Public marketing and checkout entry points
- Protected dashboard pages behind middleware auth checks

### Backend

- Next.js API routes (for Stripe webhooks, external endpoints)
- Server Actions (for dashboard mutations: domain CRUD, profile updates)
- Middleware for session validation and route protection
- Drizzle ORM for all database operations

### Data Layer

- PostgreSQL with Drizzle ORM schema definitions
- Relational schema with strict constraints and indexes
- Drizzle-kit for migration management

### Background Processing

- pg-boss workers running inside the Next.js process (or as a separate worker script in production)
- Queues: `email-delivery`, `license-metadata-export`
- Retry with exponential backoff, dead-letter handling built into pg-boss

### Integrations

- Stripe for payments (checkout sessions + webhooks)
- SMTP server for email delivery via Nodemailer
- Cloudflare R2 for license metadata JSON persistence

## 5. Site and Route Strategy (Shoptimity)

Marketing website lives at:

- https://shoptimity.com

Dashboard can be deployed as:

- https://shoptimity.com/licenses

Recommended page grouping:

- Public pages: Home, Plans, Checkout, Privacy & policy, Term & condition, Contact Us, Thank You [with video tutorial of how to setup licenses], Setup
- Protected pages: Licenses, Templates, Profile, Payments, Admin

### Route Structure (Next.js App Router)

```
app/
├── (public)/              # Public marketing pages
│   ├── page.tsx           # Home
│   ├── plans/
│   ├── checkout/
│   ├── thank-you/
│   ├── setup/
│   ├── privacy-policy/
│   ├── terms/
│   └── contact/
├── (auth)/                # Auth pages (login, magic link verify)
│   ├── login/
│   └── verify/
├── (dashboard)/           # Protected — requires auth middleware
│   ├── licenses/
│   ├── templates/
│   ├── profile/
│   ├── payments/
│   └── admin/             # Admin-only — requires role check
├── api/
│   ├── stripe/
│   │   └── webhook/       # Stripe webhook handler
│   ├── auth/
│   │   ├── magic-link/    # Request magic link
│   │   └── verify/        # Verify magic link token
│   ├── templates/
│   │   └── [id]/
│   │       └── download/  # Protected template download (checks active license)
│   └── ...
middleware.ts               # Session check + route protection (must be at src/ root)
```

## 6. Core Features

### 6.1 License Management

- Show purchased slots
- Show used vs remaining slots (used_slots is computed at query time by counting active domains, not stored)
- Permanent license ownership after successful one-time payment
- Support active/revoked statuses

### 6.2 Domain Management (CRUD)

- Create: assign domain to available slot
- Read: list assigned domains
- Update: edit existing domain
- Delete: soft delete domain
- Initial domains provided during checkout are completely optional and best-effort — if a submitted domain is already taken by another user at the time of provisioning, it is marked `rejected` in `order_domains` and the slot remains available for the user to assign a different domain from the dashboard

Validation rules:

- Domain must be globally unique (enforced via partial unique index where `deleted_at IS NULL`)
- User cannot exceed purchased slot count (checked by counting active domains vs `total_slots`)
- Domain must satisfy allowed format rules
- All validation handled with Zod schemas

### 6.3 Templates Library

- Accessible after login with an active license
- View preview/demo
- Download theme [zip file download]

Template file storage:

- Theme zip files are stored in a private Cloudflare R2 bucket (`shoptimity-templates`) or a protected directory on the server (not publicly accessible)
- Downloads are served through a protected API route (e.g. `GET /api/templates/[id]/download`) that verifies the user is authenticated and has at least one active license before generating a short-lived signed R2 URL or streaming the file
- Template metadata (name, description, preview image URL, file path) is stored in the database or a config file — not hardcoded in the frontend

### 6.4 Checkout and Payments

- Checkout starts from purchase action
- Clicking Buy License opens a contact form to collect buyer information, selected license quantity, and optional domain list
- Stripe Checkout handles payment
- Webhooks confirm payment status server-side

### 6.5 Authentication

- Magic link flow required
- Credentials flow optional as fallback
- Session-based protection for dashboard routes
- **UX Requirement:** Intercept unauthenticated access to protected pages and redirect to the login page.
- **Magic Link Flow:** User enters email in the login page, receives mail with a redirection link, and is granted access to the panel upon clicking the link.

#### User Registration

Users are created automatically via Stripe webhook when a new customer completes payment and no matching user exists. The webhook handler creates the user record as part of the provisioning transaction. The user then receives a magic link email to access the dashboard.

If a user visits the login page with an email that has no account, reject with a message: "No account found — purchase a license to get started." This is a purchase-first system.

### 6.6 Admin Panel

- Admin-only access with role-based authorization
- Unified records view for:
  - users
  - payments
  - licenses
  - domains
  - orders
- Search, filtering, pagination and detail view for support workflows
- Manual action tools (resend email, inspect webhook/payment status)

## 7. End-to-End User Flow

1. User visits https://shoptimity.com
2. User chooses a plan and clicks Purchase License
3. User fills contact/checkout form (email, selected license quantity, optional domains)
4. Backend creates Stripe Checkout Payment link according to selected plan
5. User completes payment on Stripe
6. Stripe webhook notifies backend (`checkout.session.completed`)
7. Backend verifies signature and idempotency
8. Inside a single Drizzle transaction: backend creates/finds user, records payment, creates order, provisions licenses, and if domains were submitted, attempts to assign them (marking any already-taken domains as `rejected` in `order_domains`)
9. pg-boss enqueues email jobs (order confirmation + magic link for dashboard access)
10. User is redirected to Thank You page (this page must be fully static — it must NOT query or display order/account data, because the webhook may not have completed yet; show a generic success message with the setup video tutorial and tell the user to check their email)
11. User receives login email (magic link)
12. User signs in and enters dashboard
13. User assigns domains from the dashboard (or reviews any auto-assigned domains from checkout) and can add/edit/remove domains within slot limits
14. User accesses templates based on active license

## Admin operations flow:

1. Admin signs in through protected admin route
2. Access unified records dashboard
3. Admin view: users, payments, licenses, domains, orders, plans and support
4. Admin Actions:
   - search, filter, and paginate records
   - resend emails (triggers new pg-boss job)
   - verify payments
   - Manage licenses
5. All actions are logged in audit_logs

## 8. Payment and Provisioning Flow (Source of Truth)

Critical rule: license creation must happen from verified webhook events, not from client redirect.

Webhook handling sequence:

1. Receive event at `POST /api/stripe/webhook`
2. Verify Stripe signature using `stripe.webhooks.constructEvent()`
3. Check event idempotency against `webhook_events` table via Drizzle query
4. If new event, process inside a Drizzle database transaction (`db.transaction()`)
5. Mark event as processed
6. Enqueue license metadata JSON export job via pg-boss (uploads to Cloudflare R2)

Required events:

- `checkout.session.completed`
- `charge.refunded`
- `charge.dispute.created`

Expected behavior:

- Payment success: create permanent licenses from one-time purchase
- Payment success: if domains were optionally submitted at checkout, attempt to assign them — any domain already taken by another user is marked `rejected` in `order_domains` with a reason, and the slot remains available for the user to fill from the dashboard
- Refund/dispute: revoke associated licenses, soft-delete all domains assigned to those licenses (set `deleted_at`), enqueue pg-boss job to delete the corresponding R2 metadata JSON files for each affected domain, and send `LicenseRevokedEmail` to the user
- On Create/Update: enqueue pg-boss job to export license and domain details to a JSON file on Cloudflare R2

License policy:

- Licenses are permanent after successful one-time payment
- No subscription billing cycle is required for license validity
- No expiry/renewal job is needed for standard licenses

## 9. Data Model

All tables defined as Drizzle ORM schemas in `src/db/schema/`. UUIDs used as primary keys across all tables.

### users

- id (PK, uuid)
- email (unique)
- password_hash (nullable)
- role (user or admin)
- created_at (timestamp, default now)
- updated_at (timestamp, default now)

### plans

- id (PK, uuid)
- name (e.g. "1 Slot Plan", "2 Slot Plan", "3 Slot Plan")
- slots (integer: 1, 2, 3)
- regular_price (integer, cents)
- final_price (integer, cents)
- currency (varchar, default "usd")
- features (jsonb)
- is_active (boolean, default true)
- created_at
- updated_at

### licenses

- id (PK, uuid)
- user_id (FK -> users.id)
- plan_id (FK -> plans.id)
- total_slots (integer)
- status (active or revoked)
- source_order_id (FK -> orders.id)
- revoked_reason (nullable; refund, dispute, admin_action)
- created_at
- updated_at

Note: `used_slots` is NOT stored. It is computed at query time by counting active domains (`WHERE deleted_at IS NULL`) for the license. This avoids sync issues and keeps writes simple.

### domains

- id (PK, uuid)
- license_id (FK -> licenses.id)
- user_id (FK -> users.id)
- domain_name (varchar — always stored normalized: lowercase, no protocol, no trailing slash, no www)
- created_at
- updated_at
- deleted_at (timestamp, nullable — soft delete)

Note: Single `domain_name` column stores the normalized value. No separate `domain_name_normalized` column — normalization happens before insert, always.

### payments

- id (PK, uuid)
- user_id (FK -> users.id)
- stripe_session_id (unique)
- stripe_payment_intent_id (varchar)
- stripe_customer_id (varchar)
- amount (integer, cents)
- currency (varchar)
- status (pending, paid, failed, refunded)
- created_at
- updated_at

### orders

- id (PK, uuid)
- user_id (FK -> users.id)
- payment_id (FK -> payments.id)
- plan_id (FK -> plans.id)
- license_quantity (integer)
- contact_name (varchar)
- contact_phone (varchar, nullable)
- status (pending, fulfilled, cancelled)
- created_at
- updated_at

Note: No `checkout_session_id` column — the Stripe session ID is already stored on the `payments` record linked via `payment_id`. No need to duplicate it.

### order_domains

- id (PK, uuid)
- order_id (FK -> orders.id)
- domain_name (varchar — normalized)
- status (pending, assigned, rejected)
- rejection_reason (varchar, nullable)
- created_at
- assigned_at (timestamp, nullable)

### auth_tokens

- id (PK, uuid)
- user_id (FK -> users.id)
- token (unique, varchar)
- token_type (magic_link, reset_password)
- expires_at (timestamp)
- used (boolean, default false)
- used_at (timestamp, nullable)
- created_at

### webhook_events

- id (PK, uuid)
- event_id (Stripe event id, unique)
- type (varchar)
- processed (boolean, default false)
- processing_error (text, nullable)
- processed_at (timestamp, nullable)
- created_at

Note: No `payload_hash` column — idempotency is handled entirely by the unique `event_id`. Keep it simple.

### audit_logs

- id (PK, uuid)
- actor_user_id (nullable FK -> users.id)
- action (varchar)
- entity_type (varchar)
- entity_id (varchar)
- metadata_json (jsonb)
- created_at

### No `email_jobs` table

pg-boss manages its own job tables internally with full retry tracking, archival, and dead-letter support. A separate `email_jobs` table would be double-bookkeeping. Admin can query pg-boss archive tables directly for email job visibility. If a custom admin view is needed later, it can read from pg-boss tables.

## 10. Required Constraints and Indexes

### Uniqueness

- users.email unique
- domains.domain_name partial unique where `deleted_at IS NULL`
- payments.stripe_session_id unique
- webhook_events.event_id unique
- auth_tokens.token unique
- order_domains (order_id, domain_name) composite unique

### Performance Indexes

- licenses.user_id
- domains.user_id
- domains.license_id
- payments.user_id
- orders.user_id
- orders.payment_id
- orders.status
- order_domains.order_id
- webhook_events.processed
- auth_tokens.expires_at (for cleanup queries)

### Integrity Checks

- licenses.total_slots >= 1
- orders.license_quantity >= 1
- payments.amount > 0

### Slot Limit Enforcement

Instead of a stored `used_slots` column with check constraints, slot limits are enforced at the application level: before assigning a domain, acquire a row-level lock on the license row using `SELECT ... FOR UPDATE`, then count active domains and compare against `total_slots`. This must run inside a Drizzle transaction. The `FOR UPDATE` lock is required — without it, two concurrent requests can both read the same count and both insert, exceeding the slot limit.

### Soft Delete and Uniqueness Rule

- Partial unique index on `domains.domain_name WHERE deleted_at IS NULL` allows domain reuse after soft delete

### Transaction Boundaries

- Webhook payment confirmation + user creation + license provisioning (single Drizzle `db.transaction()`)
- Domain assignment + slot limit check (single Drizzle `db.transaction()`)

## 11. Security Requirements

- Enforce auth for all protected routes via Next.js middleware
- Validate resource ownership for all domain/license operations (user can only access their own records)
- Validate all inputs server-side with Zod schemas
- Never trust client-calculated state
- Verify Stripe webhook signatures on every event
- Use short-lived, single-use magic tokens (15 min TTL default)
- HTTP-only secure cookies for sessions
- Rate limit the magic link request endpoint: max 3 requests per email per 15 minutes, max 10 requests per IP per hour (use in-memory tracking)
- Session JWTs should be short-lived (e.g. 30 min). On each protected page load, middleware checks the JWT and verifies the user still exists and is not revoked before allowing access. This prevents revoked/refunded users from retaining access on an old token.

## 12. Domain Rules

Normalize before persistence:

- lowercase
- trim spaces
- remove protocol (http://, https://)
- remove trailing slash
- remove www. prefix

Validation (Zod schema):

- allow Shopify domain patterns (e.g. `store-name.myshopify.com`)
- allow custom domains (e.g. `store.example.com`)
- reject malformed hostnames
- reject IP addresses

Soft delete behavior:

- set `deleted_at` instead of physical delete

## 13. Email Workflow

### Template Authoring

All email templates built with **React Email** components:

- `MagicLinkEmail` — login link with expiry notice (also serves as the welcome email for first-time users after purchase)
- `OrderConfirmationEmail` — purchase summary with license details
- `LicenseRevokedEmail` — notification when license is revoked due to refund/dispute

Templates live in `src/emails/` and can be previewed locally using the React Email dev server.

### Sending

- **Nodemailer** configured with SMTP transport
- SMTP credentials loaded from environment variables
- Single reusable transporter instance

### Queue Integration

After successful purchase webhook:

- Enqueue order confirmation email job to pg-boss `email-delivery` queue
- Enqueue magic link email job to pg-boss `email-delivery` queue

Queue behavior (pg-boss handles this natively):

- Email sending runs asynchronously via pg-boss workers
- Each job retries with exponential backoff (pg-boss `retryLimit` + `retryDelay` + `retryBackoff`)
- Failed jobs automatically move to pg-boss dead-letter archive after max retries
- Admin can inspect failed jobs via pg-boss archive queries or the admin panel

### Worker Setup

pg-boss worker subscribes to the `email-delivery` queue:

```
1. Receive job from queue
2. Render React Email template to HTML
3. Send via Nodemailer SMTP transport
4. On success: job completes automatically
5. On failure: pg-boss retries based on configured policy
```

## 14. Background Job Queues (pg-boss)

### Why pg-boss

- Uses the same PostgreSQL database — no Redis or external queue service needed
- ACID-compliant job storage with built-in retry, expiry, and dead-letter support
- Simple Node.js API that fits naturally into the Next.js codebase
- Good enough for the throughput this system needs

### Queue Definitions

| Queue Name                | Purpose                                    | Retry Policy                   |
| ------------------------- | ------------------------------------------ | ------------------------------ |
| `email-delivery`          | Send transactional emails via Nodemailer   | 5 retries, exponential backoff |
| `license-metadata-export` | Generate and persist license JSON snapshot | 3 retries, exponential backoff |

### Worker Deployment

For development: pg-boss workers run inside the Next.js process (started in a custom server or instrumentation hook).

For production: workers can run as a separate long-running Node.js process (`node workers/index.ts`) to avoid tying queue processing to serverless function lifecycles. Since this is a self-hosted Next.js 16 app on a normal Node.js server, running workers in-process is also acceptable.

### Job Lifecycle

```
Created → Active → Completed
                 ↘ Failed → Retry → Active (loop up to retryLimit)
                                   ↘ Dead Letter (after max retries)
```

## 15. Environment Variables

### Application

- `NEXT_PUBLIC_APP_URL=https://shoptimity.com`
- `NEXT_PUBLIC_DASHBOARD_URL=https://shoptimity.com/app`
- `NODE_ENV=production`

### Database

- `DATABASE_URL=postgresql://user:password@host:5432/shoptimity`

### Auth

- `AUTH_SECRET=...` (used for signing session JWTs via jose)
- `MAGIC_LINK_TTL_MINUTES=15`

### Stripe

- `STRIPE_SECRET_KEY=...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`

### Email (SMTP)

- `SMTP_HOST=...`
- `SMTP_PORT=587`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_SECURE=true`
- `EMAIL_FROM=noreply@shoptimity.com`

### File Storage (Cloudflare R2)

- `R2_ACCOUNT_ID=...`
- `R2_ACCESS_KEY_ID=...`
- `R2_SECRET_ACCESS_KEY=...`
- `R2_BUCKET_NAME=shoptimity-license-metadata`
- `R2_TEMPLATES_BUCKET_NAME=shoptimity-templates`
- `R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`

## 16. Project Structure

```
shoptimity/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── (public)/           # Marketing pages
│   │   ├── (auth)/             # Login, magic link verify
│   │   ├── (dashboard)/        # Protected pages
│   │   ├── api/
│   │   │   ├── stripe/webhook/ # Stripe webhook endpoint
│   │   │   └── auth/           # Auth API routes
│   │   └── layout.tsx
│   ├── middleware.ts           # Session check + route protection (at src/ root)
│   ├── db/
│   │   ├── index.ts            # Drizzle client instance
│   │   ├── schema/             # Drizzle table definitions
│   │   │   ├── users.ts
│   │   │   ├── plans.ts
│   │   │   ├── licenses.ts
│   │   │   ├── domains.ts
│   │   │   ├── payments.ts
│   │   │   ├── orders.ts
│   │   │   ├── order-domains.ts
│   │   │   ├── auth-tokens.ts
│   │   │   ├── webhook-events.ts
│   │   │   └── audit-logs.ts
│   │   └── migrations/         # Drizzle-kit generated SQL migrations
│   ├── emails/                 # React Email templates
│   │   ├── magic-link.tsx
│   │   ├── order-confirmation.tsx
│   │   └── license-revoked.tsx
│   ├── lib/
│   │   ├── stripe.ts           # Stripe client + helpers
│   │   ├── auth.ts             # Session utilities (jose), token generation
│   │   ├── email.ts            # Nodemailer transporter + send helper
│   │   ├── queue.ts            # pg-boss instance + job enqueue helpers
│   │   ├── domains.ts          # Domain normalization + validation
│   │   └── r2.ts               # Cloudflare R2 client + upload/delete helpers
│   ├── workers/
│   │   ├── index.ts            # pg-boss worker entry point
│   │   ├── email-worker.ts     # Email delivery job handler
│   │   └── metadata-worker.ts  # License metadata export + R2 upload handler
│   ├── validators/             # Zod schemas
│   │   ├── auth.ts
│   │   ├── checkout.ts
│   │   ├── domains.ts
│   │   └── env.ts              # Environment variable validation
│   └── components/             # React UI components (shadcn/ui based)
├── drizzle.config.ts           # Drizzle-kit configuration
├── tailwind.config.ts
├── package.json
└── .env.local                  # Local dev environment variables
```

## 17. Monitoring and Audit

Track via admin panel and database queries:

- Webhook failures (logged in `webhook_events.processing_error`)
- Payment failure rate (query `payments` table by status)
- Email delivery failures (query pg-boss archive tables for failed/dead-letter jobs)
- Domain assignment errors (logged in `audit_logs`)

Audit log important actions (written to `audit_logs` table):

- login
- checkout initiation
- webhook processing
- license create/revoke
- domain CRUD
- admin actions and manual support actions

## 18. Edge Cases and Recovery

- Handle concurrent domain assignment with Drizzle transactions and Postgres row-level locks
- Reconcile delayed webhooks safely via idempotency check on `webhook_events.event_id`
- Revoke or suspend license on refund/dispute
- pg-boss handles worker downtime gracefully — jobs remain in queue and resume when workers restart
- Keep backups and restore process documented

## 19. Definition of Done

- Purchase flow works from shoptimity.com to Stripe and back
- Buy License contact form captures buyer data, license quantity, and optional domains before Stripe checkout
- Webhook reliably provisions licenses inside a Drizzle transaction
- Domains submitted during checkout are auto-added on a best-effort basis; rejected domains (already taken) are marked in `order_domains` and the user can assign alternatives from the dashboard
- No domain can be assigned beyond purchased slots (enforced with `SELECT FOR UPDATE` inside a Drizzle transaction)
- Duplicate domains are blocked globally (partial unique index)
- Protected routes are inaccessible when unauthenticated (middleware enforced)
- Template downloads are gated behind an authenticated API route that checks for an active license
- Admin panel can view users, payments, licenses, domains, and orders
- pg-boss email queue retries and dead-letter handling are operational
- Refund/dispute revokes licenses, soft-deletes associated domains, cleans up R2 metadata, and notifies the user
- Magic link endpoint is rate-limited per email and per IP
- Audit log entries are written for key actions
- All email templates render correctly via React Email

---

## 20. License Metadata Persistence

To facilitate external processing and validation, the system must generate a JSON snapshot whenever a license is created or its domain assignments are updated. This generation runs as a **pg-boss background job** on the `license-metadata-export` queue.

### 20.1 Trigger Events

- Successful payment (initial license creation)
- Domain assignment (initial during checkout or manual update in dashboard)
- Domain update/removal

### 20.2 JSON Structure

The exported JSON must contain:

- `user_id`: Unique identifier for the user
- `user_email`: Registered email of the license owner
- `user_domain`: The specific domain assigned to the license
- `license_details`: Full metadata of the license assigned to that domain (ID, slots, status, etc.)

### 20.3 Storage Strategy

After generation, the JSON must be uploaded to **Cloudflare R2**:

- Stored in a private R2 bucket (`shoptimity-license-metadata`)
- Uploaded via `@aws-sdk/client-s3` using R2's S3-compatible API endpoint
- Object key pattern: `licenses/{domain_name}.json`
- Overwrites previous version on domain update; deletes object on domain removal

---

This README defines the complete product and system flow for Shoptimity license operations and should be treated as the baseline implementation specification.
