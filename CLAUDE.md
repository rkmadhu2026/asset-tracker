# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies

# ── Frontend ─────────────────────────────────────────────────────────────────
npm run dev          # Vite dev server on 0.0.0.0:3000 (proxies /api → localhost:4000)
npm run build        # production build → dist/
npm run preview      # preview production build
npm run lint         # TypeScript type-check only (tsc --noEmit); no ESLint/Prettier
npm run clean        # remove dist/

# ── Backend (Express + PostgreSQL) ───────────────────────────────────────────
npm run server       # tsx watch server/index.ts (hot-reloads on :4000)
npm run server:start # tsx server/index.ts (no watch)

# ── Database ─────────────────────────────────────────────────────────────────
npm run db:up        # docker compose up -d  (starts Postgres container)
npm run db:down      # docker compose down
npm run db:migrate   # run all six SQL migrations (001→006) against local Postgres

# ── Docker full-stack ─────────────────────────────────────────────────────────
npm run compose:prod:up   # build + start full stack (web + api + db) in prod mode

# ── Data import scripts ───────────────────────────────────────────────────────
npm run import:tenants          # node scripts/import-tenants.mjs
npm run migrate:clients-sites   # node scripts/migrate-tenants-to-clients-sites.mjs
node scripts/import-from-excel.mjs <file.xlsx>
node scripts/import-racks.mjs   <file.xlsx>
```

**No test framework configured. No tests exist.**

To disable Vite HMR (used by AI Studio to prevent flicker during agent edits), set `DISABLE_HMR=true` before `npm run dev`.

## Environment

Copy `.env.example` to `.env.local` (loaded by both Vite and the Express server via `dotenv`).

| Variable | Used by | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Vite (inlined at build) | Gemini AI assistant |
| `JWT_SECRET` | Express | Secret key for signing JWT tokens (set a strong value in production!) |
| `API_PORT` | Vite proxy + Express | Express listen port (default `4000`) |
| `DATABASE_URL` | Express | Full Postgres URL — overrides `PG_*` when set |
| `PG_HOST / PG_PORT / PG_DATABASE / PG_USER / PG_PASSWORD` | Express | Individual Postgres params (defaults: `argus`/`argus`) |
| `CORS_ORIGIN` | Express | Allowed BROWSER origin (default `http://localhost:3001`); comma-separated for multiple |
| `AUTH_BYPASS` | Express + Vite | `true` → skip JWT verification, treat all callers as admin. **Never in production.** |

The `docker-compose.yml` dev DB only auto-applies migrations 001–003 via `docker-entrypoint-initdb.d`. Always run `npm run db:migrate` after `npm run db:up` to get migrations 004–006.

## Architecture

**Argus-asset-tracker** — a multi-tenant on-prem CMDB/asset-inventory platform for financial institutions. Stack: React 19 + Vite 6 + TypeScript + Tailwind v4 (frontend) and Express + PostgreSQL (backend).

### Data layer

**PostgreSQL only** — all operational data (clients, sites, racks, infrastructure devices, assets, users, config tasks, device templates, drifts, validation history, chat messages, audit logs) is stored in PostgreSQL.

The Vite dev server proxies `/api/*` → `localhost:${API_PORT}` so frontend code always uses relative `/api` paths.

### Express backend (`server/`)

```
server/
  index.ts            # app entry — mounts all routers on /api/*
  auth-jwt.ts         # JWT issue/verify helpers, password hashing
  db.ts               # pg.Pool (DATABASE_URL or PG_* env vars)
  audit.ts            # logAudit() — fire-and-forget INSERT to audit_logs; safe to call without await
  middleware/auth.ts  # requireAuth / requireAdmin — JWT verification
  routes/
    auth.ts            # login, register, me endpoints
    chats.ts           # chat message storage
    upload.ts          # file upload → /uploads/ directory
    users.ts           # user management
    audit-logs.ts      # read/filter audit_logs table
    clients.ts, sites.ts, racks.ts, infrastructure.ts, assets.ts,
    config-tasks.ts, device-templates.ts, drifts.ts, validation-history.ts
migrations/
  001_initial.sql … 006_audit_logs_extend.sql
uploads/               # uploaded files served statically at /uploads/
```

All routes are protected by `requireAuth`; admin-only mutations use `requireAdmin`. With `AUTH_BYPASS=true` all requests are treated as `admin` (bypass is logged with a warning).

Health check: `GET /api/health` → `{ status: 'ok', ts: <ISO timestamp> }` (unauthenticated).

Backend runs via `tsx` (no separate build step for dev). `tsconfig.server.json` compiles to **CommonJS** (`dist-server/`) — `"module": "ESNext"` must not be used there because `package.json` has `"type":"module"` at the repo root and `dist-server/package.json` overrides it back to `commonjs`. Do not use `import.meta` in server code.

### Audit logging

Use `logAudit(event)` from `server/audit.ts` inside route handlers. It is fire-and-forget — never throws and doesn't need `await`. Fields: `userId`, `action` (required); `type` (`User|System|Config`), `severity` (`Info|Warning|Critical`), `resourceType`, `resourceId`, `details` (all optional).

### Frontend auth flow

