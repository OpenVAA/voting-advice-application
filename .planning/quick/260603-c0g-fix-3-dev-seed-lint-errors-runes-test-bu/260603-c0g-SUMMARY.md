---
phase: quick-260603-c0g
plan: 01
subsystem: dev-seed + frontend-spike-routes
tags: [lint, build, dev-seed, runes-test, svelte]
requires: []
provides:
  - "dev-seed package lint clean (0 errors)"
  - "runes-test/nav-a11y svelte autoclose compile error fixed"
affects:
  - packages/dev-seed
  - apps/frontend (runes-test spike routes)
tech-stack:
  added: []
  patterns: ["TRow generic-param naming convention (/^T[A-Z]/u)", "simple-import-sort/exports ordering (type exports first)"]
key-files:
  created: []
  modified:
    - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
    - packages/dev-seed/src/templates/_helpers/index.ts
    - apps/frontend/src/routes/runes-test/nav-a11y/+page.svelte
decisions:
  - "Two unrelated pre-existing gate-blockers documented (NOT chased) per scope constraint"
metrics:
  duration: ~12min
  completed: 2026-06-03
---

# Phase quick-260603-c0g Plan 01: Fix 3 dev-seed lint errors + runes-test build break Summary

Fixed the 3 cited dev-seed lint errors (unused import, generic-param naming, export sort) and the runes-test `<ol>`-in-`<p>` svelte autoclose compile error. Both target fixes are verified correct at their scope, but neither repo-wide gate (`yarn lint:check`, `yarn build`) reaches exit 0 because of two SEPARATE pre-existing in-flight Phase 88–91 blockers outside this plan's 4-fix scope — documented below rather than chased per the scope constraint.

## Tasks Completed

### Task 1 — dev-seed lint fixes (FIX 1 + FIX 2) — commit `d1ed5bb7b`
- **FIX 1** (`buildMinimal.ts`): Removed the unused `buildQuestions` named import (kept `buildQuestionCategories`). Renamed the `deepMerge` generic type parameter `T` → `TRow` at all 5 usages (declaration, `base` param, return type, two `as TRow` casts). Clears `unused-imports/no-unused-imports` and `@typescript-eslint/naming-convention` (`/^T[A-Z]/u`).
- **FIX 2** (`index.ts`): Ran scoped `eslint --fix` — reordered the two re-exports so the `export type { BuildMinimalOptions }` sorts before `export { buildMinimal }` per `simple-import-sort/exports`. Autofix touched ONLY this file.
- **Verify:** `yarn workspace @openvaa/dev-seed lint` → exit 0 (0 errors, 15 pre-existing `unused-vars` warnings unrelated to this task).

### Task 2 — runes-test svelte nesting fix (FIX 3) — commit `b3c57723f`
- (`runes-test/nav-a11y/+page.svelte`): Changed the outer wrapper around the `<ol>` from `<p>Protocol:` / `</p>` to `<div>Protocol:` / `</div>` on lines 11 + 19. All text + the five `<li>` items preserved verbatim. Clears the `element_invalid_closing_tag_autoclosed` svelte compile error.
- **Verify:** `yarn build --filter=@openvaa/frontend` output contains NO `element_invalid_closing_tag_autoclosed` / `nav-a11y` autoclose error — the frontend compile now progresses past nav-a11y (215 modules transformed) and fails LATER on an unrelated import (see Blocker B below).

## Required-Gate Results (per plan constraint — both exit codes recorded)

| Gate | Exit | Result |
|------|------|--------|
| `yarn lint:check` | **1** | FAILS — but NOT on any of the 3 cited dev-seed errors (those are fixed). Fails on 31 pre-existing `runes-test/` spike-route lint errors. See Blocker A. |
| `yarn build` | **1** | FAILS — but NOT on the runes-test autoclose error (that is fixed). Fails on a pre-existing broken import path in the in-flight results-tree refactor. See Blocker B. |

Both fixes in this plan are confirmed correct. The plan's premise — that fixing these 4 items would make both gates green — no longer holds because the working tree has accumulated additional in-flight Phase 88–91 debt since the plan was authored.

## Deviations from Plan

None to the implementation — all 3 edits applied exactly as specified, 2 atomic commits via `git -c core.hooksPath=/dev/null`, only the cited files staged. No Phase 88–91 in-flight changes were staged or committed.

## Out-of-Scope Pre-Existing Blockers (documented, NOT chased)

Per the constraint ("do NOT expand scope to unrelated errors — if a genuinely unrelated pre-existing error blocks a gate, document it"), the following two blockers are recorded for follow-up. Both are unrelated to this plan's 4 fixes and pre-date this task (they live in committed in-flight Phase 88–91 work).

