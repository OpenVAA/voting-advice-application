---
phase: 114-store-state-rename
plan: 02
subsystem: frontend
tags: [svelte5, codemod, rename, refactor, frontend, contexts, popup, candidate]

# Dependency graph
requires:
  - phase: 114-store-state-rename
    plan: 01
    provides: "reusable allowlisted, string-literal-guarded store-to-state-codemod.mjs (already includes popup + candidate tokens)"
provides:
  - "popup context fully renamed to *State: popupState() factory, PopupState, PopupStateApi (files, identifiers, types, barrel, appContext consumer)"
  - "candidate user-data context fully renamed to *State: candidateUserDataState() factory, CandidateUserDataState, CandidateUserDataStateImpl, #editedAnswersState private field (files, identifiers, types, barrels, candidateContext consumer)"
affects: [114-03-admin-jobstates-rename, 114-04-comment-and-gate-cleanup, 115-svelte-store-sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reused the plan-01 string-literal-guarded codemod with per-cluster --files globs; manual edits for the appContext cross-cluster consumer to avoid touching the out-of-scope pageDatumStore comment on appContext.svelte.ts:369 (plan 04 scope)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/app/popup/popupState.svelte.ts
    - apps/frontend/src/lib/contexts/app/popup/popupState.type.ts
    - apps/frontend/src/lib/contexts/app/popup/popupState.svelte.test.ts
    - apps/frontend/src/lib/contexts/app/popup/index.ts
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/contexts/app/appContext.type.ts
    - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.type.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts
    - apps/frontend/src/lib/contexts/candidate/index.ts

key-decisions:
  - "Kept the 'CandidateContext-candidateUserDataStore-editedAnswers' localStorage key literal byte-identical (renaming would orphan candidates' persisted edited answers) — enforced by the codemod's string-literal guard"
  - "Renamed the appContext cross-cluster popup consumer by hand (not the codemod) to avoid rewriting the out-of-scope pageDatumStore comment on appContext.svelte.ts:369, which belongs to plan 04's comment-cleanup scope"
  - "Updated in-cluster doc-comment + describe/it test-name strings to *State (only the persisted-key string literal is kept); left comment-only *Store references in route/layout/VideoController files outside the two clusters for plan 04"

patterns-established:
  - "Cross-cluster consumer fix discipline: when the broad codemod would also rewrite an out-of-scope comment token, edit the in-scope identifiers manually rather than widening the glob"

requirements-completed: [RENAME-01]

# Metrics
duration: ~6min
completed: 2026-06-13
---

# Phase 114 Plan 02: Popup + Candidate Store→State Rename Summary

**Renamed the popup context (`popupStore`→`popupState`, `PopupStore`/`PopupStoreApi`→`*State`) and the candidate user-data context (`candidateUserDataStore`→`candidateUserDataState`, `CandidateUserDataStore`/`Impl`→`*State`, private field `#editedAnswersStore`→`#editedAnswersState`) across files (git mv), identifiers, types, barrels, and the appContext/candidateContext consumers — keeping the `'CandidateContext-candidateUserDataStore-editedAnswers'` localStorage key byte-identical.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-13T11:28:59Z
- **Completed:** 2026-06-13T11:35:00Z (approx)
- **Tasks:** 2
- **Files modified:** 13 (6 git-mv renames + 2 barrels + 2 consumer contexts + appContext triplet)

## Accomplishments
- `git mv` of both file triplets (`popupStore.{svelte,type,svelte.test}.ts`→`popupState.*`, `candidateUserDataStore.{svelte,type,svelte.test}.ts`→`candidateUserDataState.*`) with git rename detection preserved (history intact); every import specifier + the `app/popup/index.ts` and `candidate/index.ts` barrels repointed.
- Applied the plan-01 codemod (`--files 'src/lib/contexts/app/popup/**'` then `'src/lib/contexts/candidate/**'`) to rewrite all camelCase identifiers and PascalCase types (`popupStore`/`PopupStore`/`PopupStoreApi`, `candidateUserDataStore`/`CandidateUserDataStore`/`CandidateUserDataStoreImpl`) and the private field `#editedAnswersStore`→`#editedAnswersState` (all 7 sites: 51, 64, 144, 197, 204, 211, 246).
- Fixed the cross-cluster appContext popup consumer by hand (import + `PopupState` type + `#popupQueue` field + `readonly popupQueue` decl + the `vi.mock('./popup', { popupState })` key in the spread test) so it stays green against the renamed barrel export.
- Held all gates: persisted-key literal `'CandidateContext-candidateUserDataStore-editedAnswers'` byte-identical (count 1, still on line 52); `#editedAnswersStore` 0 / `#editedAnswersState` 7; zero camelCase `*Store` code identifiers remaining in popup+candidate clusters; renamed tests `popupState` + `candidateUserDataState` **8/8 passed**; `appContext.spread` **3/3 passed**; **svelte-check 151 errors / 0 warnings** (baseline); **frontend `yarn build` green** (server + client chunks emit).

## Task Commits

1. **Task 1: git mv popup + candidateUserDataStore triplets to *State + fix import specifiers** - `946f13834` (refactor)
2. **Task 2: rename popup + candidateUserData *Store identifiers/types + #editedAnswersStore field to *State** - `19e1e29f0` (refactor)

## Files Created/Modified
- `app/popup/popupState.{svelte,type,svelte.test}.ts` - renamed popupState() factory + `PopupState`/`PopupStateApi`; describe/it test names updated.
- `app/popup/index.ts` - barrel repointed to `./popupState.svelte` + `./popupState.type`.
- `app/appContext.{svelte,type}.ts` - popup consumer: `popupState` import, `PopupState` type, `#popupQueue`/`popupQueue` fields.
- `app/appContext.spread.svelte.test.ts` - `vi.mock('./popup', () => ({ popupState: ... }))` key + a doc comment updated to the new surface name.
- `candidate/candidateUserDataState.{svelte,type,svelte.test}.ts` - renamed `candidateUserDataState()` factory + `CandidateUserDataState`/`CandidateUserDataStateImpl` + `#editedAnswersState` field; persisted-key literal kept; doc-comment + describe test name updated.
- `candidate/index.ts` - barrel repointed to `./candidateUserDataState.type`.
- `candidate/candidateContext.{svelte,type}.ts` - consumer: `candidateUserDataState` import + `CandidateUserDataState` type on `userData`.

## Decisions Made
- **Persisted-key literal kept byte-identical** (research Pitfall 2 / Assumption A1): `'CandidateContext-candidateUserDataStore-editedAnswers'` stays on `candidateUserDataState.svelte.ts:52`. Renaming it would orphan returning candidates' saved edited answers — a behavior change forbidden in this mechanical phase. Enforced structurally by the codemod's string-literal guard.
- **Manual appContext consumer fix, not a broad codemod glob:** running the codemod over `appContext.svelte.ts` would also have rewritten the out-of-scope `pageDatumStore` comment on line 369 (a plan-04 comment-cleanup token). To respect commit-boundary hygiene, the popup identifiers there were edited by hand.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] appContext popup consumer broke on the barrel rename**
- **Found during:** Task 2 (post-codemod svelte-check gate)
- **Issue:** `appContext.svelte.ts` + `appContext.type.ts` import `popupStore`/`PopupStore` from `./popup`; after the barrel re-exported the renamed `popupState`/`PopupState`, those imports would dangle and svelte-check would rise above the 151 baseline. The `appContext.spread.svelte.test.ts` `vi.mock('./popup', { popupStore })` key would also no longer match the real factory export, silently un-mocking it.
- **Fix:** Manually rewrote the 6 popup identifier sites in `appContext.{svelte,type}.ts` (`popupState` import, `PopupState` type on `popupQueue`, `#popupQueue` field init, `readonly popupQueue` decl) and the spread-test mock key + comment. Did NOT run the codemod over these files to avoid the out-of-scope `pageDatumStore:369` comment rewrite.
- **Files modified:** appContext.svelte.ts, appContext.type.ts, appContext.spread.svelte.test.ts
- **Verification:** svelte-check returned to exactly 151/0; `appContext.spread` 3/3 passed.
- **Committed in:** `19e1e29f0` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking). No scope creep — out-of-scope admin/jobStores (plan 03) and comment-only `*Store` refs in route/layout/VideoController files (plan 04) left untouched.
**Impact on plan:** Necessary for the build/type gate to hold. Same shape as plan 01's Rule-3 external-consumer deviation.

