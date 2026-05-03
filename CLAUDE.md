# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                  # install dependencies
npm run dev                  # vite dev server on 0.0.0.0:3000 (strictPort) — fails if 3000 is taken
npm run server               # start Express API on :4000 with hot reload (tsx watch)
npm run server:start         # start Express API without watch
npm run build                # production build (vite build → dist/)
npm run preview              # preview the production build
npm run lint                 # type-check only — runs `tsc --noEmit`
npm run clean                # remove dist/

# Local Postgres (Docker)
npm run db:up                # docker compose up -d  (db + api + web stack)
npm run db:down              # docker compose down
npm run db:migrate           # apply server/migrations/*.sql via psql or `docker compose exec db`

# Production Docker stack
npm run compose:prod:up      # docker compose -f docker-compose.prod.yml up -d --build

# Data migration scripts (one-shot, Node)
npm run import:tenants               # node scripts/import-tenants.mjs
npm run migrate:clients-sites        # node scripts/migrate-tenants-to-clients-sites.mjs

# Firebase Hosting deploy
npm run deploy               # build + firebase deploy --only hosting
npm run deploy:hosting       # deploy without rebuilding
```

There is no test framework configured. `lint` is purely TypeScript type-checking; there is no ESLint/Prettier setup. CI is in `.github/workflows/ci.yml` (lint + build) and `deploy-firebase-hosting.yml` (manual hosting deploy).

To disable Vite HMR (used by AI Studio to prevent flicker during agent edits), set `DISABLE_HMR=true` before `npm run dev`.

The dev workflow is **two processes in parallel**: `npm run server` (API on :4000) and `npm run dev` (Vite on :3000). Vite proxies `/api/*` → `http://localhost:${API_PORT || 4000}` (see `vite.config.ts`); the browser only ever talks to :3000.

## Environment

Vite loads env from the project root (not `src/`). Copy `.env.example` to `.env.local`.

Client (Vite, baked into bundle at build time):
- `GEMINI_API_KEY` — injected as `process.env.GEMINI_API_KEY` via Vite's `define`. Used by `src/services/gemini.ts`. AI Studio injects this automatically.
- `APP_URL` — present in `.env.example` for AI Studio's Cloud Run URL injection; not currently consumed by client code.

API server (`server/`, read at runtime via `dotenv` from `.env.local`):
- `API_PORT` (default `4000`) — also used by Vite to wire the dev proxy.
- `DATABASE_URL` — preferred for hosted Postgres (Neon/RDS/Render). When set, overrides `PG_*` in `server/db.ts`.
- `PG_HOST` / `PG_PORT` / `PG_DATABASE` / `PG_USER` / `PG_PASSWORD` — fallback connection params.
- `CORS_ORIGIN` (default `http://localhost:3001`) — must match the browser origin. Local dev → `http://localhost:3000`; Docker stack → the `PUBLIC_ORIGIN` (e.g. `http://localhost:8080`).
- `GOOGLE_APPLICATION_CREDENTIALS` — optional path to a Firebase service-account JSON for verifying ID tokens in `server/middleware/auth.ts`. If unset, the middleware falls back to project-ID-only init from `firebase-applet-config.json` (works for emulator / dev).

Firebase **client** config is **not** in env vars — it is committed at `firebase-applet-config.json` and imported directly by `src/firebase.ts`. Note the non-default Firestore database ID (`firestoreDatabaseId` field) — `getFirestore(app, firebaseConfig.firestoreDatabaseId)` is required; calling `getFirestore(app)` will silently hit the wrong DB.

## Architecture

This is the **Argus-asset-tracker** applet (per `metadata.json`; renamed from "Linkedeye-Finspot") — a multi-tenant on-prem asset inventory + configuration management platform tracking infrastructure, network devices, and operators, with a Gemini AI assistant. (The `package.json` `name` field still says `react-example` — that's the AI Studio scaffold name, not the product.)

Stack:
- **Frontend**: React 19 + Vite 6 + TypeScript + Tailwind v4 (`@tailwindcss/vite`, no `tailwind.config.js`) + React Router 7 + `@google/genai`.
- **Backend**: Express 4 + `pg` (Postgres 16) + `firebase-admin` for token verification.
- **Auth/identity**: Firebase Auth (client SDK signs in; server verifies the ID token).
- **Storage split**: most entities (clients, sites, racks, infrastructure devices, assets, users, config tasks, drifts, validation history, device templates) live in **Postgres** behind the Express API. Some collections still live in Firestore (chat history, audit logs, ad-hoc documents) — see `firestore.rules` for the current set.

### Two-tier data model — Postgres vs Firestore

The repo is mid-migration from a Firestore-only design to Postgres-backed APIs. When working with an entity, check first:
- `src/lib/api.ts` — if it has a typed `*Api` object (e.g. `clientsApi`, `sitesApi`, `infrastructureApi`, `assetsApi`, `usersApi`, `driftsApi`, `validationHistoryApi`, `configTasksApi`, `deviceTemplatesApi`), the entity is served by Express + Postgres. Routes are defined in `server/routes/*.ts` and tables in `server/migrations/00{1,2,3}_*.sql`.
- Firestore is still authoritative for: `chats/{uid}/messages`, `audit_logs`, and a few per-doc subcollections. `firebase-blueprint.json` documents the historical schema; `firestore.rules` is the current truth.

**Don't introduce a new Firestore collection for a domain entity** — add a Postgres migration + Express route + `*Api` client instead.

### Express API (`server/`)
- `server/index.ts` mounts every router under `/api/*` and adds a process-wide error handler.
- `server/db.ts` exports a single `pg.Pool` (`DATABASE_URL` overrides `PG_*`).
- `server/middleware/auth.ts` exports `requireAuth` (verifies a `Bearer <ID-token>`) and `requireAdmin` (then checks `users.role = 'admin'` in Postgres). Both initialize `firebase-admin` once via `applicationDefault()` if `GOOGLE_APPLICATION_CREDENTIALS` is set, else by project ID only.
- Migrations are applied in order by `scripts/db-migrate.sh`: `001_initial.sql` → `002_assets.sql` → `003_infrastructure_config.sql`. Add new files with monotonic prefixes; `db-migrate.sh` runs them all unconditionally (it is **not** an idempotent migrator — write your SQL with `IF NOT EXISTS` etc.).
- The Postgres `users` table is the canonical role store on the server side; `requireAdmin` reads from it.

### Frontend → API contract (`src/lib/api.ts`)
All HTTP calls go through `request()` in `src/lib/api.ts`, which attaches `Authorization: Bearer <Firebase ID token>` automatically. Per-entity helpers (`clientsApi`, `sitesApi`, …) are the **only** sanctioned way to talk to the API — don't inline `fetch('/api/...')` in components. The API uses `snake_case` JSON; some helpers re-map to camelCase at the boundary (see `ClientProvider`'s `parent_client_id` → `parentClientId` mapping).

### Provider stack (top-down)
`main.tsx` → `App` → `ErrorBoundary` → `BrowserRouter` → `AuthProvider` → `ClientProvider` → `SiteProvider` → `AppContent`

`AppContent` short-circuits to `<Login />` when there's no authenticated user; otherwise renders the routed `<Layout>` plus a global `<NetworkAI />` overlay (the Gemini chat assistant is mounted at the app root, not per-route).

> Historical note: `TenantProvider` was replaced by `ClientProvider` + `SiteProvider` (clients have parent/child hierarchy via `parent_client_id`; sites belong to a client). The migration script is `scripts/migrate-tenants-to-clients-sites.mjs`. `selectedClientId` / `selectedSiteId` are in-memory only (no persistence).

### Auth & roles
Three roles: `admin`, `developer`, `viewer`. Defaults to `viewer`.

**Admin bootstrap email is the single source of truth `config/bootstrap-admin.ts` (`ADMIN_BOOTSTRAP_EMAIL`)**, but it must be kept in sync with **`firestore.rules`** (the `isAdmin()` helper hardcodes the email — it cannot import TS). When changing the admin email, update both:
1. `config/bootstrap-admin.ts` — used by `src/components/AuthProvider.tsx` and `server/routes/users.ts` (the API user-sync endpoint that promotes first-login).
2. `firestore.rules` line ~75 — hardcoded literal.

Profile is stored both in Firestore (`/users/{uid}`, upserted on every `onAuthStateChanged`) and Postgres (`users` table, upserted via `POST /api/users/sync`). The route `/users` (admin UI) is gated in `App.tsx` via `isAdmin && <Route ...>`; the API enforces it again via `requireAdmin`.

### Gemini integration (`src/services/gemini.ts`)
Single shared `GoogleGenAI` instance. Model IDs are centralized in the exported `models` map — prefer adding new helpers to this file rather than instantiating `GoogleGenAI` elsewhere. Several helpers (`generateVideo`, `generateMusic`, `textToSpeech`) return blob-URL strings that the caller is responsible for revoking.

### Routing & layout
All routes are nested under a single `<Layout>` (`src/components/Layout.tsx`) which renders the sidebar + header + `<Outlet />`. The sidebar nav is hardcoded in `navItems`; adding a page means editing `App.tsx` (route) and `Layout.tsx` (nav entry). The `/users` route is conditionally rendered for admins only.

### Docker
- `docker-compose.yml` — local stack (`db` + `api` + `web` via nginx). `db:up` brings it up. The DB container auto-runs `server/migrations/*.sql` on first boot via `/docker-entrypoint-initdb.d/`, so `npm run db:migrate` is only needed when the volume already exists.
- `docker-compose.prod.yml` + `docker/Dockerfile.{api,web}` + `docker/nginx/` — production deployment. `Dockerfile.web` takes `GEMINI_API_KEY` as a build arg (it must be present at build time to be inlined into the Vite bundle).

### Conventions
- Path alias `@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`).
- All Firebase client SDK functions are re-exported from `src/firebase.ts` — import from there, not directly from `firebase/*`, to keep the SDK surface area centralized.
- Firestore-side errors should go through `handleFirestoreError(err, OperationType.X, path)` from `src/lib/firestore-errors.ts`, which attaches auth context and rethrows a JSON-stringified payload.
- API-side errors surface as plain `Error` from `src/lib/api.ts`; the message is taken from the response's `error` field when present.
- UI primitives live in `src/components/ui/` (shadcn-style: `button`, `card`, `dialog`, `select`, etc.). Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional class names.
- Tailwind v4 theme tokens live in `src/index.css` (no `tailwind.config.js`).
- Several pages are very large single files (e.g. `Infrastructure.tsx`, `Assets.tsx`, `Racks.tsx`). Prefer in-place edits over splitting unless explicitly asked.
