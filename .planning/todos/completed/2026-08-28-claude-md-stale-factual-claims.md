---
created: "2026-08-28T00:00:00.000Z"
title: CLAUDE.md carries three stale factual claims that misdirect planners
area: docs
files:
  - CLAUDE.md
  - packages/app-shared/tsup.config.ts
  - package.json
  - apps/supabase/scripts/lint-schema.mjs
resolves_phase: 160
related_phase: 163
---

## Problem

Three claims in `CLAUDE.md` are false against the tree. Both were caught during v2.15
CONTEXT generation, each by an agent that had been *told* the claim as background and
measured it rather than accepting it.

### 1. `db:lint:sql` is not sqlfluff (`CLAUDE.md:87`)

`CLAUDE.md` reads:

> `yarn db:lint:sql`    # Run SQL linter on all migrations (sqlfluff + Splinter advisors)

Measured: the script is `supabase db lint --schema public --fail-on warning` plus a
174-line `lint-schema.mjs` implementing two Splinter advisors. **There is no sqlfluff
anywhere in the repo.**

This is not a cosmetic error. Phase 163's roadmap criterion 1 requires "a deliberate
**sqlfluff** violation pushed to a migration turns the build red" — an unachievable
proof as written. The plant has to target plpgsql_check or a named advisor instead.
The false premise has two homes (`CLAUDE.md:87` and the ROADMAP criterion), so fixing
one leaves the other to mislead the next reader.

Both halves also need a live Postgres (`lint-schema.mjs:27`), so any CI job must
`supabase start` first — a bare step would fail on connection and read as a false gate.

### 2. `@openvaa/app-shared` does not build CommonJS

`CLAUDE.md` describes `@openvaa/app-shared` as building "to both ESM (frontend) and
CommonJS (backend)". Measured: `packages/app-shared/tsup.config.ts:5` is
`format: ['esm']`, the `exports` map has no `require` condition, and all six consumers
are ESM.

This one actively misdirected planning: Phase 157's F5 NOTES moves the structured
logger into `app-shared`, and the brief for that phase carried the ESM+CJS claim
forward as a constraint on the logger. It is not a constraint — there is no CJS build
to satisfy.

### 3. The local adapter is server-side only (`CLAUDE.md:191`)

`CLAUDE.md` reads:

> - No adapter switch -- Supabase is the only production adapter (local adapter available for static data)

Measured, the claim is half true and the true half is the surprising one.
`apps/frontend/src/lib/api/adapters/` contains only `apiRoute/` and `supabase/` -- there
is **no client-side local adapter**, and `apps/frontend/src/lib/api/dataProvider.ts` is a
one-line unconditional re-export of the Supabase provider. But a local adapter does still
exist and is still wired on the **server** side, under
`apps/frontend/src/lib/server/api/adapters/local/`, selected at runtime by
`staticSettings.dataAdapter.type === 'local'` in
`apps/frontend/src/lib/server/api/dataProvider.ts:6-14`.

As written, the line sends a reader looking for a client-side local adapter that is not
there, and hides a server-side one that is. Phase 157 corrected the identical claim in
`apps/frontend/src/lib/api/README.md:10`; copy that wording. Check `CLAUDE.md:246` at the
same time -- "also copies `apps/frontend/data/` folder if present for local adapter" is the
local adapter's data source and was not verified when this was filed.

Restoring the client-side adapter is tracked separately in
`2026-08-28-reintroduce-the-local-data-adapter.md`; if that lands first, this line needs
the opposite correction, so check the todo before editing.

## Solution

Fix all three lines. Phase 160 owns `CLAUDE.md` (decision I2(a) trims it to commands + hard
conventions), so the edits belong there — but the sqlfluff claim should be corrected
in the ROADMAP's Phase 163 criterion 1 at the same time, since a planner reading only
the roadmap never sees `CLAUDE.md`.

