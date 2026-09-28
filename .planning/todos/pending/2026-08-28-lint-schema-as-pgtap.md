---
created: "2026-08-28T00:00:00.000Z"
title: The two schema advisors live outside the test suite and are gated separately from it
area: database
severity: low
source: Phase 156 (supabase-schema-corrections) criterion 8 / REVIEW-DB-08, item 2 — dispositioned ANSWERED-ON-THE-RECORD in 156-DISPOSITIONS.md Entry 2
files:
  - apps/supabase/scripts/lint-schema.mjs
  - apps/supabase/package.json
  - apps/supabase/supabase/tests/database
  - package.json
related_phase: 163
---

## Problem

`apps/supabase/scripts/lint-schema.mjs` (182 lines, measured 2026-08-30 — `156-RESEARCH.md` says 185
and an earlier todo says 174; neither matches the file) implements two Supabase Splinter advisors as
raw SQL run against a live local Postgres: **0013**, tables in `public` with row-level security
disabled, at ERROR level; and **0001**, foreign keys whose referencing columns have no covering
index, at WARNING level. It is wired as `lint:schema` in `apps/supabase/package.json:13`, chained
into `lint:all` at `:14`, which the repository root reaches as `db:lint:sql` (`package.json:24`).

That places both advisors **outside** the pgTAP suite. Their findings are not part of any assertion
count, they are gated by a different command from the one that gates every other database
invariant, and the command that carries them — `yarn db:lint:sql` — has exited **1** continuously
since Phase 151 on four pre-existing PL/pgSQL advisories (`.planning/WINDOWS.md` 17 / 115 / 125).
A signal that is always red is a signal nobody reads, so a genuinely new advisor finding would
arrive in the one channel already conditioned to be ignored.

The re-expression is not free, which is why Phase 156 recorded the question rather than answering it
by refactoring. The script's shape is not the suite's shape: it queries the whole schema at once and
reports a *set* ("these tables have RLS disabled"), whereas pgTAP asserts per named object inside a
per-file `plan(N)`. A naive translation gives either one catch-all assertion that reports a count
without naming the offender, or a hand-maintained enumeration of every table that silently stops
covering tables added later — the exact failure mode a schema advisor exists to prevent.

Both halves also need a live Postgres (`lint-schema.mjs:27` reads `DATABASE_URL`, defaulting to the
local port), so any CI job must `supabase start` first. A bare step fails on connection and reads as
a false gate.

## Solution

TBD — evaluate, in this order:

- **`results_eq` against an empty expected set.** This keeps the whole-schema shape *inside* pgTAP:
  one assertion per advisor whose expected result is zero rows, and whose failure output names every
  offending table. It preserves the "covers tables added later" property the enumeration form loses.
  Try this first; if it works the other options are moot.
- **Keep the script, add a CI step.** Cheapest, and it settles the always-red problem separately by
  deciding what to do about the four pre-existing PL/pgSQL advisories (baseline them, or fix them).
- **Split.** The catalogue-shaped advisor (unindexed foreign keys) moves to pgTAP where it reads
  naturally; the whole-schema RLS report stays in the script.
- Whichever is chosen, decide **where the pgTAP job runs in CI and how it gets a live database** —
  that decision belongs to the same phase and is currently the binding constraint on all three
  options.
