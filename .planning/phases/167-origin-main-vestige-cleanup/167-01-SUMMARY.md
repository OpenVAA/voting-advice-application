---
phase: 167-origin-main-vestige-cleanup
plan: 01
subsystem: testing
tags: [vitest, supabase, auth, safeGetSession, negative-control, proxy]

requires:
  - phase: 166-retire-auth-user-id-entity-identity-from-grants
    provides: the post-166 tip (8c519ac97) that this phase plans against
provides:
  - safeGetSession.test.ts pins exact getUser and getSession counts in every case
  - strict-client Proxy guard (UnexpectedClientAccess + afterEach record assertion)
  - 167-phase-base.txt (PHASE_BASE for 167-02..167-06)
  - 167-hygiene-baseline.tsv (comment-hygiene baseline at the phase base, read by 167-06)
affects: [167-02, 167-03, 167-04, 167-05, 167-06]

actuals:
  tokens: 2800
  tasks: 2
  commits: 1
plan_head_before: 8c519ac97e0faeace43e1ecb2cad0e99d5309821
plan_head_after: 096896f477c8707a28106ede138b3d275dda4189

tech-stack:
  added: []
  patterns:
    - "Strict-client Proxy fixture: allowed members pass through, any other member is recorded and throws a named error; afterEach asserts the record is empty"

key-files:
  created:
    - .planning/phases/167-origin-main-vestige-cleanup/167-phase-base.txt
    - .planning/phases/167-origin-main-vestige-cleanup/167-hygiene-baseline.tsv
  modified:
    - apps/frontend/src/lib/supabase/safeGetSession.test.ts

key-decisions:
  - "Strict-client Proxy type parameter named TTarget (the frontend naming-convention lint rule requires /^T[A-Z]/)"
  - "Precondition read as met: the only dirty tracked files at start were the orchestrator's own 'Phase 167 execution started' STATE.md/state.json updates"

patterns-established:
  - "Exact round-trip pinning: every call-count assertion is toHaveBeenCalledTimes(<integer>), never an at-least-once form"

requirements-completed: [VEST-01]

coverage:
  - id: D1
    description: "safeGetSession.test.ts pins getUser and getSession with exact counts in all 10 cases, including the intermediate checks of the no-session and mid-verification-refresh cases"
    requirement: VEST-01
    verification:
      - kind: unit
        ref: "cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts (10 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Any client member other than auth.getSession/auth.getUser throws UnexpectedClientAccess and is recorded; afterEach asserts the record is empty"
    requirement: VEST-01
    verification:
      - kind: unit
        ref: "V3 negative control (stray supabase.auth.refreshSession) -> exit 1, 10/10 failed with UnexpectedClientAccess"
        status: pass
    human_judgment: false
  - id: D3
    description: "The new pins were observed failing against V1 (no memo) and V2 (extra getSession read, against old and new assertions); safeGetSession.ts is byte-identical to the phase base"
    requirement: VEST-01
    verification:
      - kind: unit
        ref: "V1 exit 1 (3 failed, getUser); V2-old exit 1 (1 failed); V2-new exit 1 (10 failed, getSession); git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts exit 0"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-10-02
status: complete
---

# Phase 167 Plan 01: safeGetSession round-trip pinning Summary

**`safeGetSession.test.ts` now pins the exact `getUser` and `getSession` counts in all 10 cases. A strict-client Proxy throws a named `UnexpectedClientAccess` on, and records, any other client access. All four negative controls (V1, V2 against the old and new assertions, V3) were observed red, and the production source is unchanged.**

## Performance

- **Duration:** about 3 min (2026-10-02T05:50:10Z to 05:53Z)
- **Tasks:** 2/2
- **Files modified:** 1 code file (test), 2 planning files created

## Accomplishments

- Recorded `PHASE_BASE` and the comment-hygiene baseline TSV (9 rows) at the post-166 tip, before any code edit.
- Wrapped `fakeClient` in `strict(...)` Proxies (`supabase` allows `auth`; `supabase.auth` allows `getSession` and `getUser`). Any other member is pushed onto `unexpectedAccesses` and throws `UnexpectedClientAccess`. `beforeEach` clears the record, and `afterEach` asserts `toEqual([])`.
- Pinned `getSession` beside every `getUser` count. Replaced `not.toHaveBeenCalled()` with `toHaveBeenCalledTimes(0)`. The file now has 12 `getSession` pins and 12 `getUser` pins across 10 cases, and no bare `toHaveBeenCalled()` remains.
- Every observed count matched the 167-RESEARCH § Pattern 1 table: 1/3, 1/3, 0/1 then 1/3, 2/4, 2/4 then 2/5, 2/4, 2/3, 2/3, 3/6, 2/4. The suite went green on the first run, so there were no disagreements to record.

## Task Commits

1. **Task 1 (tracer): phase base, hygiene baseline and the Proxy guard with V3.** No commit by design. Commit ① is a single commit (D-24) and landed at the end of Task 2. The tracer gate re-ran `<verify>` green (10 passed) before Task 2 started.
2. **Task 2: exact `getSession` pins, V1/V2 controls, commit ①.** `096896f47` `test[frontend]: pin every safeGetSession round trip and fail on any other client access`. `git show --stat HEAD` lists only `apps/frontend/src/lib/supabase/safeGetSession.test.ts`.

The two `.planning` files (`167-phase-base.txt`, `167-hygiene-baseline.tsv`) are committed with this SUMMARY in the separate `--no-verify` docs commit.

## Negative controls

`PHASE_BASE=8c519ac97e0faeace43e1ecb2cad0e99d5309821`