## Issues Encountered
- The plan's Task-2 acceptance grep (`grep -rwnE '[a-z][A-Za-z]*Store' ... | grep -v ... | wc -l`) returned 0 only after the in-cluster doc-comment + describe/it test-name strings were updated to `*State`; the codemod's string-literal/comment guard intentionally leaves those, so they were edited by hand (the only retained string is the persisted localStorage key).

## Known Stubs
None — pure mechanical rename, zero behavior change.

## Deferred Items (out of scope for plan 02)
- Comment-only `*Store` references that name the OLD files/identifiers, all OUTSIDE the two cluster directories, left for plan 04's comment-cleanup scope:
  - `src/lib/contexts/layout/VideoController.svelte.test.ts:60` (comment "see popupStore.svelte.test.ts")
  - `src/routes/(voters)/+layout.svelte:37-38` (comment referencing `popupStore()` / `popupStore.svelte.ts:23`)
  - `src/routes/candidate/(protected)/+layout.svelte:128` (comment referencing `candidateUserDataStore.savedData`)
  - `appContext.svelte.ts:369` (comment "replaces pageDatumStore per …")

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 (admin/jobStores → jobStates) can reuse the same codemod with `--files 'src/lib/contexts/admin/**'`; its `JobStoresProvider`/`JobStores`/`jobStores` tokens are already in the allowlist. The server singular `jobStore` + `Job*` types remain out of scope and the allowlist never targets them.

## Self-Check: PASSED

All claimed renamed files verified on disk (popupState + candidateUserDataState triplets, SUMMARY) and both task commits present in git history (`946f13834`, `19e1e29f0`).

---
*Phase: 114-store-state-rename*
*Completed: 2026-06-13*
