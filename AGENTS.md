# AGENTS.md

Compact reference for OpenCode sessions. For full architecture, commands, and conventions, see [CLAUDE.md](./CLAUDE.md).

## Quick start

```bash
cp .env.example .env.local   # set AUTH_BYPASS=true for local dev without JWT
npm install
npm run db:up                # start Postgres (docker)
npm run db:migrate           # run SQL migrations (001→004)
npm run dev & npm run server # terminal 1: Vite :3000  terminal 2: Express :4000
```

## Auth

PostgreSQL-only JWT auth. No Firebase needed.
- Login: `POST /api/auth/login` → returns `{ token, user }`, store `token` in `localStorage` as `jwt`
- Register: `POST /api/auth/register` → same response
- `GET /api/auth/me` → current user profile
- Set `AUTH_BYPASS=true` in `.env.local` for local dev (all requests become admin)

## Critical gotchas

- **`@/*` alias** only works in frontend code (`tsconfig.json`). Server files under `server/` use relative imports — do not use `@/` there.
- **Backend runs via `tsx`**, not a build step. `tsconfig.server.json` targets CommonJS for rare prebuild needs (`dist-server/`).
- **`npm run lint` = `tsc --noEmit`** only. No ESLint, no Prettier, no other linter.
- **Vite `strictPort: true`** on port 3000 — fails loudly instead of moving to 3001.
- **`DISABLE_HMR=true`** before `npm run dev` prevents flicker during agent edits (used in AI Studio).
- **No test framework configured.** No tests exist; don't look for them.

## Admin bootstrapping

Hardcoded email `rajkumarmadhu2024@gmail.com` in two places that must stay in sync:
- `src/components/AuthProvider.tsx`
- `server/routes/users.ts` (admin check on role assignment)

## File to edit when adding a page

Both `src/App.tsx` (route) and `src/components/Layout.tsx` (sidebar nav) — there is no auto-discovery.

## Immutable collections (security rules removed)

Previously Firestore collections had immutable rules. Now all data is in PostgreSQL.

## Frontend API calls

All `/api` fetches must go through `src/lib/api.ts`. Do not create ad-hoc `fetch()` calls elsewhere. Vite proxies `/api/*` → Express, so use relative paths.

## Large page files

Prefer in-place edits: `Infrastructure.tsx` (~128 KB), `Assets.tsx` (~95 KB), `Racks.tsx` (~38 KB).

## File uploads

`POST /api/upload` with `FormData('file')` → returns `{ url, name, type }`. Files stored in `uploads/` directory, served statically at `/uploads/`.