All runs used `cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts > "$LOG" 2>&1; echo "exit=$?"`. Each exit code was read directly, never through a pipe. After every variant, `git checkout -- apps/frontend/src/lib/supabase/safeGetSession.ts` restored the source, and `git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts` exited 0.

**V3: one stray client access** (`await supabase.auth.refreshSession();` inserted after `if (error || !user) return null;` in `verifyStored`), run against the Task 1 file (guard present, old assertions):
- Log: `$S/167-01-v3.log`. Result: **exit=1**, `Tests  10 failed (10)`.
- Every case failed twice. The body failed with `UnexpectedClientAccess: supabase.auth.refreshSession` (thrown at `throw new UnexpectedClientAccess(member)`), and `afterEach` failed with `AssertionError: expected [ 'supabase.auth.refreshSession' ] to deeply equal []`.
- Failing tests: all 10, as follows. "verifies a token once and returns the same session and user on every call"; "shares one verification between concurrent calls"; "returns nulls without verifying when there is no session, then verifies a session that appears later"; "verifies again when the access token changes"; "pairs the user only with the token getUser() verified when it refreshes the session mid-verification"; "returns nulls when every verification replaces the token it was asked to verify"; "returns nulls when verification errors, and verifies again on the next call"; "propagates a thrown verification and does not cache it"; "verifies afresh on every call once the request has ended"; "keeps no memo between two helpers, as two requests would each build their own".

**V2-old: one extra `getSession` read, against the pre-strengthening assertions** (`await supabase.auth.getSession();` inserted after `if (error || !user) return null;`), run against the Task 1 file:
- Log: `$S/167-01-v2-old.log`. Result: **exit=1**, `Tests  1 failed | 9 passed (10)`.
- Failing test: "verifies a token once and returns the same session and user on every call", with `expected "spy" to be called 3 times, but got 4 times`. This is the blindness half: 9 of 10 cases missed the extra read.

**V1: memo removed** (deleted `const cached = verifiedUsers.get(accessToken);` and `if (cached) return cached;` from `function verify`), run against the strengthened file:
- Log: `$S/167-01-v1.log`. Result: **exit=1**, `Tests  3 failed | 7 passed (10)`.
- Failing tests, each failing on an `expect(getUser).toHaveBeenCalledTimes` line (column 21):
  - "verifies a token once and returns the same session and user on every call": expected 1, got 2.
  - "shares one verification between concurrent calls": expected 1, got 2.
  - "pairs the user only with the token getUser() verified when it refreshes the session mid-verification": expected 2, got 3 (the second-call check).
- These are exactly the three memo-dependent cases.

**V2-new: one extra `getSession` read, against the strengthened file**:
- Log: `$S/167-01-v2-new.log`. Result: **exit=1**, `Tests  10 failed (10)`.
- Every failure is on an `expect(getSession).toHaveBeenCalledTimes` line (column 24), and no `getUser` assertion failed. Per case: verifies-once 3 to 4; concurrent 3 to 4; no-session 3 to 4; token-changes 4 to 6; refreshes-mid-verification 4 to 6 at the intermediate check; every-verification-replaces 4 to 6; verification-errors 3 to 4; thrown-verification 3 to 4; request-has-ended 6 to 9; two-helpers 4 to 6.
- **Old vs new:** V2 reddens 1 case against the old assertions and 10 against the new ones. That is the catch half of the standing acceptance rule.

**Final state:** the green re-run (`$S/167-01-final.log`) exited 0 with 10 passed, and `git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts` exited 0. `$S` is the session scratchpad. No variant, harness or helper script is committed.

## Gates

- `yarn workspace @openvaa/frontend check`: exit 0 (2222 files, 0 errors, 0 warnings).
- `yarn workspace @openvaa/frontend lint`: exit 0, with 0 errors and 1 warning. The warning is pre-existing in the unrelated `candidateContext.svelte.test.ts` (`'question' is assigned a value but never used`).
- `prettier --check` on the test file: exit 0.
- Comment hygiene: `hygiene-grep-report.sh --save-baseline` after commit ① is byte-identical to `167-hygiene-baseline.tsv`, so there are no new hits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed the Proxy factory's type parameter `T` to `TTarget`**
- **Found during:** Task 2, step 7 (frontend lint)
- **Issue:** The `@typescript-eslint/naming-convention` rule requires type parameters to match `/^T[A-Z]/u`, so the plan's `strict<T extends object>` signature failed lint with exit 1.
- **Fix:** Renamed the parameter to `strict<TTarget extends object>(target: TTarget, …): TTarget`. Behaviour is unchanged. The test, check and lint were re-run, and all exited 0.
- **Files modified:** `apps/frontend/src/lib/supabase/safeGetSession.test.ts`
- **Commit:** `096896f47`

### Precondition note

The precondition asked for `git status --porcelain` to list only the untracked gate-evidence directory. It also listed `M .planning/STATE.md` and `M .planning/state.json`. Their diff is the orchestrator's own "Phase 167 execution started" update (`status: executing`, `current_plan: 1`, `state_head: 8c519ac97`), and no code was changed. Phase 166 had 4 PLANs and 4 SUMMARYs. I read the precondition's intent (planning against the post-166 tip) as met.

## Issues Encountered

None.

## Next Phase Readiness

- 167-02..167-05 can read `PHASE_BASE` from `167-phase-base.txt`.
- 167-06 can gate on "no new hygiene hits" against `167-hygiene-baseline.tsv`.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/supabase/safeGetSession.test.ts
- FOUND: .planning/phases/167-origin-main-vestige-cleanup/167-phase-base.txt
- FOUND: .planning/phases/167-origin-main-vestige-cleanup/167-hygiene-baseline.tsv
- FOUND: commit 096896f47
