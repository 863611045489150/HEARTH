# Hearth

A minimalist, premium family AI workspace. One surface where every family member speaks or types naturally — the app structures input into the correct format (grocery list, business ledger, note, shipping calculation) without touching a menu. Feels like Apple, Linear, and Notion had a child that only speaks in whitespace.

## Run & Operate

- `pnpm --filter @workspace/hearth run dev` — frontend (port $PORT, proxy at `/`)
- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, proxy at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Framer Motion, Wouter
- API: Express 5, Drizzle ORM, PostgreSQL (Replit built-in)
- Auth: Supabase Auth (email/password) — token stored in `localStorage` key `hearth_token`
- AI: Multi-provider router (Groq → Gemini → Cerebras), automatic fallback, never duplicates providers
- Validation: Zod (zod/v4), Orval codegen from OpenAPI spec
- Build: esbuild (CJS bundle for server)

## Design System

- Background: `#FFFFFF` · Text: `#1A1A1A` · Accent: `#FF6B35` (orange — used only on active states, profile dot, primary actions)
- Headings: Playfair Display · Body: Inter · Data/tables: JetBrains Mono
- No gradients, no shadows (max 1px hairline border), no illustrations, no emoji in UI chrome
- Animations: fade/slide only, 200ms max, Framer Motion
- Sidebar: icon-only by default, expands with labels on hover

## Where Things Live

- `artifacts/hearth/src/` — React frontend
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/ai-router.ts` — multi-provider AI fallback router
- `artifacts/api-server/src/middlewares/auth.ts` — Supabase JWT auth middleware
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions

## Architecture Decisions

- **Supabase for auth only** — user accounts, JWT tokens. All app data lives in Replit's built-in PostgreSQL via Drizzle, not in Supabase tables.
- **AI provider rotation** — Groq first (fastest), then Gemini, then Cerebras. Single key per provider, no duplicate keys. Falls back automatically on error or rate-limit.
- **Profile-first personalization** — user's free-text profile is parsed once by AI into role/useCases/tone, then prepended as system context on every subsequent AI call.
- **Natural language → structured data** — `/api/ai/process` classifies input as list/table/calculation/business_record/note and returns JSON; the frontend renders the correct component type.
- **Token in localStorage** — stored as `hearth_token`, read by `lib/api-client-react/src/custom-fetch.ts` as `Authorization: Bearer`.

## Required Environment Variables

All secrets set via Replit Secrets:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`
- `DATABASE_URL` — auto-provisioned by Replit

## User Preferences

- Accent color: `#FF6B35` (warm orange) — never change this, never add a second accent
- Fonts: Playfair Display (headings), Inter (body), JetBrains Mono (data) — all three must stay
- No emoji in UI chrome
- Animations must stay under 200ms, no bouncy easings

## Gotchas

- After any OpenAPI spec change, always run codegen before touching routes: `pnpm --filter @workspace/api-spec run codegen`
- After adding new schema files to `lib/db/src/schema/`, run `pnpm run typecheck:libs` to rebuild declarations before typechecking the API server
- Zod schema names from `@workspace/api-zod` follow operationId naming (e.g. `CreateNoteBody`, `UpdateNoteBody`) — NOT the OpenAPI component names (e.g. `NoteInput`, `NoteUpdate`)
- The `date` column in `auction_entries` uses `mode: "string"` — always convert Date objects to `YYYY-MM-DD` strings before inserting

## Pointers

- See `pnpm-workspace` skill for workspace structure details
- See `lib/api-spec/openapi.yaml` for the full API contract
