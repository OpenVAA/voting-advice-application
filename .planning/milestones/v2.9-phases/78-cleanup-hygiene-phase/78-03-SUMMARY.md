---
phase: 78-cleanup-hygiene-phase
plan: 03
subsystem: hygiene
tags: [clean-03, post-71-carry-forward, per-cast-reason-distribution, setStore-cast-cleanup, claude-md-anchor, hygiene-trio, supabase-data-provider, getroute, claude-md]

# Dependency graph
requires:
  - phase: 71-frontend-strict-typing-cleanup
    provides: "D-04 // reason: convention (cluster-level anchor at supabaseDataProvider.ts); IN-03 setStore cast observation (deferred)"
  - phase: 70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup
    provides: "D-05 // svelte-warning: accepted — <reason> format (Cat A precedent for // reason: blocks)"
provides:
  - "13 per-cast `// reason:` blocks distributed across all JSONB cast sites in supabaseDataProvider.ts (11 image / 2 answer)"
  - "Structural `(store as { set: ... }).set` cast eliminated from getRoute.svelte.ts via Option 2 inline use"
  - "`### Svelte Warning-Accepted Format` sub-section in CLAUDE.md under `## Important Implementation Notes`"
affects: [future-svelte-warning-acceptance-sites, future-jsonb-cast-additions-in-supabase-data-providers, dataContext-setStore-analog-future-phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-cast `// reason:` blocks distinguish image (StoredImage) and answer (LocalizedAnswers) cast categories at each JSONB → domain-type boundary"
    - "Svelte writable store narrowed to Readable via inline-use of `store.set` inside callback (avoids structural-cast pattern)"
    - "`// svelte-warning: accepted — <rationale>` canonical comment format scoped to Svelte-compiler / vite-plugin-svelte / SvelteKit warnings"

key-files:
  created:
    - .planning/phases/78-cleanup-hygiene-phase/78-03-SUMMARY.md
  modified:
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/contexts/app/getRoute.svelte.ts
    - CLAUDE.md
    - .planning/todos/completed/2026-05-10-d04-per-cast-reason-distribution.md
    - .planning/todos/completed/2026-05-10-getroute-setstore-cast-cleanup.md
    - .planning/todos/completed/2026-05-09-claude-md-svelte-warning-accepted-format.md

key-decisions:
  - "CLEAN-03a: 11 image + 2 answer categorization (D-08 default; binary categorization confirmed against HEAD — no settings/metadata casts)"
  - "CLEAN-03b: Option 2 (inline-use) selected per D-09 default; Option 1 (typed assignment) was the documented fallback if typecheck regressed — not needed (Option 2 clean)"
  - "CLEAN-03c: New sub-section placed UNDER `## Important Implementation Notes` after `### Context Destructuring Rule (Svelte 5)` (D-10 default — clusters Svelte conventions)"
  - "dataContext.ts analog `setStore`-narrowing pattern remains OUT OF SCOPE per Deferred Ideas — flagged in Followups for future-phase eradication"
  - "Source todos moved to .planning/todos/completed/ with resolution addenda (per Plan 03 commit_protocol — resolved at landing rather than waiting for Plan 07 close)"

patterns-established:
  - "Per-cast distribution of `// reason:` blocks (one per cast site) supersedes cluster-level anchors when an existing cluster grows ≥3 casts"
  - "Inline `store.set(...)` invocation inside `afterNavigate` (or any callback) is the preferred shape for Svelte writable→Readable narrowing"
  - "Svelte warning acceptance format `// svelte-warning: accepted — <rationale>` is the canonical convention going forward"

requirements-completed: [CLEAN-03]

# Metrics
duration: ~22min
completed: 2026-05-12
---

# Phase 78 Plan 03: CLEAN-03 Hygiene Trio Summary

**13 per-cast `// reason:` blocks distributed across supabaseDataProvider.ts JSONB casts (11 image + 2 answer), `setStore` structural cast eliminated from getRoute.svelte.ts via inline `afterNavigate(() => store.set(buildFn()))`, and `### Svelte Warning-Accepted Format` sub-section added to CLAUDE.md.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-05-12T18:48:00Z (approx)
- **Completed:** 2026-05-12T19:10:00Z (approx)
- **Tasks:** 3 (CLEAN-03a + CLEAN-03b + CLEAN-03c bundled per CONTEXT D-01)
- **Files modified:** 3 source files (supabaseDataProvider.ts, getRoute.svelte.ts, CLAUDE.md) + 3 todos relocated

## Accomplishments

- **CLEAN-03a (supabaseDataProvider.ts):** Removed cluster-level `// reason:` anchor at line 104; distributed 13 per-cast blocks immediately above each cast — 11 sites use `JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.`; 2 sites use `JSONB → LocalizedAnswers shape; structural guard applied inside parseAnswers.`. Grep gate: total reason blocks 14 (13 new + 1 pre-existing `electionIds` anchor at the original line 490, untouched).
- **CLEAN-03b (getRoute.svelte.ts):** Eliminated the `setStore` local AND the structural cast `(store as { set: ... }).set` in one edit; `afterNavigate` now invokes `store.set(buildFn())` directly. Function signature `createGetRoute(): Readable<RouteBuilder>` preserved. Option 2 (inline use) per D-09 default; Option 1 fallback NOT needed (typecheck clean).
- **CLEAN-03c (CLAUDE.md):** Added `### Svelte Warning-Accepted Format` sub-section under `## Important Implementation Notes` (line 340), positioned after `### Context Destructuring Rule (Svelte 5)` to keep Svelte conventions clustered. Documents canonical `// svelte-warning: accepted — <one-sentence-rationale>` format with v2.8 Phase 70 Cat A precedent.

## Task Commits

Each sub-finding committed atomically per Plan 03 commit_protocol (3 separate commits for clean rollback granularity):

1. **Task 1: CLEAN-03a — Distribute per-cast `// reason:` blocks across 13 sites in supabaseDataProvider.ts** — `601822b3b` (refactor)
2. **Task 2: CLEAN-03b — Refactor getRoute.svelte.ts:41 structural cast via inline `afterNavigate(() => store.set(buildFn()))`** — `6068ba4df` (refactor)
3. **Task 3: CLEAN-03c — Add `### Svelte Warning-Accepted Format` sub-section under CLAUDE.md `## Important Implementation Notes`** — `f5793f78f` (docs)

**Plan metadata + todo migrations:** pending in the final docs commit.

## Files Created/Modified

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — 13 per-cast `// reason:` blocks distributed (11 image + 2 answer); cluster-level anchor replaced with per-site reasons.
- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` — `setStore` cast variable removed; `afterNavigate(() => store.set(buildFn()))` inline-use lands.
- `CLAUDE.md` — New `### Svelte Warning-Accepted Format` sub-section at line 340 under `## Important Implementation Notes`.
- `.planning/todos/completed/2026-05-10-d04-per-cast-reason-distribution.md` — moved from `pending/`, resolution addendum appended.
- `.planning/todos/completed/2026-05-10-getroute-setstore-cast-cleanup.md` — moved from `pending/`, resolution addendum appended.
- `.planning/todos/completed/2026-05-09-claude-md-svelte-warning-accepted-format.md` — moved from `pending/`, resolution addendum appended (also fixed pre-existing malformed `</content>\n</invoke>` trailer).

## Decisions Made

- **CLEAN-03a categorization (D-08 default):** Per RESEARCH §"CLEAN-03 Per-cast Categorization" the binary split is 11 image / 2 answer at HEAD — confirmed by grep `as Json as unknown as` returning exactly 13 sites. No `settings/metadata` casts present (those branches at lines 91, 55, 96, etc. are pure structural assertions via `as Record<string, unknown>`, NOT `as Json` casts).
- **CLEAN-03b approach (D-09 default):** Option 2 (inline use) selected. The `store` variable is locally typed `Writable<RouteBuilder>` from the `writable(...)` factory call; `set` is accessible directly without any cast or narrowing. Typecheck passed first attempt — Option 1 (typed assignment fallback) was unnecessary.
- **CLEAN-03c placement (D-10 default):** Sub-section under `## Important Implementation Notes`, placed AFTER `### Context Destructuring Rule (Svelte 5)` to keep Svelte conventions clustered. Not a new top-level section.
- **3 separate commits over single bundled commit:** Selected for clean rollback granularity (per commit_protocol "Claude's Discretion" choice). Each sub-finding is independently revertable.
- **Source todo resolution timing:** Moved to `completed/` with resolution addenda at landing time (not deferred to Plan 07 close as originally hinted in plan output spec). Cleaner state for any concurrent agent reading the todo backlog.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed malformed trailer in source-todo file**
- **Found during:** Task 3 → resolving source todo for 2026-05-09 claude-md-svelte-warning-accepted-format
- **Issue:** The original todo file (`.planning/todos/pending/2026-05-09-claude-md-svelte-warning-accepted-format.md`) ended with literal `</content>\n</invoke>` text — leftover from a prior tool call that injected the file's content with stray closing XML tags
- **Fix:** Removed the spurious `</content>\n</invoke>` lines as part of the resolution addendum edit; the file now ends cleanly with the Resolution section
- **Files modified:** `.planning/todos/completed/2026-05-09-claude-md-svelte-warning-accepted-format.md`
- **Verification:** File is well-formed markdown ending at the Resolution section
- **Committed in:** (final docs commit — todo migration commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug — malformed trailer cleanup as a side-effect of the todo migration; out of strict plan scope but trivially in-line with the todo edit anyway).
**Impact on plan:** Zero scope creep — the trailer fix was a single-line cleanup inside a file I was already editing for the resolution addendum. No additional commits or surface touched.

## Issues Encountered

- **Pre-existing lint errors in `tests/tests/specs/candidate/candidate-required-info.spec.ts`** (2 `playwright/no-raw-locators` errors at lines 140 and 152). Per `git log -- ...`, these were introduced by Phase 77 (`c44cca456`, `e9efd40b7`) and are entirely orthogonal to Plan 03's surface (`supabaseDataProvider.ts`, `getRoute.svelte.ts`, `CLAUDE.md`). Per the SCOPE BOUNDARY rule, these are out of scope for Plan 03 — logged in Deferred Issues below for surfacing to a future Phase 78 plan or a follow-up.
- **Typecheck baseline:** `yarn workspace @openvaa/frontend check` reports 155 errors / 0 warnings at end of Plan 03. v2.7-close baseline was 160 errors / 12 warnings — Plan 03 leaves the baseline strictly better (or at minimum, no worse). Plan 03's edits are comment-only (Task 1, 3) and semantically equivalent (Task 2), so no new errors expected and none surfaced.

## Deferred Issues

- **Pre-existing lint errors in `tests/tests/specs/candidate/candidate-required-info.spec.ts:140` and `:152`** — `playwright/no-raw-locators` errors introduced by Phase 77 (commits `c44cca456`, `e9efd40b7`). Out of Plan 03 scope. Recommend logging as a follow-up todo for Phase 78 cleanup-trio aftermath or a future test-hygiene phase.

## Followups

- **`dataContext.ts` analog `setStore`-equivalent cast pattern** — Per CONTEXT Deferred Ideas + canonical_refs, the same `Writable<T>` → `Readable<T>` narrowing-via-structural-cast pattern exists in `apps/frontend/src/lib/contexts/app/dataContext.ts` for the `dataRoot` store. Plan 03 explicitly scoped to `getRoute.svelte.ts` only. Future-phase eradication candidate — same Option 2 inline-use refactor applies cleanly. Flag carries forward to Phase 78 closing notes or a future "store typings consolidation" plan.

## User Setup Required

None — pure code/docs hygiene edits, no external service config.

## Next Phase Readiness

- CLEAN-03 trio fully resolved (D-04 strict reading, IN-03 setStore cleanup, Phase 70 Q2 CLAUDE.md anchor).
- 3 source todos migrated to `completed/` with resolution addenda — backlog reduction visible in `ls .planning/todos/pending/`.
- Plan 04+ can proceed independently (no dependency on Plan 03 surface).
- Typecheck baseline preserved (155 errors / 0 warnings; ≤ v2.7-close 160 / 12).
- Frontend unit tests pass (38/38 files, 660/660 tests).

## Self-Check: PASSED

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`: FOUND
- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`: FOUND
- `CLAUDE.md`: FOUND
- Commit `601822b3b` (CLEAN-03a): FOUND
- Commit `6068ba4df` (CLEAN-03b): FOUND
- Commit `f5793f78f` (CLEAN-03c): FOUND
- Grep: `grep -cE "^[[:space:]]*// reason:" apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` → 14 (≥ 13 expected): PASS
- Grep: `grep -c "JSONB → StoredImage" apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` → 11: PASS
- Grep: `grep -c "JSONB → LocalizedAnswers" apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` → 2: PASS
- Grep: `! grep -q "as { set:" apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`: PASS (cast string absent)
- Grep: `grep -q "store.set(buildFn())" apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`: PASS
- Grep: `grep -q "### Svelte Warning-Accepted Format" CLAUDE.md`: PASS
- Grep: `grep -q "svelte-warning: accepted" CLAUDE.md`: PASS

---
*Phase: 78-cleanup-hygiene-phase*
*Plan: 03*
*Completed: 2026-05-12*
