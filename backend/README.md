# HelpDesk Lite API

Real backend for HelpDesk Lite: `React → API → Database` instead of `React → localStorage`.

**Stack:** Node.js + Express + SQLite (via `better-sqlite3`) + JWT auth.

## Why Node + SQLite and not ASP.NET Core + SQL Server?

Same architecture, same three upgrades you asked for (real backend, AI triage, backend-driven SLA)
— just built with a stack that doesn't need the .NET SDK / SQL Server / NuGet installed. It's a
drop-in equivalent: a REST API in front of a real relational database with password-hashed auth,
JWT sessions, and role-based authorization enforced server-side (not just hidden in the UI).
If you later want to port this to ASP.NET Core + EF Core + SQL Server, the schema in
`src/lib/db.js` and the route logic in `src/routes/` translate almost 1:1 into Controllers +
DbContext + Entity classes — the field names were kept identical to your frontend's
`src/lib/types.ts` on purpose.

## Setup

```bash
npm install
cp .env.example .env       # then edit .env: set JWT_SECRET and PROVISIONING_KEY to random strings
npm run seed                # creates the SQLite DB + 3 demo accounts + 3 sample tickets
npm run dev                  # http://localhost:4000
```

Demo accounts (password `HelpDeskDemo@2026!`):

| Role          | Email                              |
|---------------|-------------------------------------|
| Employee      | demo.employee@helpdesklite.local    |
| Support Agent | demo.agent@helpdesklite.local       |
| Manager       | demo.manager@helpdesklite.local     |

### Enabling real AI suggestions

Without `ANTHROPIC_API_KEY` set, `POST /api/tickets/suggest` uses a local keyword heuristic
(`src/lib/aiHeuristic.js`) — fast, free, and it never blocks ticket submission. Set
`ANTHROPIC_API_KEY` in `.env` to switch to real Claude-based suggestions; on any failure or
timeout it silently falls back to the heuristic, so the feature can never break the form.

### Creating Support Agent / Manager accounts

Public `POST /api/auth/register` always creates an `Employee` — there is no role picker,
matching how the reference project does it. Staff accounts are created with:

```bash
curl -X POST http://localhost:4000/api/auth/provision \
  -H "Content-Type: application/json" \
  -H "x-provisioning-key: YOUR_PROVISIONING_KEY" \
  -d '{"name":"Sara Ali","email":"sara@company.com","password":"SomeStrongPass1","role":"Support Agent"}'
```

## API Reference

All routes except `/health`, `/api/auth/register`, `/api/auth/login`, and `/api/auth/provision`
require `Authorization: Bearer <token>` from login/register.

| Method | Path                          | Role                     | Purpose |
|--------|-------------------------------|--------------------------|---------|
| POST   | `/api/auth/register`          | public                   | Sign up (always Employee) |
| POST   | `/api/auth/login`             | public                   | Get a JWT |
| GET    | `/api/auth/me`                | any                      | Current user |
| POST   | `/api/auth/provision`         | provisioning key         | Create Support Agent / Manager |
| POST   | `/api/tickets/suggest`        | any                      | AI priority + category suggestion (live, while typing) |
| POST   | `/api/tickets`                | any                      | Create ticket (SLA deadline auto-computed from priority) |
| GET    | `/api/tickets`                | any (scoped)             | List — Employees see only their own; staff see all. Filters: `status`, `category`, `assigneeId`, `q` |
| GET    | `/api/tickets/:id`            | any (scoped)             | Ticket detail incl. `sla` state and full activity `history` |
| PATCH  | `/api/tickets/:id/assign`     | Support Agent, Manager   | `{ assigneeId }` |
| PATCH  | `/api/tickets/:id/status`     | Support Agent, Manager   | `{ status }` — one of New/In Progress/Pending/Resolved/Closed |
| POST   | `/api/tickets/:id/notes`      | Support Agent, Manager   | `{ text }` — adds a progress note to the timeline |
| GET    | `/api/tickets/meta/dashboard` | Support Agent, Manager   | Counts by status, unassigned, SLA breached/at-risk, workload by agent |

Every ticket response includes `sla`: `on_track` / `at_risk` (<2h left) / `breached` / `met`,
computed live from `slaDeadline` (set at creation as `createdAt + SLA_HOURS[priority]`, matching
your existing `SLA_HOURS` table: Urgent 4h, High 8h, Normal 24h, Low 72h).

## Frontend integration — already done

The `helpdesk-lite` frontend project (separate zip) has already been wired to this API:
`src/lib/api.ts` is the fetch client, `auth.tsx` and `store.tsx` call it instead of localStorage,
and `NewTicket.tsx` shows a live AI priority/category suggestion chip (debounced) while typing —
same UX pattern as Shahnda's project. Run both together:

```bash
# terminal 1
cd helpdesk-lite-backend && npm install && npm run seed && npm run dev   # http://localhost:4000

# terminal 2
cd helpdesk-lite && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
```

One note on the current UI: HelpDesk Lite today is a single shared staff workspace — anyone who
signs up can create, assign, and manage every ticket (there's no separate "Employee submits
only" portal in the UI). So `POST /api/auth/register` defaults new accounts to `Support Agent`
(full access), matching that behavior exactly. The `Employee`-role restriction (see the API
reference below) is still fully enforced server-side and ready to use — it just isn't reachable
from today's sign-up screen. If you build a separate employee-facing submission form later,
switch that flow to `POST /api/auth/provision` or add a role-aware register endpoint, and the
Employee-only ticket visibility rules already work with zero backend changes.

## Deployment

Any Node host works (Render, Railway, Fly.io, a VPS). SQLite's single-file database is fine at
this scale; if you outgrow it, swap `better-sqlite3` for `pg` (Postgres) — the SQL in
`src/routes/*.js` is plain enough to port directly.
