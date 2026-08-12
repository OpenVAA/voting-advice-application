---
phase: 128-svelte-check-0-long-tail-tests-docs
plan: 03
subsystem: testing
tags: [svelte-check, typescript, view-transitions, tabindex, type-truth]

# Dependency graph
requires:
  - phase: 128-svelte-check-0-long-tail-tests-docs
    provides: "Plans 01/02 cleared the bulk svelte-check errors, leaving the 5 scattered production singles this plan owns"
provides:
  - "5 scattered production TYPE-07 type-truth errors cleared (viewTransition.ts, FeedbackPopup.svelte, EntityInfo.svelte, questions/+layout.svelte, [questionId]/+page.svelte)"
  - "viewTransition.ts adopts the built-in TS 5.9.3 lib.dom.d.ts ViewTransition type; hand-rolled interfaces removed"
  - "Frontend svelte-check at 0 errors / 1 warning (Term.svelte warning is Plan 04's scope)"
affects: [128-04-term-tabindex-warning, 128-05-e2e-full-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prefer built-in lib.dom.d.ts DOM types over hand-rolled parallel interfaces; feature-detect via 'x' in document"
    - "Pass numeric literals ({-1}) to number-typed component props; string tabindex only on raw elements"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/utils/viewTransition.ts
    - apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte

key-decisions:
  - "Removed hand-rolled ViewTransition/DocumentWithViewTransition interfaces in favor of TS 5.9.3 built-in lib.dom.d.ts types (built-in ViewTransition now requires a `types` member the local shape lacked)."
  - "Used 'startViewTransition' in document runtime feature-check instead of an optional-property cast — behavior-neutral, keeps the fallback path for non-supporting browsers."
  - "Confirmed EntityInfo.svelte:80 ternary is a genuinely dead branch (enclosing {#if} narrows entityType to 'organization'), not a masked logic bug — collapsed to the literal 'organizations'."

patterns-established:
  - "Type-truth-only fixes: no runtime behavior change, verified by exact svelte-check error-count drop with zero net-new."

requirements-completed: [TYPE-07]

coverage:
  - id: D1
    description: "viewTransition.ts uses built-in ViewTransition lib types behind a feature-check; clears viewTransition.ts 26:11"
    requirement: TYPE-07
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors at viewTransition.ts 26:11"
        status: pass
    human_judgment: false
  - id: D2
    description: "FeedbackPopup status initial value uses SendingStatus 'default' member; clears FeedbackPopup.svelte 35:38"
    requirement: TYPE-07
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors at FeedbackPopup.svelte 35:38"
        status: pass
    human_judgment: false
  - id: D3
    description: "EntityInfo dead entity-type branch collapsed to literal 'organizations'; clears EntityInfo.svelte 80:28"
    requirement: TYPE-07
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors at EntityInfo.svelte 80:28"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two QuestionHeading component-prop sites pass numeric tabindex={-1}; clears +layout.svelte 232:11 and [questionId]/+page.svelte 282:11"
    requirement: TYPE-07
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors at questions/+layout.svelte 232:11 and [questionId]/+page.svelte 282:11"
        status: pass
    human_judgment: false

# Metrics
duration: 3min
completed: 2026-07-16
status: complete
---

# Phase 128 Plan 03: Long-Tail Type-Truth Singles Summary

**Cleared the 5 scattered production TYPE-07 singles with behavior-neutral type-truth fixes — built-in ViewTransition lib types, the real SendingStatus 'default' idle member, a collapsed dead entity-type branch, and two numeric QuestionHeading tabindex props — landing frontend svelte-check at 0 errors / 1 warning.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-16
- **Completed:** 2026-07-16
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- viewTransition.ts now calls the built-in `Document.startViewTransition` behind a `'startViewTransition' in document` feature-check; hand-rolled `ViewTransition` + `DocumentWithViewTransition` interfaces removed (they conflicted with TS 5.9.3's built-in `ViewTransition` which added a required `types` member).
- FeedbackPopup.svelte `status` `$state` initial value changed `'idle'` → `'default'` (the documented idle member of the existing `SendingStatus` union — union not extended).
- EntityInfo.svelte dead ternary at line 80 collapsed to the literal `'organizations'` (the enclosing `{#if}` narrows `entityType` to `'organization'`).
- Both QuestionHeading component-prop sites (`questions/+layout.svelte:232`, `candidate/[questionId]/+page.svelte:282`) changed from string `tabindex="-1"` to numeric `tabindex={-1}` (the prop is typed `number` via `HeadingGroupProps`).
- Frontend `yarn check`: 5 errors → 0 errors, exactly the 5 owned singles cleared, zero net-new. The remaining 1 warning is Term.svelte (Plan 04's scope) — left untouched.

## Task Commits

Each task was committed atomically (per-file sub-commits within the singles cluster):

1. **Task 1a: viewTransition.ts built-in types** - `fae7c5e9b` (fix)
2. **Task 1b: FeedbackPopup 'default' status** - `59eebaf55` (fix)
3. **Task 2a: EntityInfo dead-branch literal** - `3f9784d95` (fix)
4. **Task 2b: two QuestionHeading numeric tabindex** - `669051639` (fix)

**Plan metadata:** committed with STATE/ROADMAP/REQUIREMENTS updates (docs: complete plan)

## Files Created/Modified
- `apps/frontend/src/lib/utils/viewTransition.ts` - Removed hand-rolled VT interfaces; uses built-in lib types behind a feature-check.
- `apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte` - `status` initial value `'idle'` → `'default'`.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte` - Dead ternary → literal `'organizations'`.
- `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` - QuestionHeading `tabindex="-1"` → `{-1}`.
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` - QuestionHeading `tabindex="-1"` → `{-1}`.

## Decisions Made
- Adopted TS 5.9.3's built-in `ViewTransition` lib type rather than patching the hand-rolled parallel interface to add the new required `types` member — the plan's preferred (Claude's-discretion) option and the lower-maintenance path.
- Used the `'startViewTransition' in document` narrowing for feature detection, which type-clean-guards the built-in call and preserves the fallback path — behavior-neutral.
- Verified EntityInfo.svelte:80 is a true dead branch, not a masked bug: line 76's `{#if ... parentNomination.entityType === ENTITY_TYPE.Organization}` narrows the value to `'organization'`, so `=== 'candidate'` can never be true. Safe to collapse.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Frontend svelte-check is at 0 errors / 1 warning. The single remaining warning (Term.svelte 91:1, noninteractive tabindex) is owned by Plan 04.
- No runtime behavior changed; the full E2E gate (Plan 05) will re-prove the view-transition, feedback, entity-info, and question-heading paths.

---
*Phase: 128-svelte-check-0-long-tail-tests-docs*
*Completed: 2026-07-16*

## Self-Check: PASSED
- All 5 modified source files exist on disk.
- All 4 task commits (fae7c5e9b, 59eebaf55, 3f9784d95, 669051639) present in git history.
- SUMMARY.md created.
- svelte-check: 0 errors / 1 warning (Term.svelte, Plan 04 scope) — exactly 5 owned singles cleared, zero net-new.
