---
phase: 60-layout-runes-migration-hydration-fix
plan: 02
subsystem: ui
tags: [svelte5, runes, hydration, ssr, layout]

# Dependency graph
requires:
  - phase: 60-layout-runes-migration-hydration-fix
    plan: 01
    provides: "Parity tooling restored + D-09 E2E skeleton (unrelated to this plan's edits; Plan 60-02 has no file dependency on Plan 60-01)"
provides:
  - "Root +layout.svelte refactored to \\$derived.by validation + dedicated \\$effect for \\$dataRoot batching (Promise.all().then() pattern removed)"
  - "LAYOUT-01 SC-1 syntactic contract on root layout fully satisfied (\\$props, \\$derived, {@render children()}; no export let, no \\$:, no <slot />)"
  - "SSR-safe getEmailUrl (Rule 3 auto-fix): window/navigator accesses now guarded — previously latent SSR crash surfaced by the new synchronous ready=\\$derived timing"
  - "Confirmation signal for Plan 60-03: root-layout refactor alone did NOT unblock candidate-auth/registration (protected layout still stuck at Loading), so protected-layout LAYOUT-02 refactor remains required"
affects: [60-03, 60-04, 60-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Discriminated-union \\$derived.by over already-resolved loader data (no microtask boundary between \\$effect and \\$state writes)"
    - "SSR guards for window/navigator in client-only utility functions (typeof window !== 'undefined')"

key-files:
  created:
    - ".planning/phases/60-layout-runes-migration-hydration-fix/60-02-SUMMARY.md"
  modified:
    - "apps/frontend/src/routes/+layout.svelte — \\$effect+Promise.all().then() replaced with \\$derived.by + separate \\$effect (commit 0f1143391)"
    - "apps/frontend/src/lib/utils/email.ts — SSR guards added to getEmailUrl (commit b0b8aabd6)"

key-decisions:
  - "Used discriminated-union return shape ({ error: Error } | { data...}) for the validity \\$derived — lets `'error' in validity` narrow downstream reads without a separate enum field"
  - "Explicit type annotation on `validity` (not generic parameter on \\$derived.by) — the generic form surfaced a type-narrowing error because data.* union types are wider than DPDataType member types due to catch((e) => e) on the loader"
  - "SSR-guard fix landed as a separate atomic commit (Rule 3), not folded into Task 1 — cleaner git history; the dev-server 500 was caused BY the Task 1 refactor (timing change) but the bug ITSELF is in getEmailUrl"
  - "Did not touch FeedbackModal / Feedback.svelte — the SSR bug root cause is the unguarded window/navigator access in getEmailUrl, fixed at the utility level (1 file, 6 lines)"
  - "Preserved all D-07 orthogonal behaviors verbatim — 4 fromStore bridges, 4 orthogonal \\$effect blocks (error log, umamiRef, feedback-modal ref, visibilitychange handler), beforeNavigate/onNavigate/afterNavigate hooks, <svelte:head>, <PopupRenderer>"

patterns-established:
  - "Discriminated-union \\$derived.by for loader-data validation — avoids intermediate \\$state flags that introduce microtask races during SSR hydration"
  - "Dedicated-\\$effect-per-concern rule for layout side-effects: one \\$effect for dataRoot batching, one for error logging, one for analytics, etc. — never batch unrelated side-effects into a single \\$effect"
  - "Rule-3 scope boundary applied strictly: the SSR-guard fix only covers window/navigator in getEmailUrl; other pre-existing SSR concerns in the same Feedback component (if any) are NOT in scope"

requirements-completed: [LAYOUT-01]

# Metrics
duration: 25m 9s
completed: 2026-04-24
---

# Phase 60 Plan 02: Root Layout Runes Migration Summary

**Refactored root `+layout.svelte` from the hydration-unsafe `$effect + Promise.all(...).then(...)` pattern to a pure `$derived.by` discriminated-union validation + a dedicated `$effect` for `$dataRoot` batching, satisfying LAYOUT-01 SC-1 and eliminating the SSR microtask race on the root layer. Uncovered and auto-fixed (Rule 3) a pre-existing latent SSR crash in `getEmailUrl` that the new synchronous `ready` timing surfaced.**

## Performance

- **Duration:** 25m 9s (1777025941 -> 1777027450 Unix)
- **Started:** 2026-04-24T10:19:01Z (post-Plan-60-01 close)
- **Completed:** 2026-04-24T10:44:10Z
- **Tasks:** 2 / 2 (plus 1 Rule-3 auto-fix commit)
- **Files modified:** 2 (`apps/frontend/src/routes/+layout.svelte`, `apps/frontend/src/lib/utils/email.ts`)
- **Commits:** 3 atomic commits + 1 final metadata commit to follow

## Accomplishments

### Task 1: Root +layout.svelte refactor (D-01 + D-03 + D-05 + D-07)

**Commit:** `0f1143391`

**Line-count delta:** 209 -> 207 lines (net -2; +37 insertions, -39 deletions on the script block)

**What was removed (pre-refactor lines 73-120):**

- 3 `$state` flags: `error`, `ready`, `underMaintenance`
- The `$effect` that read all 4 loader fields, reset state, and called `Promise.all(...).then((results) => { error = update(results); })`
- The standalone `update()` function (lines 99-120) that performed validation, set `underMaintenance`, called `dataRoot.current.update(() => provide*(...))`, and set `ready = true`

**What was inserted (new lines 73-118):**

```svelte
// TODO[Svelte 5]: See if this and others like it can be handled in a centralized manner in the DataContext.
//
// Validation is a pure `$derived` over the already-resolved loader data
// (`+layout.ts` awaits every data field before returning — see the policy
// comment at `+layout.ts` lines 7-12). No `Promise.all`, no `.then()`, no
// microtask boundary between `$effect` and `$state` writes. This shape
// removes the Svelte 5 SSR+hydration reactivity race that stuck the
// previous `$effect` + promise-chain pattern at <Loading /> on full page
// loads. Ref: 60-RESEARCH §Pattern 1, D-01 + D-03 + D-05.
const validity: { error: Error } | { appSettingsData: DPDataType['appSettings']; electionData: DPDataType['elections']; constituencyData: DPDataType['constituencies'] } = $derived.by(() => {
  if (!isValidResult(data.appSettingsData, { allowEmpty: true }))
    return { error: new Error('Error loading app settings data') };
  if (!isValidResult(data.appCustomizationData, { allowEmpty: true }))
    return { error: new Error('Error loading app customization data') };
  if (!isValidResult(data.electionData)) return { error: new Error('Error loading election data') };
  if (!isValidResult(data.constituencyData)) return { error: new Error('Error loading constituency data') };
  return {
    appSettingsData: data.appSettingsData as DPDataType['appSettings'],
    electionData: data.electionData as DPDataType['elections'],
    constituencyData: data.constituencyData as DPDataType['constituencies']
  };
});

const error = $derived('error' in validity ? validity.error : undefined);
const ready = $derived(!('error' in validity));
const underMaintenance = $derived(
  !('error' in validity) && (validity.appSettingsData.access?.underMaintenance ?? false)
);

// Side effect — applies resolved data to `$dataRoot`. Reads `$derived` validity;
// NEVER calls `.then()` or `await`. Runs after the first `$derived` evaluation
// on mount and re-runs on any `data` prop change (client-side navigation).
$effect(() => {
  if ('error' in validity) return;
  dataRoot.current.update(() => {
    dataRoot.current.provideElectionData(validity.electionData);
    dataRoot.current.provideConstituencyData(validity.constituencyData);
  });
});

// Error logging side-effect — fires once when `error` transitions from absent to present.
$effect(() => {
  if (error) logDebugError(error.message);
});
```

**Preserved verbatim per D-07 (orthogonal behaviors, untouched):**

1. **Context initializations** (lines 42-67): `initI18nContext()`, `initComponentContext()`, `initDataContext()`, `initAppContext()` destructuring, `initLayoutContext()`, `initAuthContext()`.
2. **4 `fromStore(...)` bridges** (lines 64-67): `appSettings`, `dataRoot`, `openFeedbackModal`, `sendTrackingEvent`. Bridge retirement deferred per D-06 to post-v2.6.
3. **Umami ref `$effect`** (lines 127-129): `if (umamiRef?.trackEvent) sendTrackingEventStore.set(umamiRef.trackEvent);`
4. **Navigation lifecycle hooks** (lines 133-141): `beforeNavigate`, `onNavigate`, `onDestroy`, `afterNavigate`.
5. **Visibility handler `$effect`** (lines 144-151): `document.addEventListener('visibilitychange', ...)` for analytics event submission.
6. **Feedback modal ref `$effect`** (lines 159-161): `if (feedbackModalRef) openFeedbackModalStore.set(() => feedbackModalRef?.openFeedback());`
7. **`fontUrl` computation + `<svelte:head>` block** (lines 165-184).
8. **4-branch template chain** (`{#if error}{:else if !ready}{:else if underMaintenance}{:else}`) — unchanged; identifier names `error`, `ready`, `underMaintenance` retained (now `$derived` instead of `$state`, but the template reference syntax is identical).
9. **`<PopupRenderer {popupQueue} />`** on line 209 (now line 207 — handled by Plan 60-04).

**Typo fixes (additional to plan scope):**

- `'Error app customization data'` -> `'Error loading app customization data'` (missing verb in original).
- `'Error loading constituency data'` (for the `electionData` branch) -> `'Error loading election data'` (two adjacent branches had identical wrong message in original).

**Acceptance grep results (all 16 criteria satisfied):**

| Check | Expected | Actual |
|-------|----------|--------|
| `Promise.all().then()` count | 0 | 0 |
| `let $state error/ready/underMaintenance` count | 0 | 0 |
| `$derived` count | >=3 | 7 |
| `$derived.by` count | >=1 | 1 |
| `function update` count | 0 | 0 |
| SC-1 legacy patterns (`export let` / `$:` / `<slot />`) | 0 | 0 |
| SC-1 runes positive (`$props` / `$derived` / `{@render children`) | >=3 | 9 |
| `fromStore(` count | 4 | 4 |
| `<PopupRenderer` count | 1 | 1 |
| `initAppContext` count | >=1 | 2 (import + call) |
| `dataRoot.current.update` count | >=1 | 1 |
| `provideElectionData` count | >=1 | 1 |
| `provideConstituencyData` count | >=1 | 1 |
| `visibilitychange` count | >=1 | 2 (addEventListener + removeEventListener) |
| `openFeedbackModalStore.set` count | >=1 | 1 |
| `sendTrackingEventStore.set` count | >=1 | 1 |
| Line count | 160-210 | 207 |

`yarn workspace @openvaa/frontend check`: 81 errors (all pre-existing, in unrelated files; was 82 before Task 1 when I momentarily introduced a type error during the refactor, then fixed it before commit — net 0 new errors).
`yarn workspace @openvaa/frontend build`: exits 0 (build succeeds).

### Task 2: Wave-level smoke test

**Commit:** `eeae56f15` (empty chore — smoke test is execution-only per plan)

Ran two Playwright invocations. Log: `/tmp/60-02-wave-smoke.txt`.

**Candidate-registration + candidate-profile (2 direct LAYOUT-02 blocked tests):**

Status: **REG-TESTS-STILL-RED (expected — Plan 60-03 will unblock)**.

The 2 targeted specs (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) did not reach execution because their Playwright project chain (`candidate-app-mutation` -> `candidate-app`) failed upstream at `candidate-auth.spec.ts`. The upstream failure manifests as the same pre-existing stuck-at-Loading symptom in the protected candidate layout — which Plan 60-02 explicitly does NOT fix (LAYOUT-02 on the protected layout is Plan 60-03's scope). This matches the plan's expected outcome verbatim.

Failure chain:
- `[candidate-app]` project: 2/2 `candidate-auth` tests FAILED (timeout waiting for `getByTestId('candidate-home-status')`) + 8/8 `candidate-questions` tests FAILED (cascade from auth) = 10 failed in `candidate-app`
- `[candidate-app-mutation]` project: 7 tests "did not run" (cascade; includes both targeted `candidate-registration`/`candidate-profile` specs + candidate-settings + candidate-password)

Total: 5 passed (setup/teardown), 10 failed (candidate-auth + candidate-questions — all pre-existing stuck-at-Loading manifestations), 7 did not run (cascade).

**Voter regression check (voter-journey.spec.ts):**

Status: **NO VOTER REGRESSION INTRODUCED**.

| Test | Result | Baseline (SHA 3c57949c8) |
|------|--------|---------------------------|
| `voter-journey.spec.ts:42` "should load home page and display start button" | PASSED | (implicitly passed — not in the baseline failed list) |
| `voter-journey.spec.ts:56` "should auto-imply election and constituency" | PASSED | (implicitly passed) |
| `voter-journey.spec.ts:72` "should show questions intro page with start button" | FAILED | ALREADY FAILED (explicit entry in post-swap/playwright-report.json failed list) |
| `voter-journey.spec.ts:91` "should answer all Likert questions with navigation" | did not run (cascade from :72) | skipped (cascade from :72) — same pattern as baseline |

The only failure (`:72` — URL routing assertion expecting `/questions` but landing on `/elections`) is **pre-existing** in the Phase 60 baseline at SHA `3c57949c8`. No test that previously passed is now failing.

**Plan acceptance:** all 5 Task 2 criteria met:
- `/tmp/60-02-wave-smoke.txt` exists
- voter spec run completes (voter-journey.spec.ts filename with final summary line)
- no previously-passing voter test now failing
- 2 candidate-registration tests either still failing with same stuck-at-Loading symptom (they are — via upstream cascade) OR passing (they are not)
- One-line summary: "REG-TESTS-STILL-RED (expected — Plan 60-03 will unblock)"

## Task Commits

Each task committed atomically (using `git -c core.hooksPath=/dev/null` per the repo's documented hook workaround):

1. **Task 1 (root +layout.svelte refactor):** `0f1143391` — `refactor(60-02): replace $effect + Promise.all().then() with $derived validation on root +layout.svelte`
2. **Rule-3 auto-fix (SSR-guard getEmailUrl):** `b0b8aabd6` — `fix(60-02): SSR-guard window/navigator in getEmailUrl (Rule 3 auto-fix)`
3. **Task 2 (wave-level smoke):** `eeae56f15` — `chore(60-02): wave-level smoke — no voter regression introduced by Task 1` (empty commit — smoke-test only, outputs live at `/tmp/60-02-wave-smoke.txt`)

**Plan metadata commit:** to follow (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md update).

## Files Created/Modified

**Modified:**

- `apps/frontend/src/routes/+layout.svelte` (209 -> 207 lines): replaced lines 73-120 (`$state` flags + `$effect + Promise.all().then()` + `update()` function) with a `$derived.by` discriminated-union validator + separate `$effect` for `$dataRoot.update(() => provide*(...))` batching + error-logging `$effect`. All other content (imports, context inits, fromStore bridges, orthogonal `$effect` blocks, navigation hooks, `<svelte:head>`, template branch chain, `<PopupRenderer>`) preserved verbatim.
- `apps/frontend/src/lib/utils/email.ts` (+7 -2 lines): added `typeof window !== 'undefined'` and `typeof navigator !== 'undefined'` guards around `window.location.href` and `navigator.userAgent` in `getEmailUrl`. On the server, metadata falls back to `-` (metadata is only meaningful on the client's live browser session anyway).

**Created:**

- `.planning/phases/60-layout-runes-migration-hydration-fix/60-02-SUMMARY.md` (this file).

## Decisions Made

1. **Discriminated-union return shape for `validity`** — `{ error: Error } | { appSettingsData, electionData, constituencyData }` chosen over an enum (`state: 'error' | 'ready'`) so that `'error' in validity` narrows downstream reads without a separate state field. Cleaner than the v2.1 enum workaround the protected layout still uses (Plan 60-03 decides whether to retain that enum).
2. **Explicit type annotation on `validity` instead of `$derived.by` generic parameter** — the generic form produced a type-narrowing error because `LayoutData`'s field types are wider than `DPDataType` member types (due to `catch((e) => e)` on the loader widening the union beyond just `DPDataType[K] | Error`). Casting the three non-error fields via `as DPDataType[...]` after `isValidResult` narrowing resolves the mismatch without changing runtime behavior — `isValidResult` is already a type guard, so the casts are safe at the boundary.
3. **SSR-guard fix committed separately (Rule 3), not folded into Task 1** — cleaner git history + the two concerns are independent (Task 1 is a reactivity-pattern refactor; the SSR fix is a pre-existing latent bug that the refactor surfaced). Anyone doing `git bisect` on the root-layout refactor reaches a state where the dev server returns HTTP 500 on SSR pages; the follow-up fix commit addresses that immediately.
4. **Did NOT touch `FeedbackModal` or `Feedback.svelte`** — the SSR bug root cause is in `getEmailUrl` (a utility function); fixing at the utility level is minimum-blast-radius (6 lines in 1 file) and doesn't risk altering the Feedback component's behavior.
5. **Preserved the error-logging `$effect`** (now at lines 116-118) — moved it alongside the validity/dataRoot effects for topical grouping but did NOT consolidate it into the dataRoot `$effect` (per D-07 "no consolidation beyond primary refactor").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SSR-guard window/navigator in getEmailUrl**

- **Found during:** Task 2 (Wave-level smoke — dev server returned HTTP 500 on every SSR page, blocking Playwright from running)
- **Issue:** After the Task 1 refactor, `ready` is `$derived(!('error' in validity))` — which evaluates synchronously during SSR on valid loader data. Pre-refactor, `ready` started as `$state(false)` and was only set to `true` inside the `.then()` microtask, so `ready = false` during SSR and `FeedbackModal` (rendered in the `{:else ready && !underMaintenance}` branch) was never SSR-rendered. After the refactor, `ready = true` during SSR, so `FeedbackModal` -> `Feedback.svelte` renders server-side, which hits a pre-existing latent bug in `getEmailUrl()`: direct `window.location.href` and `navigator.userAgent` references without SSR guards. Result: `ReferenceError: window is not defined` -> HTTP 500.
- **Fix:** Added `typeof window !== 'undefined'` and `typeof navigator !== 'undefined'` guards. On the server, metadata falls back to `-` — the mailto metadata is only meaningful on the client's live browser session anyway.
- **Files modified:** `apps/frontend/src/lib/utils/email.ts`
- **Verification:**
  - Before fix: `curl -sL http://localhost:5173/en` -> HTTP 500 with "ReferenceError: window is not defined at getErrorEmail" in dev logs
  - After fix: `curl -sL http://localhost:5173/en` -> HTTP 200 with fully SSR-rendered home page including the FeedbackModal dialog body
  - Git-bisect-style confirmation: reverting `+layout.svelte` to HEAD~1 (pre-refactor) with the fix still in place gives HTTP 200 (fix is safe in both pre- and post-refactor configurations)
- **Committed in:** `b0b8aabd6` (separate from Task 1 for clean git history; both commits live under the `60-02` plan scope)

**2. [Not a deviation — expected typo fix folded into Task 1] Error message corrections**

Two pre-existing typos in the original `update()` function error messages were corrected as part of the refactor (plan Step 3 explicitly called these out as "note: also fix the two constituency data typo error messages and the missing verb in 'Error app customization data'"):

- `'Error app customization data'` -> `'Error loading app customization data'`
- `'Error loading constituency data'` (used for the `electionData` validation branch) -> `'Error loading election data'` (distinct message from the actual `constituencyData` branch which retains `'Error loading constituency data'`)

Not tracked as a separate Rule-N deviation because the plan explicitly instructs this correction in Task 1.

---

**Total deviations:** 1 Rule-3 auto-fix (blocking SSR error caused by reactivity timing change)
**Impact on plan:** The Rule-3 fix was essential to unblock Task 2 (without it, the dev server returns 500 and no E2E can run). The fix is in-scope (caused BY this plan's Task 1 timing change), minimal (6 lines, 1 file), and does not expand plan scope. No architectural changes; no checkpoint required.

## Issues Encountered

1. **Pre-existing SvelteKit dev server on port 5173 was in a broken HMR state at session start** — a yarn dev instance from a prior session (started 3:58 PM, ~5 hours before this plan execution) had cached state from pre-refactor files, returning 500 on HMR reload. Resolved by killing the stale processes (`kill 5039 5038 5037 95028 95027 94980`) and restarting `yarn workspace @openvaa/frontend dev` cleanly. Not a code issue; environment hygiene.

2. **Type error in `$derived.by` generic parameter form** — initial Task 1 implementation used `$derived.by<{ error: Error } | { ...resolved fields }>(...)` as a generic parameter. Svelte-check flagged: `Argument of type '() => ... | { appSettingsData: <wide union>; electionData: <wide union>; constituencyData: <wide union>; }' is not assignable to parameter of type '() => { error: Error } | { appSettingsData: DPDataType["appSettings"]; ... }'`. Root cause: `LayoutData`'s field types are a wider union than `DPDataType` members (the loader's `catch((e) => e)` widens each field to `DPDataType[K] | Error | ...`). Resolved by switching to an explicit type annotation on `validity` and casting the three fields via `as DPDataType[...]` after `isValidResult` narrowing. The casts are safe at the boundary because `isValidResult` is already a type guard. Resolved before the Task 1 commit, so the final commit has zero new errors.

3. **voter-journey.spec.ts:72 failed but was already failing in baseline** — initially concerning but inspection of the restored baseline at `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` confirmed the test was in the 10-failure pool at SHA `3c57949c8`. Not a Plan 60-02 regression.

## TDD Gate Compliance

N/A — Plan 60-02 is not a TDD plan (`tdd="false"` on both tasks). No RED/GREEN/REFACTOR gate cycle required. Commit types used: `refactor` (Task 1), `fix` (Rule-3 auto-fix), `chore` (Task 2 empty smoke).

## User Setup Required

None — no external service configuration, no env-var changes, no dashboard steps.

## Next Phase Readiness

**Ready for Plan 60-03 (protected candidate +layout.svelte LAYOUT-02 refactor):**

- Root layout is now on the canonical runes-idiomatic pattern (`$derived.by` over already-resolved loader data + dedicated `$effect` for side-effects). Plan 60-03 applies the same pattern to `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (see 60-PATTERNS.md §protected layout section for the 4-way enum-retention approach).
- Plan 60-02 produced a **confirmation signal**: root-layout refactor alone did NOT unblock candidate-auth/registration tests (they still exhibit the stuck-at-Loading symptom via the protected layout), so Plan 60-03's protected-layout refactor is confirmed necessary — not made redundant by Plan 60-02. This rules out the "bonus" branch where Plan 60-02 fixes LAYOUT-02 on its own.
- The Rule-3 `getEmailUrl` SSR guard is orthogonal to LAYOUT-02 and works for any layout shape — Plan 60-03 inherits it without further action.

**Signals for Plan 60-04 (LAYOUT-03 empirical PopupRenderer removal):**

- `<PopupRenderer {popupQueue} />` still present at line 207 of root +layout.svelte; untouched per plan scope. Plan 60-04 attempts inline removal.
- No popup-specific changes made in Plan 60-02. `popupQueue` is still destructured from `initAppContext()` but never referenced for the popup renderer's logic in the root file itself (the PopupRenderer component still owns that reactivity).

**Signals for Plan 60-05 (SC-4 parity gate):**

- Plan 60-02 did not re-capture a Playwright post-change report; that is Plan 60-05's job. The wave-level smoke at `/tmp/60-02-wave-smoke.txt` is intentionally scope-limited (3 specs: 2 targeted candidate + 1 voter regression marker) and not intended as a parity-gate input.
- No new tests added. `voter-popup-hydration.spec.ts` (created in Plan 60-01 as `test.skip`) remains skipped pending Plan 60-04 Task 1.

## Threat Flags

None. Plan 60-02 touched two files:

- `apps/frontend/src/routes/+layout.svelte` — reactivity-pattern refactor inside an existing client component. No new trust boundary; the data flow (SSR loader -> `$derived` -> render branch) is unchanged from the pre-refactor shape (loader -> `$state` via `.then()` -> render branch). Timing of computation changed; surface of computation did not.
- `apps/frontend/src/lib/utils/email.ts` — SSR-guard added to a client-only utility. Narrows the surface (fewer code paths execute on the server) rather than broadening it. No new network/auth/file-access paths.

Per the plan's threat-model register (T-60-02-01..03): all dispositions were `accept` with rationale "inputs unchanged, re-computation cost O(4), log-noise benign." None require mitigation. No new threats introduced by the Rule-3 fix (it removes a crash path on the server, strictly improving security posture).

## Self-Check: PASSED

**Files created:**

- `.planning/phases/60-layout-runes-migration-hydration-fix/60-02-SUMMARY.md` — FOUND (this file)

**Files modified (verified via git diff HEAD~3 HEAD --name-only):**

- `apps/frontend/src/routes/+layout.svelte` — FOUND; diff shows 37 insertions / 39 deletions; net -2 lines; 207 lines total
- `apps/frontend/src/lib/utils/email.ts` — FOUND; diff shows 7 insertions / 2 deletions; net +5 lines

**Commits (verified via git log --oneline):**

- `0f1143391` — FOUND: refactor(60-02): replace $effect + Promise.all().then() with $derived validation on root +layout.svelte
- `b0b8aabd6` — FOUND: fix(60-02): SSR-guard window/navigator in getEmailUrl (Rule 3 auto-fix)
- `eeae56f15` — FOUND: chore(60-02): wave-level smoke — no voter regression introduced by Task 1

**Plan-level verification:**

```
$ F=apps/frontend/src/routes/+layout.svelte; \
  [ "$(grep -cE 'Promise\.all\(.*\)\.then\(' $F)" -eq 0 ] && \
  [ "$(grep -c '\$derived' $F)" -ge 3 ] && \
  [ "$(grep -c 'fromStore(' $F)" -eq 4 ] && \
  [ "$(grep -c '<PopupRenderer' $F)" -eq 1 ] && \
  [ "$(grep -cE '(export let|^[[:space:]]*\$:|<slot[[:space:]]*/>)' $F)" -eq 0 ] && \
  yarn workspace @openvaa/frontend build >/dev/null 2>&1 && \
  curl -sL -o /dev/null -w '%{http_code}' http://localhost:5173/en | grep -q '200' && \
  echo "Plan 60-02 end verification complete"

Plan 60-02 end verification complete
```

---

*Phase: 60-layout-runes-migration-hydration-fix*
*Completed: 2026-04-24*
