# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this project is

求职申请管理看板（Job Application Tracker Dashboard）for college students. Single-user local app — tracks申请 through a stage funnel with DDL reminders, a calendar, a stats dashboard, and per-interview复盘 records. No auth, no multi-tenant, no external services.

## Commands

```bash
npm run dev          # dev server, http://localhost:3000
npm run build        # production build (also runs TS typecheck)
npm run lint
npm run db:migrate   # create + apply migration after schema change
npm run db:generate  # regenerate Prisma client into src/generated/prisma
npm run db:studio    # open Prisma Studio to inspect data
npm run db:seed      # reset & reseed ~10 sample applications (destructive)
npm run db:reset     # drop DB, re-run all migrations, re-seed
```

`pnpm` is not available on this machine — **use `npm`**. SQLite DB lives at `./dev.db` (project root, not `prisma/dev.db`). Don't commit it.

## Architecture

### Data model

Three tables defined in `prisma/schema.prisma`:

- **`Application`** — one row per job application. `stage` is a string (see below).
- **`StageEvent`** — append-only audit log of stage transitions. Every stage change writes one row. Powers the detail page timeline.
- **`Interview`** — face-to-face复盘 records (round, format, questions, self-rating, mood).

SQLite doesn't support native enums, so stages/levels/channels/formats are all strings validated by Zod at the action boundary. **Don't reach for enum migrations.**

### The Stage enum is a load-bearing contract

`src/lib/stages.ts` is the single source of truth for all stage-related UI and logic:

- `STAGE_ORDER: Stage[]` — order of kanban columns, funnel bars, and timeline progression
- `STAGE_LABEL` — zh-CN display names
- `STAGE_TONE` — Tailwind classes for column dots, card accents, stat colors
- `ACTIVE_STAGES` — `STAGE_ORDER` minus `REJECTED`, used as the default board

**When adding/renaming/reordering a stage:** update `STAGE_ORDER` + `STAGE_LABEL` + `STAGE_TONE` + `STAGE_COLORS` (in `src/app/stats/page.tsx`) + the `stageEnum` literal in `src/lib/schemas.ts` together. No migration needed since stages are stored as strings, but existing rows with deleted stage names will stop rendering correctly.

### Mutations go through Server Actions, not API routes

All writes live in `src/actions/applications.ts` and `src/actions/interviews.ts`. Pattern:

1. `"use server"` at top.
2. Parse input with a Zod schema from `src/lib/schemas.ts` (`safeParse` → return `{ ok: false, errors }` on failure).
3. Write via `prisma` singleton from `src/lib/prisma.ts`.
4. `revalidatePath('/')`, `/applications`, `/calendar`, `/stats` — the helper `revalidateAll()` covers these four.
5. Return `{ ok: true, ...payload }`.

`updateStage` is the only action that atomically writes two rows (in a `$transaction`): updates `Application.stage` AND inserts a `StageEvent`. Do not bypass this — the timeline depends on it.

The kanban uses **optimistic updates**: `KanbanBoard` moves the card in local state first, then calls `updateStage` in a `startTransition`. If the action fails, the snapshot is restored and an error toast shown. Keep this pattern when adding new drag-to-mutate UIs.

### Prisma client setup (non-obvious)

Prisma 7 requires a **driver adapter** — `new PrismaClient()` with no args throws. Both `src/lib/prisma.ts` (runtime) and `prisma/seed.ts` construct the client with `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3`. The generated client is at **`src/generated/prisma/client`** (not `@prisma/client`), per the `output` field in `schema.prisma`. Always import `PrismaClient` and model types (`Application`, `StageEvent`, `Interview`) from there.

The `DATABASE_URL` in `.env` is `file:./dev.db`. The lib helper strips the `file:` prefix and passes the path to the adapter.

### Next.js 16 specifics

- `params` and `searchParams` are **Promises** — `await` them in page components.
- Bundled docs live in `node_modules/next/dist/docs/` (see `AGENTS.md`). Read them before using unfamiliar APIs — training data is older than the installed version.
- Pages that read from the DB use `export const dynamic = "force-dynamic"` because static prerender has no request context and would hit an empty DB at build time.

### UI stack quirks

- **shadcn/ui `base-nova` preset** — built on `@base-ui/react`, not Radix. Select/Dialog/etc. APIs are similar but not identical. The `Form` component isn't in this preset, so forms use `react-hook-form` directly with a local `NativeSelect` helper (see `src/components/forms/application-form.tsx`).
- **Tailwind v4** — config is CSS-only via `@theme inline` in `src/app/globals.css`. No `tailwind.config.ts`.
- Zh-CN everywhere. `date-fns` is called with `{ locale: zhCN }`; the root `<html lang="zh-CN">`.

## When you change the schema

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate` — creates migration + applies + regenerates client.
3. If you touched `Application`/`Interview` shape: update the relevant Zod schema in `src/lib/schemas.ts` and any `select: { ... }` projection in `src/app/**/page.tsx` that enumerates fields.
4. Seed data may need updating — `npm run db:seed` to re-verify.
