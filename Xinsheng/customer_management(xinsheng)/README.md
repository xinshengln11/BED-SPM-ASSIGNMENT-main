# Customer Management Module

Implements Sprint 1 user stories for the Hawker Centre Management System customer-management area:

- **Register an account (Create)** — `POST /api/auth/register`
- **Log in / log out securely** — `POST /api/auth/login`, `POST /api/auth/logout`
- **View past order history (Read)** — `GET /api/orders/history?status=` (requires login)
- **View profile (Read)** — `GET /api/auth/profile` (requires login)
- **Edit profile (Update)** — `PUT /api/auth/profile` (requires login)
- **Delete account (Delete)** — `DELETE /api/auth/account` (requires login)
- **Change password** — `PUT /api/auth/change-password` (requires login)
- **Automatic session expiry** — the `token` cookie's lifetime is tied to the JWT's own `exp` claim (driven by `JWT_EXPIRES_IN`), so the browser drops the cookie the moment the token expires

This module's individual CRUD feature is full CRUD on the `Customers` resource:
Create (register) → Read (profile / order history) → Update (edit profile) → Delete (delete account).

## Stack

Node.js + Express, **Microsoft SQL Server** via the `mssql` package, `bcrypt` for password
hashing, `jsonwebtoken` for auth, `joi` for request validation — matching the pattern taught in
the practicals (dbConfig.js + per-request `sql.connect`/`.request()`/`.close()`, MVC folders,
Joi validation middleware) and the same engine/style Matthias's `food-ordering-api` uses, so the
two modules' databases can be merged later without a rewrite.

## Setup

1. Install SQL Server Express (or use an existing instance) and SSMS.
2. Run `database/schema.sql` in SSMS (or `sqlcmd`) to create the database and tables. It's
   idempotent (`IF OBJECT_ID(...) IS NULL`) and seeds sample data so the app has something to
   show immediately.
3. Copy `.env.example` to `.env` and fill in your `DB_USER`, `DB_PASSWORD`, `DB_SERVER`,
   `DB_DATABASE`, `DB_PORT`, and a `JWT_SECRET`.
4. Install dependencies and start the server:
   ```
   npm install
   npm run dev
   ```
5. Server runs on `http://localhost:3000` by default. Check `GET /api/health` to confirm it's up.
   This server also serves the team's shared `/public` front-end folder (repo root), so you
   can open `http://localhost:3000/login.html` directly to test/demo end-to-end.

## API quick reference

| Method | Route | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | none | `{ name, email, password }` | password min 8 chars; email must be unique |
| POST | `/api/auth/login` | none | `{ email, password }` | sets an httpOnly `token` cookie (JWT) |
| POST | `/api/auth/logout` | logged in | — | clears the `token` cookie |
| GET | `/api/auth/profile` | logged in | — | returns the logged-in customer's `customerId`, `name`, `email`, `createdAt` |
| PUT | `/api/auth/profile` | logged in | `{ name, email }` | updates the logged-in customer's name/email; email must stay unique |
| DELETE | `/api/auth/account` | logged in | — | permanently deletes the logged-in customer's account, clears the session cookie |
| PUT | `/api/auth/change-password` | logged in | `{ currentPassword, newPassword }` | new password min 8 chars and must differ from the current one |
| GET | `/api/orders/history?status=` | logged in | — | returns orders + items for the logged-in customer; optional `status` filters by `received`/`preparing`/`ready`/`collected`/`cancelled` |

Auth is via an httpOnly JWT cookie set on login, so the browser sends it automatically on
subsequent requests — no need to manually attach an `Authorization` header from the frontend.
Frontend `fetch()` calls must pass `credentials: 'include'` for the cookie to be sent/received.
Request bodies are validated by Joi middleware (`middlewares/authValidation.js`) before hitting
the controllers, so controllers can assume `req.body` is already well-formed.

## Notes / dependencies on other modules

- `Customers.CustomerID` is a generated string ID (`CUST_001`, `CUST_002`, ...), not an
  auto-increment integer — this matches how Matthias's `food-ordering-api` already stores
  `CustomerID` as `VARCHAR(50)` on `customerOrder`/`cartItem`, so the two modules can share a
  `Customers` foreign key once merged.
- `foodStall` / `menuItem` / `customerOrder` / `orderItem` in `database/schema.sql` are
  **placeholder tables that mirror Matthias's real schema** (see his `models/*.js` for the
  source of truth) so `/api/orders/history` is independently testable. Table/column names and
  casing are copied exactly — do not rename them when merging, just drop these placeholder
  `CREATE TABLE` statements once his tables exist in the shared database.
- Payment integration is out of scope for this module (handled by another team, per the
  assignment brief).

## ⚠️ Still needs a team decision before final submission

- **One shared database.** This module and `food-ordering-api` both use SQL Server now (no more
  engine mismatch), but each still connects to its own local database via its own `.env`. Before
  final submission, agree on one shared SQL Server instance/database name and point every
  module's `.env` at it, then delete the placeholder tables from this file.
- **Possible feature overlap with SA2-27 (Order History).** Matthias's code already implements
  "View order history" (`//MATTHIAS ORDER HISTORY (SA2-27)` in his `orderHistoryModel.js`,
  route `GET /orders/history/:customerId`). This module also exposes a `GET /api/orders/history`
  for the logged-in customer. The assignment requires each student's individual component to be
  clearly distinguishable — raise this with the team so it's obvious the two aren't the same
  submitted feature (e.g. keep only one, or make the difference explicit, such as this module's
  version being scoped to "my own orders via my session" vs. a lookup by `:customerId` param).
