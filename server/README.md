# Pavilion Market Place API

Express API and Prisma data layer for the estate marketplace.

## Local setup

1. Install Node.js and PostgreSQL.
2. Run `npm install` from this directory.
3. Copy `.env.example` to `.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD`. Set `DB_NAME` if your database is not named `pavilion_marketplace`. Alternatively, set a complete `DATABASE_URL`.
4. Run `npm run db:generate` and `npm run db:migrate`.
5. Start the API with `npm run dev`.

To create the initial Super Admin, set `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PHONE`, and a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 14 characters in `.env`, then run `npm run db:bootstrap-super-admin` once. Estate records are managed separately. Remove the bootstrap password from `.env` after signing in. The command creates no estate or Estate Admin membership and stops if a Super Admin already exists.

The API listens on port 4000 by default. `GET /api/v1/health` reports process health; `GET /api/v1/ready` also checks the database connection. The React client is allowed from `CLIENT_ORIGIN` (default `http://localhost:5173`).

## Current scope

Implemented routes include:

- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and `POST /api/v1/auth/logout` using opaque, hashed server sessions in `HttpOnly` cookies and a CSRF token for state-changing authenticated requests.
- `GET /api/v1/estates/:estateId/registration-locations` and `POST /api/v1/estates/:estateId/registration-requests` for resident onboarding.
- `GET /api/v1/admin/registration-requests`, approval/decline actions, and location list/create/deactivate actions for the Super Admin when signed in with an estate selected.

Estate review and location operations require the Super Admin role and a selected estate. Household approval, membership creation, and audit recording run in one database transaction. Database indexes protect active/pending unit and registration uniqueness.

The first approved resident account is created without a password. Password setup challenge delivery and resident invitation are pending selection of an email/SMS provider; until that workflow is added, approved residents cannot sign in. Super Admin can sign in without an estate selected for platform scope, or provide an `estateId` during login to use estate-scoped review and location actions. Estate Admin membership records are not created by this setup and do not authorize the review endpoints.

Never commit `.env` or real credentials. Password challenge tokens are stored as hashes; delivery and session handling still need to be implemented.
