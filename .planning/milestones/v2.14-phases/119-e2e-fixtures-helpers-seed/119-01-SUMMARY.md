---
phase: 119-e2e-fixtures-helpers-seed
plan: 01
subsystem: dev-seed-cli + e2e-test-utils
tags: [dev-seed, cli-deletion, likert-only, e2e-helpers, hygiene, doc-scrub]
dependency_graph:
  requires: []
  provides:
    - "dev-seed CLI/barrel free of --likert-only (applyLikertOnlyFilter / LikertOnlyFilterStats removed)"
    - "green @openvaa/dev-seed unit suite as the stable Phase-119 baseline (SC4)"
    - "navigateToFirstQuestion (sole retained voterNavigation helper) with its 5 live callers"
  affects:
    - "Plans 119-03/04 (template authoring) must keep the dev-seed unit suite green"
    - "Phases 120/121/122 spec authoring (consume the cleaned helper surface)"
tech_stack:
  added: []
  patterns:
    - "node:util parseArgs CLI option deletion (no commander/yargs)"
    - "self-contained dead-cluster deletion (re-verify zero callers at execution time per CONTEXT.md hard rule)"
key_files:
  created: []
  modified:
    - packages/dev-seed/src/cli/seed.ts
    - packages/dev-seed/src/cli/help.ts
    - packages/dev-seed/src/index.ts
    - packages/dev-seed/tests/cli/help.test.ts
    - tests/tests/utils/voterNavigation.ts
    - tests/tests/setup/shared/setupFromTemplate.ts
    - tests/README.md
    - CLAUDE.md
  deleted:
    - packages/dev-seed/src/cli/likert-only.ts
    - packages/dev-seed/tests/cli/likert-only.test.ts
decisions:
  - "A1 operator override executed verbatim: --likert-only removed COMPLETELY (no shim, no fixture change)."
  - "Left the advanceVoterFlow StopAt union ('questions-intro'/'category-intro') intact — out of deletion scope, harmless, and avoids touching live navigateToFirstQuestion behaviour."
metrics:
  duration: "~10 min"
  completed: 2026-06-14
---

# Phase 119 Plan 01: Remove --likert-only + dead voterNavigation helpers Summary

Removed the `--likert-only` CLI filter from `@openvaa/dev-seed` completely (CLI parse, apply block, `likert-only.ts` source + test, barrel exports, help line + help-test assertion) and deleted the four verified-dead `voterNavigation.ts` helpers, scrubbing all `--likert-only` doc mentions — establishing a green dev-seed unit suite (441 passing) as the stable Phase-119 baseline before template authoring begins.

## What Was Built

**Task 1 — dev-seed `--likert-only` deletion (commit `18a014fb6`):**
- `seed.ts`: removed the `applyLikertOnlyFilter` import, the `'likert-only': { type: 'boolean' }` `parseArgs` option, and the `if (values['likert-only']) {...}` apply block.
- Deleted `packages/dev-seed/src/cli/likert-only.ts` and `packages/dev-seed/tests/cli/likert-only.test.ts` outright.
- `help.ts`: removed the `--likert-only` USAGE line.
- `index.ts`: removed the `applyLikertOnlyFilter` runtime export and the `LikertOnlyFilterStats` type export.
- `help.test.ts`: removed the `documents --likert-only flag` assertion.

**Task 2 — voterNavigation hygiene + doc scrub (commit `ae154b909`):**
- Deleted `walkToQuestion`, `waitForNextQuestion`, `clickThroughIntroPages`, `walkToQuestionsIntro` from `voterNavigation.ts` (re-verified ZERO external callers at execution time via `git grep`). The cluster's only internal edge was `walkToQuestion`→`walkToQuestionsIntro`, so deleting all four leaves no dangling internal reference.
- Kept `navigateToFirstQuestion` and its 5 live callers (`perm-hide-category-tags`, `perm-hide-election-tags`, `perm-hide-if-missing-answers`, `perm-disable-allow-open` specs + `minimalVoterResultsPage.fixture.ts`) plus its private deps (`advanceVoterFlow`, `advanceClick`, `navigateDirectlyToQuestions`, `resolveSeedUuids`).
- Removed the `--likert-only` NOTE comment and fixed a stale `clickThroughIntroPages` reference in the `advanceVoterFlow` docstring.
- Scrubbed the `likertOnly` "not supported" paragraph from `setupFromTemplate.ts`, and all `--likert-only` mentions from `tests/README.md` (manual-reseed block, modifiers heading) and `CLAUDE.md` (db:seed args line, seeding-table row, the "Note on `--likert-only`" + "Yarn arg-forwarding caveat" paragraphs).

## Verification Results

- Task 1: `grep` for `likert-only|applyLikertOnlyFilter|LikertOnlyFilterStats` (excl. `likert5`) across `packages/dev-seed/src` + `tests` → **0**. `yarn workspace @openvaa/dev-seed test:unit` → **441 passed (42 files), exit 0** (SC4).
- Task 2: `grep` for the 4 dead helper names + `likert-only`/`likertOnly` across the four edited files → **0**. `navigateToFirstQuestion` still defined and lists its 5 live callers. `yarn typecheck:tests` → **exit 0** (SC1).
- `packages/dev-seed/tests/templates/base.test.ts` unmodified (the `qu-opin-base-1-likert5` external_id is intact — Pitfall 4 avoided). `packages/dev-seed/README.md` unmodified (its only "Likert" hit is a question-mix description, not the flag).

## Deviations from Plan

None — plan executed exactly as written.

(Process note, not a code deviation: the Task-1 `git add` initially aborted on a stale pathspec for the already-`git rm`'d files, so the first commit captured only the two deletions; the commit was immediately amended to include the four edited source files. Final Task-1 commit `18a014fb6` contains all six file changes.)

## Known Stubs

None.

## Self-Check: PASSED

- Deleted files confirmed gone: `packages/dev-seed/src/cli/likert-only.ts`, `packages/dev-seed/tests/cli/likert-only.test.ts`.
- Retained artifact confirmed: `navigateToFirstQuestion` present in `voterNavigation.ts`.
- Commits confirmed present: `18a014fb6` (Task 1), `ae154b909` (Task 2).
- `base.test.ts` `likert5` external_id intact.
