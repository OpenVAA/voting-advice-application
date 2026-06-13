---
phase: 114-store-state-rename
plan: 01
subsystem: infra
tags: [svelte5, codemod, rename, refactor, frontend, contexts]

# Dependency graph
requires:
  - phase: 113-handle-flatten-de-duplication
    provides: "class-converted + flattened *Store rune contexts; the dry-run-by-default .mjs codemod precedent (flatten-current-codemod.mjs)"
provides:
  - "Reusable allowlisted, longest-token-first, string-literal-guarded store→state codemod (apps/frontend/scripts/store-to-state-codemod.mjs) for plans 02/03"
  - "Voter/utils *Store cluster fully renamed to *State: answerState, matchState, filterState, nominationAndQuestionState, paramState, questionBlockState (files, identifiers, PascalCase types)"
affects: [114-02-popup-candidate-rename, 114-03-admin-jobstates-rename, 115-svelte-store-sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Allowlisted whole-word (\\b-anchored) codemod with per-line string-literal guard so localStorage key literals embedding the renamed token are never rewritten"
    - "Longest-token-first ordered replacement table to defeat substring double-rename"

key-files:
  created:
    - apps/frontend/scripts/store-to-state-codemod.mjs
  modified:
    - apps/frontend/src/lib/contexts/voter/answerState.svelte.ts
    - apps/frontend/src/lib/contexts/voter/answerState.type.ts
    - apps/frontend/src/lib/contexts/voter/answerState.svelte.test.ts
    - apps/frontend/src/lib/contexts/voter/matchState.svelte.ts
    - apps/frontend/src/lib/contexts/voter/filters/filterState.svelte.ts
    - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
    - apps/frontend/src/lib/contexts/utils/paramState.svelte.ts
    - apps/frontend/src/lib/contexts/utils/questionBlockState.type.ts
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
    - apps/frontend/src/lib/contexts/voter/voterContext.type.ts
    - apps/frontend/src/lib/contexts/voter/index.ts
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.type.ts

key-decisions:
  - "Kept the 'VoterContext-answerStore' localStorage key literal byte-identical (renaming would orphan persisted voter answers) — enforced via the codemod's string-literal guard"
  - "Reverted an out-of-scope CandidateUserDataStore rewrite the broad filter/candidate glob produced — that token belongs to plan 02"
  - "Used a perl word-boundary pass for the file-path import-specifier fixes (Task 2) because BSD sed does not honour \\b; restored the persisted-key literal it incidentally corrupted"

patterns-established:
  - "String-literal-guarded codemod: any candidate match between an opening and closing quote on a line is skipped, protecting storage-key literals from a blanket identifier rename"
  - "Idempotent rename codemod: a second --apply run reports 0 rewrites (no allowlist token remains in code)"

requirements-completed: [RENAME-01]

# Metrics
duration: ~17min
completed: 2026-06-13
---

# Phase 114 Plan 01: Voter/Utils Store→State Rename Summary

**Built the reusable allowlisted, longest-token-first, string-literal-guarded `store-to-state-codemod.mjs` and renamed the voter/utils `*Store` cluster (answerStore→answerState, matchStore, filterStore, nominationAndQuestionStore, paramStore, questionBlockStore) across files, identifiers, and PascalCase types — keeping the `'VoterContext-answerStore'` localStorage key byte-identical.**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-06-13T11:10:00Z (approx)
- **Completed:** 2026-06-13T11:27:00Z
- **Tasks:** 3
- **Files modified:** 21 (8 git-mv renames + codemod script + consumers)

## Accomplishments
- Authored `apps/frontend/scripts/store-to-state-codemod.mjs` (188 lines): dry-run by default, `--apply`/`--files` flags, ordered longest-token-first allowlist covering all 12 phase symbols (voter/utils + candidate/admin tokens for plans 02/03), per-line string-literal guard, idempotency guarantee.
- `git mv` of 8 voter/utils file triplets/singles to `*State` basenames with git rename detection preserved (history intact); every import specifier + the `voter/index.ts` barrel rewritten to the new paths.
- Rewrote every voter/utils camelCase identifier and PascalCase type (`AnswerStore`/`AnswerStoreImpl`, `MatchStoreDeps`/`Impl`, `FilterStoreDeps`/`Impl`, `ParamStoreImpl`, `NominationAndQuestionStoreDeps`/`Impl`) to `*State`; `MatchTree`/`FilterTree`/`NominationAndQuestionTree`/`QuestionBlocks` type names preserved (no "Store").
- Held all gates: svelte-check **151 errors / 0 warnings** (baseline), `answerState` + `filterContext` vitest **13/13 passed**, frontend `yarn build` green (14/14 chunks emit), grep gate **0** remaining voter-cluster `*Store` code identifiers tree-wide.

## Task Commits

1. **Task 1: Build the allowlisted store-to-state codemod** - `986acdaa1` (feat)
2. **Task 2: git mv the 6 voter/utils file triplets + fix import specifiers** - `0766e1720` (refactor)
3. **Task 3: Apply codemod to voter/utils identifiers + types and gate the cluster** - `78727b3ce` (refactor)

## Files Created/Modified
- `apps/frontend/scripts/store-to-state-codemod.mjs` - Reusable rename codemod (allowlist, string-literal guard, dry-run default).
- `voter/answerState.*` (svelte.ts/type.ts/svelte.test.ts) - Renamed answerState factory + AnswerStateImpl; persisted-key literal kept.
- `voter/matchState.svelte.ts` - matchState factory + MatchTree export (type name unchanged).
- `voter/filters/filterState.svelte.ts` - filterState factory + FilterTree export.
- `voter/nominationAndQuestionState.svelte.ts` - nominationAndQuestionState factory.
- `utils/paramState.svelte.ts` - paramState factory + ParamStateImpl.
- `utils/questionBlockState.type.ts` - type-only file (QuestionBlocks type name unchanged).
- `voter/voterContext.svelte.ts`, `voter/voterContext.type.ts`, `voter/index.ts` - consumer import/identifier updates + barrel.
- `dynamic-components/entityDetails/EntityDetails.svelte`, `EntityOpinions.type.ts`, `EntityOpinions.svelte` - external `AnswerState` consumers (import via voter barrel + doc comment).
- Plus `filter/filterContext.type.ts`, `filter/filterContext.svelte.test.ts`, `filter/__tests__/FilterContextHarness.svelte`, `filter/filterContext.svelte.ts`, `candidate/candidateContext.type.ts`, `dynamic-components/questionHeading/QuestionHeading.type.ts`, `utils/matches.ts`, `utils/entityDetails.ts`, `routes/.../statistics/+page.svelte` - import-path / comment updates.

## Decisions Made
- **Persisted-key literal kept byte-identical** (research Pitfall 2 / Assumption A1): `'VoterContext-answerStore'` stays in both `answerState.svelte.ts` and `answerState.svelte.test.ts`. Renaming it would orphan returning users' saved answers — a behavior change forbidden in this mechanical phase.
- **Codemod string-literal guard is the enforcement mechanism**, not a manual exception: any candidate match inside quotes is skipped, so future `--apply` runs in plans 02/03 cannot corrupt storage keys either.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] External AnswerState consumers broke on the barrel rename**
- **Found during:** Task 3 (post-codemod svelte-check gate)
- **Issue:** `EntityDetails.svelte` and `EntityOpinions.type.ts` import `AnswerStore` from `$lib/contexts/voter`; after the barrel re-exported the renamed `AnswerState` type, svelte-check rose to 153 (2 over the 151 baseline) with "has no exported member named 'AnswerStore'".
- **Fix:** Applied the codemod to `dynamic-components/entityDetails/**` (rewrote the 4 `AnswerStore`→`AnswerState` sites) and manually updated the `EntityOpinions.svelte` `@component` doc comment (the codemod's backtick = template-literal guard intentionally skipped the backticked token).
- **Files modified:** EntityDetails.svelte, EntityOpinions.type.ts, EntityOpinions.svelte
- **Verification:** svelte-check returned to exactly 151/0.
- **Committed in:** `78727b3ce` (Task 3 commit)

**2. [Rule 1 - Bug] Broad glob rewrote an out-of-scope candidate token**
- **Found during:** Task 3 (codemod applied to `candidateContext.type.ts` for its `questionBlockState` path fix)
- **Issue:** The allowlist (shared with plans 02/03) also rewrote `CandidateUserDataStore`→`CandidateUserDataState` in `candidateContext.type.ts`, but the candidate decl file is plan 02's scope and still exports `CandidateUserDataStore` — this would dangle the type until plan 02 runs.
- **Fix:** Reverted just the `CandidateUserDataState` rewrites in `candidateContext.type.ts` (kept the in-scope `questionBlockStore`→`questionBlockState` import-path fix, already committed in Task 2). Net effect: file matches its Task-2 committed state.
- **Files modified:** candidateContext.type.ts (no net change beyond Task 2)
- **Verification:** `git diff candidateContext.type.ts` empty; svelte-check 151/0.
- **Committed in:** n/a (reverted to committed state before Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both necessary for correctness/commit-boundary hygiene. No scope creep — out-of-scope candidate/popup/admin files left for plans 02/03.

## Issues Encountered
- **BSD sed has no `\b`:** the first Task-2 import-fix attempt with `sed -E 's/\b.../'` silently matched nothing. Switched to `perl -pi -e`. The perl pass (no string-literal guard) corrupted the `'VoterContext-answerStore'` localStorage key to `'VoterContext-answerState'`; caught immediately by the persisted-key grep and restored byte-identical before committing. Going forward, the dedicated codemod (which DOES guard string literals) is used for all identifier rewrites; raw perl is only for the file-path segments inside import specifiers.

## Known Stubs
None — pure mechanical rename, zero behavior change.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The `store-to-state-codemod.mjs` allowlist already includes the popup (`PopupStore*`), candidate (`CandidateUserDataStore*`, `editedAnswersStore`), and admin (`JobStores*`/`jobStores`) tokens, so plans 02 and 03 can reuse it directly with their own `--files` globs (just `git mv` the remaining triplets first, as done here).
- Out-of-scope tokens intentionally untouched in plan 01: server `jobStore` (singular), `cookieStore` mock, `StoredValue`/`LocallyStoredValue`, and the candidate/popup/admin decl files.

## Self-Check: PASSED

All claimed artifacts verified on disk (codemod script, renamed answerState/matchState/questionBlockState files, SUMMARY) and all 4 commits present in git history (`986acdaa1`, `0766e1720`, `78727b3ce`, `34063abf3`).

---
*Phase: 114-store-state-rename*
*Completed: 2026-06-13*
