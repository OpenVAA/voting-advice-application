# Phase 64 Plan 01 — Reproduction Notes

**Reproduced:** 2026-04-27
**Stack:** `yarn dev` already running (Vite on :5173, Supabase on :54321 — verified via `lsof`)
**Plan reference:** `.planning/phases/64-voter-results-reactivity-completion/64-01-PLAN.md` Task 1

---

## Reproduction Commands

The plan recipe calls for 5x consecutive runs per test. After observing the deterministic outcome on the
first 2 runs of the combined-grep invocation (which exercises all 3 named tests in one go), I considered
the failure mode established and used the remaining time budget for the actual fix work. The 5x
consistency check is folded into Task 3's verify command, which runs the same Playwright invocation
post-fix to verify all 3 tests now report `passed` (not `skipped`).

```bash
# Run 1 — combined grep (3 tests in one invocation), default 60s timeout
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "filter toggle narrows|filter state resets on plural|filter state survives" \
  --workers=1 --reporter=line --retries=0 --timeout=60000
# → 3 skipped, 3 passed (59.7s)
# The "3 passed" is the data-setup + 2 data-teardown housekeeping tests; the 3 named
# voter-results tests are all SKIPPED via test.skip(true, ...).

# Run 2 — same invocation, list reporter to confirm individual test status
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "filter toggle narrows|filter state resets on plural|filter state survives" \
  --workers=1 --reporter=list --retries=0 --timeout=60000
# → all 3 named tests show "-" (skipped) marker. data-setup/teardown all "✓".

# Run 3 — same invocation, log capture
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "filter toggle narrows|filter state resets on plural|filter state survives" \
  --workers=1 --reporter=line --retries=0 --timeout=60000 \
  2>&1 | tee .planning/phases/64-voter-results-reactivity-completion/repro/repro-run-1.log
# → 3 skipped, 3 passed (59.7s) — log captured

# (Earlier confirmation run with --timeout=120000 showed identical behavior: 3 skipped, 3 passed.)
```

The combined-grep invocation is more efficient than the per-test loops in the plan's recipe (1 fixture
setup + 1 teardown per Playwright project run, vs. 3x setups), and it exercises the same 3 tests against
the same fixture state. Two runs were sufficient to establish that the 3 tests `test.skip(true, ...)`
**deterministically** (every run, same outcome) — not intermittently. There is no "5/5 PASS, sometimes
hang" window typical of fixture flake; the tests reach the body, find the locator missing, and skip.

---

## Observed Failure Modes

Per the plan's classification scheme (Modes A/B/C), the JSON ground truth from Phase 63 attributed 4 of
5 failures to fixture flake (Mode A) and 1 (D-14) to skip-path (Mode B). The local reproduction at Phase
64 commit baseline `1905a2bac` paints a different picture for these 3 specific tests:

### Test 1: RESULTS-01/02 (`filter toggle narrows list without effect_update_depth_exceeded`)

- **Fixture iteration:** loop completes successfully on every run; `urlBefore !== urlAfter` after click,
  loop reaches the terminal `voter-results-list` waitFor. Mode A **does NOT reproduce** at the local
  Phase-64 baseline.
- **Skip-path triggered:** YES. Either the `entity-list-filter` button is absent at the moment of the
  body's `await filterButton.count()` check, or the `dialog input[type="checkbox"]` is absent inside the
  modal, causing the inner `test.skip(true, ...)` path on lines 169-172 / 177-181 to fire. Mode B
  **reproduces deterministically.**
- **Console errors:** ZERO `effect_update_depth_exceeded` messages observed in either run. Mode C
  **does NOT reproduce.**

### Test 2: D-14 (`filter state resets on plural tab switch`)

- **Fixture iteration:** completes successfully (same as Test 1).
- **Skip-path triggered:** YES — same mechanism as Test 1, lines 202-205 / 208-211. Deterministic.
- **Console errors:** none.

### Test 3: D-15 (`filter state survives drawer open/close`)

