---
phase: 127-svelte-check-0-adapter-layer-contexts
plan: 02
subsystem: frontend-adapter-types
tags: [svelte-check, type-hygiene, supabase-adapter, json-column, TYPE-05]
requires:
  - Phase 127 Plan 01 (context/prepareDataWriter errors cleared; svelte-check at 28/1)
provides:
  - supabaseDataWriter.ts at 0 svelte-check errors
  - supabaseAdminWriter.ts at 0 svelte-check errors
  - JobMessage as a Json-assignable type alias
affects:
  - apps/frontend/src/lib/server/admin/jobs/jobStore.type.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
tech-stack:
  added: []
  patterns:
    - "Pattern A: interface -> type alias for objects written to a Supabase Json/jsonb column (type aliases get TS's implicit index signature; interfaces do not)"
    - "Pattern B: documented `as Json` boundary cast (// reason: idiom) for jsonb-safe payloads that can't be statically expressed as Json"
    - "Pattern C: `Tables<'x'>` not `Tables<'x'>['Row']` — and drop the annotation entirely when the select is partial"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/server/admin/jobs/jobStore.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
decisions:
  - "Task 2 error ①: the plan-prescribed bare `Tables<'nominations'>` annotation was too WIDE for the 7-column partial `.select()` and produced a new incompatibility error; dropped the explicit annotation entirely and let TS infer the narrow selected shape (behavior-neutral). Removed the now-unused `Tables` import to keep lint clean."
metrics:
  duration: 3min
  completed: 2026-07-16
status: complete
---

# Phase 127 Plan 02: Clear TYPE-05 Writer/AdminWriter Errors Summary

Cleared all 4 TYPE-05 svelte-check errors in the Supabase adapter writers with zero runtime change — flipped `JobMessage` from an interface to a structurally-identical type alias (fixing both `admin_jobs.messages` insert sites at source), dropped a redundant partial-select annotation, and added one documented `as Json` boundary cast at the `upsert_answers` RPC. svelte-check moved 28/1 → 24/1.

## What Was Built

**Task 1 — JobMessage interface -> type alias** (`jobStore.type.ts`):
- Converted `export interface JobMessage { ... }` to `export type JobMessage = { ... }`, structurally identical (same three fields, same ISO comment).
- Type aliases receive TypeScript's implicit index signature; interfaces do not — so `JobMessage[]` became assignable to the `admin_jobs.messages` `Json | null` column.
- Fixed BOTH `admin_jobs` insert sites (`supabaseDataWriter.ts:415` and `supabaseAdminWriter.ts:49`) at the source with no cast and no edit to either insert statement.
- `project_id` untouched (the "project_id does not exist" text is overload-2 decoy noise).

**Task 2 — supabaseDataWriter residuals**:
- Error ① (nominations map, line 242): removed the redundant `Tables<'nominations'>['Row']` annotation. The plan prescribed bare `Tables<'nominations'>`, but that full-Row type is wider than the 7-column partial `.select()` and produced a new incompatibility — so the annotation was dropped entirely, letting TS infer the narrow selected shape. Removed the now-unused `Tables` import.
- Error ② (`upsert_answers` RPC, line ~321): asserted `p_answers: processedAnswers as Json` with a `// reason:` comment placed strictly downstream of the File-to-`{ path }` replacement loop. No `as any`. `Json` was already imported.

## svelte-check Per-File Accounting

| File | Before (errors) | After (errors) |
|------|-----------------|----------------|
| `supabaseDataWriter.ts` (excl .test.ts) | 3 (242, 319, 415) | 0 |
| `supabaseAdminWriter.ts` (excl .test.ts) | 1 (49) | 0 |
| **Total (whole frontend)** | 28 errors / 1 warning | 24 errors / 1 warning |

Net decrease of 4 errors, matching the plan target exactly (24/1 expected).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Nominations map annotation was too wide for the partial select**
- **Found during:** Task 2 (error ①)
- **Issue:** The plan/PATTERNS prescribed changing `(n: Tables<'nominations'>['Row'])` to bare `(n: Tables<'nominations'>)`. But `Tables<'nominations'>` resolves to the FULL 25-column Row type, while the `.select('election_id, constituency_id, ...')` returns only a 7-column shape. The bare annotation is wider than the actual array element, so the `.map()` callback param was incompatible — a NEW svelte-check error at 242:51.
- **Fix:** Dropped the explicit type annotation entirely (`(n) => ({ ... })`), letting TypeScript infer the narrow partial-select shape. Behavior-neutral. This also made the `Tables` import unused, so it was removed from the type-only import (keeping `Json`) to satisfy `unused-imports/no-unused-imports`.
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`
- **Commit:** 0c09dfed4

## Prohibitions — all kept

- `admin_jobs.project_id` untouched.
- No `as any` introduced (used narrow `as Json`).
- `packages/supabase-types/src/database.ts` not edited/regenerated.
- File-to-`{ path }` replacement loop left intact; `as Json` cast is strictly downstream of it.
- Existing null-guard at the RPC return (`(data as unknown as LocalizedAnswers) ?? {}`) preserved (D-03).

## Verification

- `cd apps/frontend && yarn check` — supabaseDataWriter.ts and supabaseAdminWriter.ts both at 0 errors (excl .test.ts); total 24 errors / 1 warning.
- `yarn workspace @openvaa/frontend lint` — no errors on supabaseDataWriter.ts (unused-import cleared).
- Behavior-neutrality (build + full unit + E2E + exact 24/1 gate) is asserted by the phase gate Plan 127-03, which depends on this plan.

## Commits

- `1e728ef9f` fix(127-02): flip JobMessage interface to type alias for Json assignability
- `0c09dfed4` fix(127-02): clear supabaseDataWriter residuals — drop Row index + documented Json cast

## Self-Check: PASSED

All 2 modified source files and both task commits (1e728ef9f, 0c09dfed4) verified present.
