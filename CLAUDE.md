# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run dev          # vite dev server on 0.0.0.0:3000
npm run build        # production build (vite build → dist/)
npm run preview      # preview the production build
npm run lint         # type-check only — runs `tsc --noEmit`
npm run clean        # remove dist/
```

There is no test framework configured. `lint` is purely TypeScript type-checking; there is no ESLint/Prettier setup.

To disable Vite HMR (used by AI Studio to prevent flicker during agent edits), set `DISABLE_HMR=true` before `npm run dev`.

## Environment

Required at runtime (read by `vite.config.ts` from the project root, not `src/`):

- `GEMINI_API_KEY` — injected into client code as `process.env.GEMINI_API_KEY` via Vite's `define`. Used by `src/services/gemini.ts`. AI Studio injects this automatically; locally, put it in `.env.local`.
- `APP_URL` — present in `.env.example` for AI Studio's Cloud Run URL injection; not currently consumed by client code.

Firebase config is **not** in env vars — it is committed at `firebase-applet-config.json` and imported directly by `src/firebase.ts`. Note the non-default Firestore database ID (`firestoreDatabaseId` field) — `getFirestore(app, firebaseConfig.firestoreDatabaseId)` is required; calling `getFirestore(app)` will silently hit the wrong DB.

## Architecture

This is the **Argus-asset-tracker** applet (per `metadata.json`; renamed from "Linkedeye-Finspot") — a multi-tenant on-prem asset inventory + configuration management platform tracking infrastructure, network devices, and operators, with a Gemini AI assistant. Stack: React 19 + Vite 6 + TypeScript + Tailwind v4 + Firebase + `@google/genai`. (The `package.json` `name` field still says `react-example` — that's the AI Studio scaffold name, not the product.)

### Provider stack (top-down)
`main.tsx` → `App` → `ErrorBoundary` → `BrowserRouter` → `AuthProvider` → `TenantProvider` → `AppContent`

`AppContent` short-circuits to `<Login />` when there's no authenticated user; otherwise renders the routed `Layout` plus a global `<NetworkAI />` overlay (the Gemini chat assistant is mounted at the app root, not per-route).

### Auth & roles (`src/components/AuthProvider.tsx`)
- Three roles: `admin`, `developer`, `viewer`. Defaults to `viewer` on first sign-in.
- **Admin is bootstrapped by hardcoded email** `rajkumarmadhu2024@gmail.com` in two places that must stay in sync: `AuthProvider` (sets `role: 'admin'` on first login) and `firestore.rules` (the `isAdmin()` helper). Changing the admin email requires editing both.
- Profile lives at `/users/{uid}` in Firestore and is upserted on every `onAuthStateChanged` event. The route `/users` is admin-only (gated in `App.tsx` via `isAdmin && <Route ...>`).

### Tenants (`src/components/TenantProvider.tsx`)
- The `tenants` collection is **auto-seeded** on first load if empty (`initialTenants` in the provider). Be aware of this when working against a fresh Firebase project — first read triggers writes.
- `selectedTenantId` is in-memory only (no persistence). UI consumers should not assume tenant scoping is enforced server-side; Firestore rules currently scope by user/auth, not tenant.

### Firestore data model
Authoritative schema is `firebase-blueprint.json` (entity definitions + collection paths). Security rules in `firestore.rules` re-validate field-level invariants — when adding a new collection, both files need entries.

Immutable-by-rule collections (no update/delete from clients): `chats/{uid}/messages`, `audit_logs`, `validation_history`, `drifts`, `infrastructure/*/documents`. Don't add update flows for these without changing the rules.

Two device collections coexist: `devices/{deviceId}` (validated by `isValidDeviceConfig`, simpler shape) and `infrastructure/{deviceId}` (validated by `isValidDevice`, the richer inventory shape from the blueprint). The app's Infrastructure/Assets pages use `infrastructure`; `devices` appears to be legacy/auxiliary.

### Gemini integration (`src/services/gemini.ts`)
Single shared `GoogleGenAI` instance. Model IDs are centralized in the exported `models` map — prefer adding new helpers to this file rather than instantiating `GoogleGenAI` elsewhere. Several helpers (`generateVideo`, `generateMusic`, `textToSpeech`) return blob-URL strings that the caller is responsible for revoking.

### Routing & layout
All routes are nested under a single `<Layout>` (`src/components/Layout.tsx`) which renders the sidebar + header + `<Outlet />`. The sidebar nav is hardcoded in `navItems`; adding a page means editing `App.tsx` (route) and `Layout.tsx` (nav entry). The `/users` route is conditionally rendered for admins only.

### Conventions
- Path alias `@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`).
- All Firebase SDK functions are re-exported from `src/firebase.ts` — import from there, not directly from `firebase/*`, to keep the SDK surface area centralized.
- Firestore errors should go through `handleFirestoreError(err, OperationType.X, path)` from `src/lib/firestore-errors.ts`, which attaches auth context and rethrows a JSON-stringified payload.
- UI primitives live in `src/components/ui/` (shadcn-style: `button`, `card`, `dialog`, `select`, etc.). Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional class names.
- Tailwind v4 is wired via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`; theme tokens live in `src/index.css`.
- Several pages are very large single files (e.g. `Infrastructure.tsx` ~128 KB, `Assets.tsx` ~95 KB, `Racks.tsx` ~38 KB). Prefer in-place edits over splitting unless explicitly asked.