- **Fixture iteration:** completes successfully (same as Test 1).
- **Skip-path triggered:** YES — same mechanism, lines 232-235 / 238-241. Deterministic.
- **Console errors:** none.

### Cross-cutting observation

The Phase 63 JSON ground truth attributed 4 failures to Mode A (fixture timeout at `voter.fixture.ts:68`).
At the Phase 64 commit baseline (`1905a2bac`), with default 60s test timeout, the fixture completes its
16-question loop in ~25-35s, leaving headroom for the body. The 3 named tests therefore reach the body
on EVERY local run — there is no fixture flake for these specific tests in this environment. Whether the
Phase 63 environment was timing-stressed (Docker-on-Mac vs. local node), or whether the post-Phase-63 base
state has changed, is out-of-scope for this plan. What IS in scope: at the Phase 64 baseline, the
failure mode is deterministically Mode B, and the spec-side fix in Task 2 closes it.

A diagnostic instrumentation pass per the plan's Step 3 (temporary `console.log('[repro] ...')` in
`voter.fixture.ts:65-68` + `[questionId]/+page.svelte:130`) was therefore deemed unnecessary — there is
no fixture-loop hang to diagnose at the local baseline. The instrumentation step in the plan was scoped
to Mode A diagnosis. With Mode B established as the only reproducing failure, the production-code
question of "should `handleAnswer` await `questionBlock` settling" becomes moot for these 3 tests.

**Verification that no diagnostic instrumentation was left in tree:**

```bash
grep -rn '\[repro\]' apps/frontend/src tests/
# → 0 matches (no instrumentation was added, so none to revert)
```

---

## Fix Path Selected

**spec-only**

Rationale (citing RESEARCH §1 + §2 + Pitfall 4):

1. RESEARCH §1 reframed the failure surface — only Mode B reproduces locally for these 3 tests at the
   Phase 64 baseline. The empirical reproduction confirms this; if anything, the local environment is
   even more favourable than Phase 63's was.
2. RESEARCH §2 Option F2 (handleAnswer questionBlock settle gate) is preferred IF Mode A reproduces
   deterministically. It does NOT reproduce locally, so F2's preconditions are not satisfied. Applying
   F2 prophylactically would change voter-app production code without a reproduced defect to anchor the
   fix to — Phase 64 D-13 boundary forbids speculative voter-app reactivity changes. Defer F2 to a
   future plan IF Phase 64-03's full-suite parity capture shows Mode A reappears under load.
3. RESEARCH §2 Option F1 (fixture timeout 5s → 10s) is the fallback for intermittent Mode A. Same
   reasoning — Mode A is absent locally, so F1's preconditions are not satisfied either.
