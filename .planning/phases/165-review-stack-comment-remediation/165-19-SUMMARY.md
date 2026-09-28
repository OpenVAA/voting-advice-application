---
phase: 165-review-stack-comment-remediation
plan: 19
subsystem: auth
tags: [sveltekit, supabase-auth, hooks, vite, loadEnv, vitest, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 hygiene gate, read log, assert-absent and ledger instruments; 165-06's SupabaseDatabase alias boundary; 165-15 (wave dependency)"
provides:
  - "createSafeGetSession(supabase): per-request safeGetSession that verifies each access token with getUser() once, re-reads getSession() on every call, and never caches a failed verification"
  - "resolveProjectIdEnv no longer lets an empty shell PUBLIC_PROJECT_ID / E2E_PROJECT_ID shadow the repo-root .env, and restores process.env afterwards"
  - "layout.load.test.ts mocks createDataProvider / createSupabaseUniversalClient and asserts the read spies, so a guard regression fails instead of passing vacuously"
  - "Hygiene-clean comments and recorded reads for all six changed files; three ledger rows filled"
affects: [165-24, 165-30, 165-36]

actuals:
  tokens: 12590
  tasks: 3
  commits: 8
plan_head_before: 976d02ba2e8bd2a3c9e913c696dfb349b76d0882
plan_head_after: bd07a675cd7425066df6d68e311de9e61fa3511f

tech-stack:
  added: []
  patterns:
    - "Per-request memo: a closure Map keyed by access token, created inside supabaseHandle, holding the pending verification promise so concurrent callers share it; rejected or errored entries evicted"
    - "Env-overlay neutralisation: remove exactly-empty keys from process.env around loadEnv, restore in finally"
    - "Guard specs assert the side-effect spies before the redirect, so falling through the guard fails on the spy"

key-files:
  created:
    - apps/frontend/src/lib/supabase/safeGetSession.ts
    - apps/frontend/src/lib/supabase/safeGetSession.test.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-19.tsv
  modified:
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/vite.projectIdEnv.ts
    - apps/frontend/vite.projectIdEnv.test.ts
    - apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md

key-decisions:
  - "safeGetSession keeps calling getUser() with no argument rather than getUser(token): the no-argument path is what sets auth-js's suppressGetSessionWarning and clears a revoked session, and the token it verifies is the one getSession() just returned"
  - "A verification that returns no user (with or without an error) yields { session: null, user: null } and is evicted from the memo; a thrown verification propagates and is evicted"
  - "The two admin specs that transcribe the old inline safeGetSession were left alone (outside the plan's six files) and logged in deferred-items.md for the phase-wide residue read"

patterns-established:
  - "RED evidence for vitest specs: run with --reporter=junit and check with gsd-tools check tdd-red-evidence, target = the test file classname"

requirements-completed: [165-SC2, 165-SC3, C-4080520474, C-4080502829, C-4080502860]

coverage:
  - id: D1
    description: "A request verifies each access token once; a session created mid-request is still seen; a changed token and a failed verification are verified afresh (C-4080502829)"
    requirement: "C-4080502829"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/supabase/safeGetSession.test.ts (yarn workspace @openvaa/frontend test:unit safeGetSession, 7/7)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check (0 errors, 0 warnings); yarn assert:no-session-in-loads; node scripts/assert-project-scoped-queries.mjs; test:unit supabaseTypes.parity (4/4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Admin and candidate login journeys still work end to end with the memoised safeGetSession"
    requirement: "C-4080502829"
    verification: []
    human_judgment: true
    rationale: "The behavioural proof is the full E2E run in plan 165-24; this plan runs no E2E (wave-safety rule)"
  - id: D3
    description: "An empty shell PUBLIC_PROJECT_ID / E2E_PROJECT_ID no longer shadows the root .env; process.env is restored; a non-empty shell value still wins; the docstring states the current reason for the bridge (C-4080502860)"
    requirement: "C-4080502860"
    verification:
      - kind: unit
        ref: "apps/frontend/vite.projectIdEnv.test.ts (yarn workspace @openvaa/frontend test:unit vite.projectIdEnv, 8/8)"
        status: pass
      - kind: other
        ref: "bash scripts/assert-absent.sh \"defaulting to .process\\.cwd\" -- apps/frontend/vite.projectIdEnv.ts (exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "layout.load.test.ts mocks the factories +layout.ts imports and fails on the read spies when the guard is bypassed (C-4080520474)"
    requirement: "C-4080520474"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts (yarn workspace @openvaa/frontend test:unit layout.load, 4/4)"
        status: pass
      - kind: other
        ref: "bash scripts/assert-absent.sh 'dataProvider: Promise.resolve' -- '<test>' (exit 0); scripts/tip-proofs.sh (27/27 PASS, incl. C-4080515115)"
        status: pass
    human_judgment: false
  - id: D5
    description: "All six changed files pass the hygiene gate with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash scripts/hygiene-changed-files.sh --check-reads --files <the six files> (exit 0, VERDICT: CLEAN)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 19: App-shell review fixes Summary

**Per-request, per-token memoised `safeGetSession` extracted to `createSafeGetSession` and wired into the hook; an env bridge that no longer lets an empty shell project id shadow the root `.env`; and a located-layout load test whose mock matches the route's imports and fails on the read spies.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-09-27T21:38:16Z
- **Completed:** 2026-09-27T21:50:14Z
- **Tasks:** 3 of 3
- **Files modified:** 6 source files, plus the read log, ledger and deferred-items

## Accomplishments

- `createSafeGetSession(supabase)` calls `getSession()` on every invocation and memoises the `getUser()` verification in a closure `Map` keyed by `session.access_token`. The hook's gate and `admin/+layout.server.ts` now share one verification round trip. A password login's `getSession()` after `signInWithPassword` still sees the new session, a changed token is verified again, and an errored or thrown verification is evicted rather than cached as a success.
- `resolveProjectIdEnv` removes any project-id key the shell set to exactly `''` from `process.env` while `loadEnv` runs, then restores it in a `finally`. `loadEnv` returns the file values, and the existing loop applies them. The docstring now states why the bridge exists: SvelteKit reads the root `.env` through `kit.env.dir`, but its `loadEnv` lets any `process.env` entry override the file, an empty one included.
- `layout.load.test.ts` mocks `createDataProvider` (returning the two read spies) and `createSupabaseUniversalClient`, passes the `data.supabaseCookies` the route reads, and asserts that neither read ran before it checks the redirect in all four cases.
- `hooks.server.ts` comments are hygiene-clean: the `decision C3's NOTE, pitfall P3`, `decision C2`, `ruling D9` labels and the "defect fixed below" narrative are gone, and the long rationale blocks are cut to their point.

## Task Commits

1. **Task 1: per-token verification memo (tracer, TDD)**
   - RED `c6d8d0639` (test): the spec, plus the hook's inline body extracted unchanged as `createSafeGetSession`
   - GREEN `b0497bb4e` (fix): memo, hook wiring, hook comment hygiene. `Review-Comment: C-4080502829`
2. **Task 2: empty shell value no longer shadows the root `.env` (TDD)**
   - RED `36b4172cf` (test)
   - GREEN `f8fb362c6` (fix). `Review-Comment: C-4080502860`
   - `1b861d36e` (docs): the spec's node-environment note cut to its point. Comment-only, `code-identity.mjs` code-identical. `Hygiene: D-04`
3. **Task 3: located-layout test mocks the route's factories**
   - `958ec480a` (fix). `Review-Comment: C-4080520474`
   - `fc39311c9` (chore): hygiene reads of the six files. `Hygiene: D-04`
   - `bd07a675c` (chore): the three ledger rows and deferred items

## RED and scratch-red runs

| Run | Exit | Key output |
|---|---|---|
| `yarn workspace @openvaa/frontend test:unit safeGetSession` on the unmemoised extraction (`c6d8d0639`) | 1 | 2 failed / 5 passed. `verifies a token once…` and `shares one verification between concurrent calls` fail on `AssertionError: expected "spy" to be called 1 times, but got 2 times`. `gsd-tools check tdd-red-evidence` (junit output, target `src/lib/supabase/safeGetSession.test.ts`) returns `RED_EVIDENCE_OK` |
| same, after `b0497bb4e` | 0 | 7 passed (7) |
| `yarn workspace @openvaa/frontend test:unit vite.projectIdEnv` at `36b4172cf` | 1 | 1 failed / 7 passed. `uses the env-file values when the shell sets both keys to the empty string` fails on `expected '' to be '00000000-0000-0000-0000-000000000001'`. `check tdd-red-evidence` returns `RED_EVIDENCE_OK` |
| same, after `f8fb362c6` | 0 | 8 passed (8) |
| `test:unit layout.load`, new spec, `hasSelection` scratch-forced to `true` in `+layout.ts` | 1 | 4 failed. Every case fails on `AssertionError: expected "spy" to not be called at all, but actually been called 1 times` |
| `test:unit layout.load`, OLD spec (HEAD), same scratch bypass | 1 | 4 failed on `Error: [vitest] No "createSupabaseUniversalClient" export is defined on the "$lib/api/dataProvider" mock` |
| `test:unit layout.load` after reverting the scratch (`git checkout -- +layout.ts`, `grep -c SCRATCH` = 0) | 0 | 4 passed (4) |

## Gates (statuses read directly)

| Command | Exit |
|---|---|
| `yarn workspace @openvaa/frontend check` (after Tasks 1 and 3) | 0, `2780 FILES 0 ERRORS 0 WARNINGS` |
| `yarn workspace @openvaa/frontend lint` | 0 (1 warning, the pre-existing `candidateContext.svelte.test.ts` item already in deferred-items) |
| `eslint vite.projectIdEnv.ts vite.projectIdEnv.test.ts` (outside `src/`) | 0 |
| `yarn assert:no-session-in-loads` | 0 (0 violations) |
| `node scripts/assert-project-scoped-queries.mjs` | 0 (0 violations) |
| `yarn workspace @openvaa/frontend test:unit supabaseTypes.parity` | 0 (4/4) |
| `test:unit` over the specs that reference `hooks.server.ts` (requireAdminIdentity, adminJobLifetime, adminJobsAuthorization, routeConsistency, buildRoute.redirects, isValidResult, eslint-adapter-boundary-guard) | 0 (7 files, 207 tests) |
| `bash scripts/assert-absent.sh "defaulting to .process\.cwd" -- apps/frontend/vite.projectIdEnv.ts` | 0 |
| `bash scripts/assert-absent.sh 'dataProvider: Promise.resolve' -- '…/layout.load.test.ts'` | 0 |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <six files>` | 0, `VERDICT: CLEAN`, `unread=0` |
| `bash scripts/tip-proofs.sh` | 0 (27 PASS, including C-4080515115, which reads `layout.load.test.ts`) |
| `bash scripts/ledger-check.sh` | 0 |

The behavioural proof for the memo (the admin and candidate login journeys, including password login's mid-request `getSession()`) is the full E2E run in plan 165-24. This plan ran no E2E, per its wave-safety rule.

## Review-comment dispositions

| Comment | Disposition | Commit | Evidence | Draft reply |
|---|---|---|---|---|
| [C-4080520474](https://github.com/OpenVAA/voting-advice-application/pull/881#discussion_r4080520474) | fix | `958ec480a` | `test:unit layout.load` 4/4; with the guard scratch-bypassed the new spec fails on the read spies, the old one on the missing mock export | Fixed in 958ec480a: the mock exports `createDataProvider` and `createSupabaseUniversalClient`, and every case asserts neither data read ran before it checks the redirect, so a guard regression fails on the spies instead of passing vacuously. |
| [C-4080502829](https://github.com/OpenVAA/voting-advice-application/pull/882#discussion_r4080502829) | fix | `b0497bb4e` | `test:unit safeGetSession` 7/7 (RED: 2 cases, `called 2 times`); `check` 0 errors; login journeys covered by 165-24's E2E run | Fixed in b0497bb4e: `createSafeGetSession` memoises the `getUser()` verification per access token for the request, so the hook's gate and the admin layout share one round trip. `getSession()` is still read on every call, so a mid-request password login is seen, and failed verifications are never cached. |
| [C-4080502860](https://github.com/OpenVAA/voting-advice-application/pull/882#discussion_r4080502860) | fix | `f8fb362c6` | `test:unit vite.projectIdEnv` 8/8 (RED: `expected '' to be '…0001'`); stale `process.cwd()` claim absent | Fixed in f8fb362c6: keys the shell set to `''` are removed from `process.env` while `loadEnv` runs and restored afterwards, so the file value is loaded and applied; a non-empty shell value still wins. The docstring now gives the current reason for the bridge. |

## Files Created/Modified

- `apps/frontend/src/lib/supabase/safeGetSession.ts`: `createSafeGetSession`, the per-request, per-token verification memo
- `apps/frontend/src/lib/supabase/safeGetSession.test.ts`: 7 cases (memo, concurrency, mid-request session, token change, errored and thrown verification, no cross-request memo)
- `apps/frontend/src/hooks.server.ts`: `event.locals.safeGetSession = createSafeGetSession(supabase)`, plus comment hygiene
- `apps/frontend/vite.projectIdEnv.ts`: `loadWithoutEmptyShellValues` around `loadEnv`, plus an accurate docstring
- `apps/frontend/vite.projectIdEnv.test.ts`: three shell-environment cases, with process.env saved and restored per case
- `apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts`: factory mocks, spy-first assertions, new header
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-19.tsv`: the six read records
- `.planning/phases/165-review-stack-comment-remediation/165-LEDGER.md`, `deferred-items.md`: three rows filled; three out-of-scope findings logged

## Decisions Made

See `key-decisions`. The one with a behavioural consequence: the memo verifies with `supabase.auth.getUser()` and no argument, as the inline code did. Passing the token would skip auth-js's lock and the `suppressGetSessionWarning` flag it sets on success. It would also skip the revoked-session cleanup inside `_getUser()`. The key is the token `getSession()` just returned, which is the token the no-argument call verifies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `runLoad` supplied no `data`, so a scratch guard bypass would have crashed on `data.supabaseCookies` rather than on the spies**
- **Found during:** Task 3
- **Issue:** `+layout.ts` reads `data.supabaseCookies` before building the client. Without it, the "fails on the spy assertion" property the plan requires could not hold.
- **Fix:** `runLoad` passes `data: { supabaseCookies: [] }`. The assertions were reordered (spies first, then redirect), and `captureRedirect` became `redirectOf`, which returns `undefined` instead of throwing when `load` resolves, so the spy assertion is the one that fires.
- **Files modified:** `apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts`
- **Verification:** the scratch-red run in the table above
- **Committed in:** `958ec480a`

**2. [TDD discipline] RED commit for Task 1 includes the extracted, still-unmemoised helper**
- **Found during:** Task 1
- **Issue:** a spec against a missing module fails on an import error, which counts as INVALID_RED.
- **Fix:** the RED commit extracts the hook's inline body unchanged into `safeGetSession.ts`, not yet wired, so the spec fails on its memo assertions (`RED_EVIDENCE_OK`).
- **Committed in:** `c6d8d0639`

**3. [Hygiene] One comment-only tightening in `vite.projectIdEnv.test.ts`, as its own `Hygiene: D-04` commit**
- **Committed in:** `1b861d36e` (code-identical per `code-identity.mjs HEAD WORKTREE`)

---

**Total deviations:** 1 auto-fixed bug in the test harness, 1 TDD-shape adjustment, 1 hygiene-only commit
**Impact on plan:** none on scope; all three are needed for the plan's own acceptance criteria.

## Issues Encountered

- `hygiene-allow/165-19.tsv` (listed in `files_modified`) was not created. No allowlist entry was needed: every file passed the gate outright.
- Out-of-scope findings, logged in `deferred-items.md` § From 165-19:
  - `requireAdminIdentity.test.ts` and `adminJobsAuthorization.test.ts` still transcribe the old inline `safeGetSession`, and their "cannot be invoked from a unit test" rationale is now false.
  - `hooks.client.ts` still has the logger-block planning labels.
  - The bridge comments in `vite.config.ts` and `svelte.config.js` (owner 165-30) are now inaccurate.

## Next Phase Readiness

- The three app-shell threads are fixed at the tip, each answerable with one commit link.
- The 165-24 full E2E run is the behavioural gate for the memo: admin login, candidate password login, and protected-route redirects.

## Self-Check: PASSED

- Created files exist: `safeGetSession.ts`, `safeGetSession.test.ts`, `hygiene-reads/165-19.tsv`
- All eight plan commits (`c6d8d0639`, `b0497bb4e`, `36b4172cf`, `f8fb362c6`, `958ec480a`, `1b861d36e`, `fc39311c9`, `bd07a675c`) are reachable from HEAD
- `git rev-list --count 976d02ba2..bd07a675c` = 8

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-27*