While in the area, check the rest of the `db:*` / `dev:*` command block against
`package.json` — these two were found incidentally, not by an audit, so the base rate
of stale claims in that section is unmeasured.

## Why this is filed rather than fixed

`CLAUDE.md` is Phase 160's deliverable surface. Editing it mid-planning would collide
with a phase that is about to be planned against its current state.

## Update 2026-09-03 — claim 1 is CORRECTED; claims 2 and 3 remain open for Phase 160

**Claim 1 (`db:lint:sql` is not sqlfluff) was corrected by Phase 163** at plan 163-09, because 163
built the CI job that runs that command and left the line provably wrong twice over: there is no
sqlfluff in this repository, and the linter never opens a migration file — it reads the APPLIED
database. `CLAUDE.md:87` now names `supabase db lint` (plpgsql_check) plus the two Splinter-derived
advisors in `apps/supabase/scripts/lint-schema.mjs`, and states that a running local Postgres is
required. `grep -c 'sqlfluff' CLAUDE.md` returns **0**.

**Claims 2 and 3 are untouched and still belong to Phase 160** (Agent Docs & Skills Refresh), which
owns `CLAUDE.md` as a deliverable surface under decision I2(a). This is a deliberate handover, not a
collision: 163 corrected only the one line its own work falsified, and left the file's remaining
stale claims — and the unmeasured base rate in the `db:*` / `dev:*` command block this todo flags —
to the phase that owns the whole file. Phase 160 should still audit that block; 163 checked only the
single line it was entitled to.

The ROADMAP half of claim 1 (Phase 163 criterion 1 saying "a deliberate **sqlfluff** violation")
was NOT edited by 163 either — its plans prohibit editing `ROADMAP.md`. It is discharged in
substance rather than in wording: `163-CI-EVIDENCE.md` §3 records the plant that actually reddened
the `sql-lint` job (an unused variable caught by plpgsql_check, runs 33790909985 / 33791749587), and
the roadmap's word "sqlfluff" should be read as "the SQL linter" by anyone arriving there later.

## CLOSED 2026-09-13 — Phase 160, plan 04

All three claims are corrected; the one residual is handed to a named todo. Closing per-claim, with
the plan that did the work:

| Claim                                         | Corrected by            | Evidence at `e8052177c`                                                                                                                                           |
| --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. `db:lint:sql` is not sqlfluff              | **Phase 163, plan 09**  | `grep -c 'sqlfluff' CLAUDE.md` returns 0; the line names `supabase db lint` plus `apps/supabase/scripts/lint-schema.mjs` and states the live-Postgres requirement |
| 2. `@openvaa/app-shared` does not build CommonJS | **Phase 160, plan 01** | `CLAUDE.md:132` reads **ESM-only** and cites `format: ['esm']` from `packages/app-shared/tsup.config.ts`                                                          |
| 3. The local adapter is server-side only      | **Phase 160, plan 01**  | `CLAUDE.md:199` states there is no client-side local adapter and names `apps/frontend/src/lib/server/api/adapters/local/`                                         |

**The command-block audit this todo asked for is also done.** Re-run at `e8052177c`:
`grep -oE '^yarn [a-z0-9:_-]+' CLAUDE.md | sed 's/^yarn //' | sort -u` yields 25 distinct
invocations; 22 are `package.json` scripts and all 22 exist, and the remaining 3 (`install`,
`playwright`, `workspace`) are Yarn built-ins rather than scripts. **0 missing.** The base rate of
stale claims in that block, which this todo flagged as unmeasured, is measured and is zero.

**The one residual is carried, not dropped.** Claim 1's second home — `.planning/ROADMAP.md:1547`,
Phase 163 criterion 1, still saying "a deliberate **sqlfluff** violation" — was not corrected here,
because Phase 160 is prohibited from editing `.planning/ROADMAP.md` (concurrent agent surface). It
is filed as Rider 2 of `.planning/todos/pending/2026-08-28-broken-docs-script-references.md`.