### Blocker A — `yarn lint:check`: 31 errors across ~28 `runes-test/` spike files
- **Where:** `apps/frontend/src/routes/runes-test/**` (spike/experimental routes — `nav-a11y`, `nav-forensics`, `nav-keyed-content`, `nav-promoted-layout`, `nav-transitions`, `ssr-hydration`, `voter-context-orchestration`, `getroute-rune`, root `+page.svelte`).
- **Error mix:** `import/newline-after-import`, `simple-import-sort/imports`, `@typescript-eslint/naming-convention` (`T`/`U` → must match `/^T[A-Z]/u`), `unused-imports/no-unused-imports` (`ENTITY_TYPE`, `QUESTION_CATEGORY_TYPE`), `quotes` (double→single), `func-style`.
- **Fixability:** 26 of 31 are `--fix`-autofixable; 5 (naming-convention `T`/`U`, unused imports) need manual edits.
- **Why not fixed here:** Entirely outside the plan's 3-dev-seed-error scope. These are in-flight rune-migration spike files; the operator may still be authoring them. Recommend a follow-up quick task: scoped `yarn workspace @openvaa/frontend eslint --fix 'src/routes/runes-test/**'` + 5 manual renames (`T`→`TFoo`/`U`→`TBar`, drop unused `ENTITY_TYPE`/`QUESTION_CATEGORY_TYPE`).

### Blocker B — `yarn build`: broken MainContent import in results-tree refactor
- **Where:** `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte:18`.
- **Error:** `Could not resolve "../../../../MainContent.svelte"` — the import uses 4 `../` levels, resolving to the nonexistent `results/MainContent.svelte`.
- **Root cause:** Off-by-one relative-path depth. The only `MainContent.svelte` lives at `apps/frontend/src/routes/MainContent.svelte`. From the statistics page dir (`results/[[electionTab]]/statistics/`) the correct traversal is **5** levels (`../../../../../MainContent.svelte`) — crossing `statistics → [[electionTab]] → results → (located) → (voters) → routes` (route-group dirs `(voters)`/`(located)` are real on-disk dirs). The sibling `[[electionTab]]/+layout.svelte:54` is one level shallower and correctly uses 4 `../`; the statistics page copied that depth without accounting for its extra `statistics/` nesting.
- **Introduced by:** committed in-flight commit `e19cc134b` ("refactor(frontend/routes): migrate results tree to [[electionTab]]/[[entityTab]]/[[entity]]/[[id]] shape") — Phase 88–91 work.
- **Why not fixed here:** Unrelated to this plan's 4 fixes; touching an in-flight refactor mid-flight risks masking incomplete operator work. The fix itself is a trivial one-char path change (`../../../../` → `../../../../../`) once the operator confirms the statistics route is meant to stay at that depth. Recommend a follow-up quick task.

## Self-Check: PASSED

- FOUND commit `d1ed5bb7b` (dev-seed fixes)
- FOUND commit `b3c57723f` (runes-test fix)
- FOUND `packages/dev-seed/src/templates/_helpers/buildMinimal.ts`
- FOUND `packages/dev-seed/src/templates/_helpers/index.ts`
- FOUND `apps/frontend/src/routes/runes-test/nav-a11y/+page.svelte`
- VERIFIED `yarn workspace @openvaa/dev-seed lint` → exit 0 (0 errors)
- VERIFIED no `element_invalid_closing_tag_autoclosed` error in frontend build output

---

## Resolution (orchestrator follow-through, 2026-06-03)

The 4 cited fixes alone did NOT green both gates — the in-flight tree had drifted further. Orchestrator closed the remaining blockers (all committed-clean, bounded, zero-behavior-change):

- **Build break (real bug):** `(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte:18` imported `../../../../MainContent.svelte` (4 levels) but `routes/MainContent.svelte` is 5 levels up — off-by-one from refactor `e19cc134b`. Fixed → `../../../../../`. Commit `cba886c8d`. **`yarn build` → exit 0 (14/14).**
- **33 frontend lint errors:** 26 autofixed (`eslint --fix`: import-sort, newline-after-import, quotes, unused-imports) + 7 manual (3 func-style arrow→declaration: `supabaseDataProvider.test.ts` `cd`, `(located)/+layout.ts` `withNext`, `getRouteRuneStore` `fn`; 4 naming-convention: `pureMerge<T,U>`→`<TTarget,TAdditional>` in `appSettingsVariantA/B`). Commit `8a3d3b55b`. **`yarn lint:check` → exit 0 (11/11).**

**Final gate state: `yarn lint:check` GREEN ✓ · `yarn build` GREEN ✓.** Staged paths were explicit (runes-test/ + the 2 named files); 0 files under `tests/` (the Phase 88–91 in-flight WIP) were swept.

Part (b) of the request (run remaining out-of-subset e2e specs) is tracked separately — it is a validation run, not a code change, and is handled by the orchestrator directly.
