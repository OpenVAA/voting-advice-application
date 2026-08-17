---
phase: 126-svelte-check-0-supabasedataprovider
plan: 01
subsystem: database
tags: [supabase, typescript, codegen, types, get_nominations, svelte-check]

# Dependency graph
requires:
  - phase: prior-schema-migrations (00001/00002)
    provides: get_nominations RPC + admin_jobs table live in local schema
provides:
  - Typed get_nominations Args/Returns in packages/supabase-types/src/database.ts
  - Regenerated generated types (7 functions + admin_jobs table + p_-prefixed arg renames)
  - Measured 133 -> 50 svelte-check leg of the D-02/D-06 accounting
affects: [126-02, 126-03, 126-04, 126-05, phase-127-writer-cluster]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Generated Supabase types are the single source of truth — regenerated verbatim via yarn db:types, never hand-edited (D-01/D-02)."

key-files:
  created: []
  modified:
    - packages/supabase-types/src/database.ts

key-decisions:
  - "Root-cause fix via regen only (provider code untouched) clears 75 of 79 target-file errors, taking svelte-check 133 -> 50."
  - "Regen's cross-file blast radius (writer/adminWriter + arg renames) is permitted under D-02 'no hand-trimming' — error reduction, not net-new."

patterns-established:
  - "Pattern: type staleness is fixed at the codegen source (yarn db:types), not by hand-editing generated declarations."

requirements-completed: [TYPE-04]

coverage:
  - id: D1
    description: "get_nominations RPC is fully typed in generated database.ts (32-col Returns row array matching 503-entity-rpcs.sql; JSONB->Json, entity_type->enum, uuid->string, integer->number)."
    requirement: "TYPE-04"
    verification:
      - kind: automated
        ref: "grep -c get_nominations packages/supabase-types/src/database.ts (>=1)"
        status: pass
      - kind: other
        ref: "Column-by-column spot-check of regenerated Returns vs apps/supabase/supabase/schema/503-entity-rpcs.sql:11 (32 cols, exact match)"
        status: pass
    human_judgment: false
  - id: D2
    description: "svelte-check drops 133 -> 50 around the regen commit; only net-new pair is 259/260 inside supabaseDataProvider.ts, no net-new errors outside the target file."
    requirement: "TYPE-04"
    verification:
      - kind: automated
        ref: "cd apps/frontend && yarn check -> COMPLETED 2090 FILES 50 ERRORS 1 WARNINGS (was 133)"
        status: pass
      - kind: automated
        ref: "yarn check error lines: only 259:/260: supabaseDataProvider.ts are net-new (both inside target file)"
        status: pass
    human_judgment: false

# Metrics
duration: 2min
completed: 2026-07-16
status: complete
---

# Phase 126 Plan 01: Regenerate Supabase Types (get_nominations) Summary

**Regenerated the stale generated Supabase types via `yarn db:types`, making `get_nominations` fully typed (32-col Returns matching the SQL ground truth) and dropping svelte-check from 133 -> 50 errors in one atomic regen commit.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-07-16T07:46:55Z
- **Completed:** 2026-07-16T07:48:49Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Captured pre-regen baseline `COMPLETED 2090 FILES 133 ERRORS 1 WARNINGS`.
- Confirmed local Supabase Postgres up (`yarn db:status`), ran `yarn db:types` (exit 0) — regenerated `database.ts` with measured diff of 170 insertions / 18 deletions (matches RESEARCH exactly).
- `get_nominations` now typed under `Database['public']['Functions']`: `Args: { p_constituency_id?, p_election_id?, p_include_unconfirmed? }`, `Returns` a 32-column row array — spot-checked column-by-column against `503-entity-rpcs.sql:11` (exact match; JSONB columns `Json`, `entity_type` the enum, uuid `string`, integer `number`).
- Post-regen svelte-check `COMPLETED 2090 FILES 50 ERRORS 1 WARNINGS` — 133 -> 50 recorded for D-02 accounting.
- Verified the only net-new errors are the 259/260 pair inside `supabaseDataProvider.ts` (RPC args now typed `string | undefined` vs `string | null`) — cleared by plan 126-03. No net-new errors outside the target file.
- Committed only `packages/supabase-types/src/database.ts` as one atomic regen commit.

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: regenerate types, verify shape, capture 133->50, atomic commit** - `2e0c6fa32` (chore)

_Note: Tasks 1 and 2 both operate on the single regenerated `database.ts` artifact and share one atomic regen commit (D-02 mandates a single atomic regen commit touching only `database.ts`)._

**Plan metadata:** (docs commit follows — SUMMARY.md, STATE.md, ROADMAP.md)

## Files Created/Modified
- `packages/supabase-types/src/database.ts` - Regenerated verbatim from live local schema; adds typed `get_nominations` + 6 other functions (`get_candidate_user_data`, `is_localized_string`, `is_valid_choice_id`, `jsonb_recursive_merge`, `merge_custom_data`, `merge_jsonb_column`) + `admin_jobs` table + `p_`-prefixed arg renames.

## Decisions Made
- None beyond the plan — regen-only root-cause fix executed exactly as specified.

## Deviations from Plan

None affecting execution. One evidence-accuracy note (not a deviation in behavior):

- The plan/RESEARCH stated a "33-column" `Returns`. The ground-truth `RETURNS TABLE` in `apps/supabase/supabase/schema/503-entity-rpcs.sql:11` has **32 columns**, and the regenerated `Returns` matches it exactly at 32 columns. The regen is verbatim from the schema (the single source of truth per D-01), so the shape is correct; the "33" in the plan text was an off-by-one in the RESEARCH count. The verified figure is 32, matching SQL 1:1. All acceptance-relevant properties (JSONB->`Json`, `entity_type`->enum, uuid->string, integer->number, all `_getNominationData`-read columns present) hold.

## Issues Encountered
- `get_nominations` was present after the first `yarn db:types` (migration state was current), so the `yarn db:reset` fallback in Task 2 was not needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `get_nominations` typed at source; `SupabaseClient<Database>.rpc('get_nominations')` now resolves to the typed row array.
- Residual target-file errors 259/260 (and 374/549 per RESEARCH) remain for plan 126-03 provider-typing work; count expected to land at ~46 after that.
- Phase 127 writer-cluster scope re-scoped downward: the regen already cleared ~9 writer/adminWriter errors as an unavoidable, permitted consequence of D-02's no-hand-trim regen.

## Self-Check: PASSED
- FOUND: packages/supabase-types/src/database.ts
- FOUND: .planning/phases/126-svelte-check-0-supabasedataprovider/126-01-SUMMARY.md
- FOUND commit: 2e0c6fa32

---
*Phase: 126-svelte-check-0-supabasedataprovider*
*Completed: 2026-07-16*