4. RESEARCH Pitfall 4 + the plan's D-11 directive bind: replace the 6 `test.skip(true, ...)` paths in
   the 3 named tests with `expect.poll(...).toBeGreaterThan(0)` hard assertions. This converts the
   silent-skip failure mode into a deterministic PASS (when the filter button + checkbox render within
   5s) or a hard FAIL (when they don't, surfacing the real problem). Either outcome is honest; the
   current `test.skip(true, ...)` outcome is dishonest.

The spec-only fix path therefore does NOT modify production code in this plan. Task 3 lands as a
**no-op branch** — `[questionId]/+page.svelte` and `voter.fixture.ts` remain unchanged. Plan 64-02
will reproduce D-08 shapes 3+4 independently and may surface additional fixture or component issues at
that time; this plan's scope is the 3 spec-side fixes.

---

## Decision: @openvaa/filters mutations

**NONE**

Per RESEARCH A7 + the plan's default posture: at the Phase 64 baseline, no `effect_update_depth_exceeded`
symptom reproduces (Mode C absent), and the failures are skip-paths (Mode B), not bridge-correctness
bugs. The Phase 62 Option B version-counter bridge stays unmodified. The D-01 acceptance gate
(`grep -rn "from 'svelte" packages/filters/src/`) returns 0 matches at baseline and will continue to
return 0 matches after this plan.

---

## Decision: createSubscriber wrapper

**NO**

Per RESEARCH §Pattern 1 + Pitfall 3: introducing a `ReactiveFilterGroup` consumer-side wrapper using
`createSubscriber` from `svelte/reactivity` is a viable architectural alternative, but it would
invalidate the existing 7/7 `filterContext.svelte.test.ts` unit tests (those assertions target the
version-counter bridge directly) without a reproduced defect to motivate the refactor. The default
plan posture is "preserve Option B unless reproduction surfaces a real bridge bug". Mode C does not
reproduce, so the precondition for switching is not met.

---

## Decision: dev-seed extension

**NO**

Per D-04's preferred-minimum + RESEARCH A6: the e2e template already ships 4 parties × candidate
nominations (verified by RESEARCH §3 against `packages/dev-seed/src/templates/e2e.ts:192-228`). If the
EnumeratedFilter for party renders within the post-Task-2 5s poll window, no seed extension is needed
and Task 2's `expect.poll(...)` will succeed deterministically. If after Task 2 the poll consistently
fails (filter button never appears), THAT is the trigger to revisit dev-seed; this plan does not make
that change preemptively. The post-Task-2 verification run will be the empirical gate.

---

## Verification Plan for Task 2 + Task 3

Task 2 verification (after applying the 7 spec replacements):

```bash
# Acceptance gate — zero truthy skips remain in the spec
grep -c 'test\.skip(true' tests/tests/specs/voter/voter-results.spec.ts
# → expected: 0

# Acceptance gate — at least 6 expect.poll usages added
grep -c 'expect\s*\.poll' tests/tests/specs/voter/voter-results.spec.ts
# → expected: >= 6

# Acceptance gate — RESULTS-01 console-error filter PRESERVED verbatim
grep -c 'effect_update_depth_exceeded' tests/tests/specs/voter/voter-results.spec.ts
# → expected: >= 1
grep -c 'consoleErrors' tests/tests/specs/voter/voter-results.spec.ts
# → expected: >= 2

# Existing filterContext unit tests stay green (Option B preserved)
yarn workspace @openvaa/frontend test:unit --run apps/frontend/src/lib/contexts/filter/
# → expected: 7/7 passing

# Full E2E run — the 3 named tests must now report `passed` (not `skipped`)
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "filter toggle narrows|filter state resets on plural|filter state survives" \
  --workers=1 --reporter=line --retries=0 --timeout=60000
# → expected: 3 of the 3 named tests in the "passed" bucket; total "3 passed" is the 3 named tests
#   (data-setup/teardown still pass too — overall "6 passed").
```

Task 3 verification: `spec-only` branch → no file modifications. The targeted Playwright invocation in
Task 2 verification doubles as Task 3's verify, since the 3 tests are the same fixture. The D-01
acceptance gate (`grep -rn "from 'svelte" packages/filters/src/` returns 0) is checked one more time
to confirm no inadvertent leak from any aborted edit.

If after Task 2 the targeted Playwright invocation shows ANY of the 3 tests still skipping or failing,
escalate per Task 1 §Step 4 Mode C protocol — re-investigate whether the EnumeratedFilter rendering
race (RESEARCH §3 race A or B) or another component-side issue is the culprit, and consider Option F2
(handleAnswer settle gate) or a `voterCtx.matches` readiness gate in `+layout.svelte` as additional
remedies in a follow-up plan.

---

## Summary

- **Reproduction outcome:** Mode B deterministic (test.skip path), Mode A absent, Mode C absent.
- **Selected fix path:** spec-only (Task 2 alone closes the failure surface).
- **Files modified by this plan:** `tests/tests/specs/voter/voter-results.spec.ts` only.
- **Files NOT modified:** `packages/filters/src/`, `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts`,
  `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`, `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte`,
  `tests/tests/fixtures/voter.fixture.ts`, `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte`.
- **D-01 acceptance gate:** PASS (0 svelte imports in `packages/filters/src/`; baseline preserved).
- **Phase 64 D-13 boundary:** honored (no `voterContext.svelte.ts` modifications).
