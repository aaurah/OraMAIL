# Postmaster

A Postmark-style transactional email management platform — send, receive, track, and analyze every email your platform delivers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/email-dashboard run dev` — run the dashboard (port 23900)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `POSTMARK_SERVER_TOKEN` — Postmark server API token (for actual email sending)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Email: Postmark SDK (`postmark`)
- Frontend: React + Vite, TanStack Query, Recharts, shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema files (emails, inbound, templates, domains, suppressions, activity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/postmark.ts` — Postmark client singleton
- `artifacts/email-dashboard/src/` — React frontend dashboard

## Architecture decisions

- OpenAPI-first: all API contracts defined in `openapi.yaml`, codegen produces typed React Query hooks and Zod validators
- Postmark integration gracefully degrades: emails are saved to DB as "queued" if `POSTMARK_SERVER_TOKEN` is not set; full sending is enabled when the token is present
- Domain verification uses Postmark's sender signatures list via the ServerClient
- Inbound emails arrive via the `/api/inbound/webhook` endpoint (configure this URL in Postmark's inbound settings)
- Activity feed is append-only — every send/receive/event writes a row to the `activity` table

## Product

- **Dashboard**: delivery overview stats, 30-day trend chart, bounce breakdown, recent activity feed
- **Outbound emails**: searchable/filterable list of sent emails with status badges and detail slide-over; compose form for sending new emails
- **Inbound emails**: list of received emails with full parsed content
- **Templates**: create, edit, delete reusable email templates
- **Domains**: add and verify sender domains (SPF/DKIM status)
- **Suppressions**: manage suppression list (bounces, spam, unsubscribes, manual)

## DNS Setup (for inbound receiving)

Add to your DNS provider:
- SPF: `TXT @ v=spf1 include:spf.mtasv.net ~all`
- DKIM: `TXT pm._domainkey <key from Postmark>`
- Return-Path: `CNAME pm-bounces pm.mtasv.net`
- DMARC: `TXT _dmarc v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
- Inbound MX: `MX inbound inbound.postmarkapp.com (priority 10)`

Set inbound webhook in Postmark → Server → Inbound Stream:
`https://your-app-domain.com/api/inbound/webhook`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema change in `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before using updated types
- Never use `console.log` in server code — use `req.log` in route handlers, `logger` elsewhere
- The `postmark` package is installed only in `artifacts/api-server`, not workspace root

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