JWT-based authentication (no Firebase):
1. `POST /api/auth/login` or `/api/auth/register` → returns `{ token, user }`
2. Token stored in `localStorage` as key `jwt`
3. All API calls in `src/lib/api.ts` attach `Authorization: Bearer <token>`
4. `src/components/AuthProvider.tsx` manages auth state from JWT + `/api/auth/me`

### Frontend provider stack (top-down)

`main.tsx` → `App` → `ErrorBoundary` → `BrowserRouter` → `AuthProvider` → `ClientProvider` → `SiteProvider` → `AppContent`

`AppContent` short-circuits to `<Login />` when there's no authenticated user; otherwise renders the routed `<Layout>` plus a global `<NetworkAI />` overlay (Gemini chat assistant mounted at app root, not per-route).

### Data hierarchy & providers

**Clients → Sites → Racks → Devices/Assets** (PostgreSQL model, defined in `src/types/inventory.ts`).

- **`ClientProvider`** (`src/components/ClientProvider.tsx`) — fetches all clients from `/api/clients`, exposes `selectedClientId`, `subClients`, `descendantClients`, and `selectedClientFamily` (the selected client + all its children). Polls every 30 s. Snake_case API fields are mapped to camelCase in the provider.
- **`SiteProvider`** (`src/components/SiteProvider.tsx`) — fetches sites filtered by the selected client family.
- Client selection is in-memory only (no URL/localStorage persistence).
- Sites have a many-to-many join (`client_sites` table) — `Site.clientIds` is the frontend view of this.

### Auth & roles

- Three roles: `admin`, `developer`, `viewer`. Default on first sign-in: `viewer`.
- **Admin bootstrapped by hardcoded email** `rajkumarmadhu2024@gmail.com` in `src/components/AuthProvider.tsx` and `server/routes/users.ts`. Both must stay in sync.
- User profiles are stored in PostgreSQL (`users` table). The `users` table is the source of truth for roles; `requireAdmin` queries Postgres directly.
- The `/users` page/route is admin-only (gated in `App.tsx`).

### Frontend API client (`src/lib/api.ts`)

Single module exporting typed API objects (`clientsApi`, `sitesApi`, `racksApi`, `infrastructureApi`, `assetsApi`, `configTasksApi`, `deviceTemplatesApi`, `driftsApi`, `validationHistoryApi`, `usersApi`, `auditLogsApi`). Each wraps the internal `request()` helper which attaches the JWT as `Authorization: Bearer <token>`. This is the only place that should make fetch calls to `/api`.

### Gemini integration (`src/services/gemini.ts`)

Single shared `GoogleGenAI` instance. Model IDs centralized in the exported `models` map — add new helpers here, don't instantiate `GoogleGenAI` elsewhere. Helpers returning blob URLs (`generateVideo`, `generateMusic`, `textToSpeech`) must have those URLs revoked by the caller.

### Routing & layout

All routes are nested under `<Layout>` (`src/components/Layout.tsx`), which renders the sidebar + header + `<Outlet />`. The sidebar `navItems` array is hardcoded — adding a page requires editing both `App.tsx` (route) and `Layout.tsx` (nav entry).

### Pages with hardcoded / stub data

Some pages mix real API data with hardcoded arrays for features not yet backed by the DB:

| Page | Real data | Hardcoded / stub |
|---|---|---|
| `Dashboard.tsx` | assets count, drifts, devices | vendorData, complianceData, softwareData, cloudData, recentLogs |
| `Monitoring.tsx` | infrastructure devices (status, type) | latency and uptime computed deterministically from device ID |
| `Automation.tsx` | none | all script and build-history rows are static |
| `AuditLog.tsx` | full real data from `/api/audit-logs` | — |
| `Topology.tsx` | full real data from `/api/infrastructure` | — |

When adding real backends to stub pages, wire to the existing API pattern in `src/lib/api.ts`.

### Conventions

- Path alias `@/*` → `src/*` (in `tsconfig.json` and `vite.config.ts`). **Do not use `@/` in server code** — server files use relative imports only.
- UI primitives in `src/components/ui/` (shadcn-style). Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge).
- Tailwind v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`; theme tokens in `src/index.css`.
- Several pages are very large single files (`Infrastructure.tsx` ~128 KB, `Assets.tsx` ~95 KB, `Racks.tsx` ~38 KB). Prefer in-place edits over splitting unless explicitly asked.
- `src/lib/firestore-errors.ts` — legacy error-logging utility kept for its `ErrorInfo` structure; not Firebase-specific.

## Kubernetes deployment (`k8s/`)

Self-contained manifests for in-cluster deployment (Harbor registry). Apply order:
```
00-namespace → 01-secrets → 02-postgres → 03-api → 04-web → 05-registry-secret → 06-api-image-importer
```
Secrets in `01-secrets.yaml` contain `<PLACEHOLDER>` values — substitute from Vault before applying. The `06-api-image-importer` job pulls the API image from Harbor into the cluster.

## Roadmap trackers

`docs/feature-roadmap.csv`, `docs/frontend-tracker.csv`, `docs/backend-tracker.csv` — CSV files tracking feature completion status. Not auto-generated; update manually when features ship.
