# HelpDesk Lite — Internal Support Console

A lightweight internal helpdesk workspace for submitting, assigning, and tracking
support requests — built as a "dispatch console" for a small IT/support team.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS (custom design-token theme, dark/light)
- React Router
- Recharts (workload + category charts)
- Real backend: Node.js + Express + SQLite REST API (`/helpdesk-lite-backend`),
  with JWT auth, bcrypt-hashed passwords, and server-enforced role checks —
  see that project's README for the full API reference.

## Features

- **Dispatch dashboard** — live queue-health meter, SLA-breach count, workload-by-owner
  and requests-by-category charts, recent activity feed.
- **All Tickets** — status tabs, category/priority filters, keyword search, sortable
  list, pagination, CSV export.
- **Ticket detail** — status stepper, priority + owner controls, SLA countdown pill,
  full activity timeline, and threaded update notes.
- **Assigned to Me** — a personal open/closed queue for the signed-in agent.
- **Categories** — volume and open-load breakdown per request category.
- **New Ticket** — structured intake form with required-field validation, plus a
  live AI priority/category suggestion (debounced) as the description is typed —
  backed by Claude with a local keyword-heuristic fallback.
- **SLA tracking** — each priority has an SLA budget (Urgent 4h, High 8h, Normal 24h,
  Low 72h), computed and enforced by the backend; tickets flip to "at risk" and
  "breached" states automatically.
- **Dark / light theme toggle**, responsive layout down to mobile, keyboard-visible
  focus states, toast notifications for every state change.

## Getting started

This project needs the HelpDesk Lite API running alongside it. See
`helpdesk-lite-backend/README.md` to start that first (`npm install && npm run seed && npm run dev`),
then:

```bash
cp .env.example .env   # points VITE_API_URL at the API, defaults to http://localhost:4000/api
npm install
npm run dev             # start the dev server
npm run build            # production build to /dist
npm run preview          # preview the production build
```

Demo accounts (see the backend README): `demo.employee@helpdesklite.local`,
`demo.agent@helpdesklite.local`, `demo.manager@helpdesklite.local`, password
`HelpDeskDemo@2026!`. Note: today's sign-up screen creates full-access accounts (no
Employee-only portal in the UI yet) — see the backend README for details.

## Project structure

```
src/
  components/   Shared UI: sidebar, topbar, badges, table, charts, toasts
  lib/           Types, API client (api.ts), auth, ticket store (context), utils
  pages/         Route-level screens (Dashboard, Tickets, TicketDetail, ...)
```

## Notes

Tickets, accounts, and sessions are now stored on the server (SQLite via the
Express API), not in the browser. `src/lib/api.ts` is the only place that talks to
the network — swap its `API_URL` to point at a deployed backend when you host this
for real.
