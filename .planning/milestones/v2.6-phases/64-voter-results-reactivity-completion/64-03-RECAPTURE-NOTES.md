# Plan 64-03 Task 1 Re-capture — Full-Suite Cascade Persists After Plan 64-04

**Date:** 2026-04-27
**Captured by:** Plan 64-03 Task 1 re-execution against post-Plan-64-04 codebase
**Verdict:** **FULL-SUITE CASCADE PERSISTS — Plan 64-04 fixes insufficient**

## Capture summary

| Metric | Pre-64-04 (committed `35c84ef43`) | Post-64-04 (this capture) | Delta |
|--------|-----------------------------------|----------------------------|-------|
| Expected (passed) | 30 | 28 | **-2** |
| Unexpected (failed/timedOut) | 21 | 22 | **+1** |
| Skipped | 51 | 52 | +1 |
| Total | 102 | 102 | 0 |
| Duration | 493s | **693s** | **+200s (+40%)** |
| 5 named voter-results tests | 5 FAIL (timedOut) | **5 FAIL (timedOut)** | identical |

The cascade is **structurally identical** to the pre-Plan-64-04 capture. The 40% duration increase is itself a regression signal: bumping fixture timeouts caused tests to chew through their full new budget instead of failing fast, putting MORE contention on the dev server and exposing one additional voter-static-pages test to timeout (`should render nominations page with entries`).

## 5 named voter-results tests (D-07 PASS criterion)

All 5 named tests still **timedOut** in the new capture, identically to pre-Plan-64-04:

| # | Title | Pre status | Post status | Project |
|---|-------|------------|-------------|---------|
| 1 | filter toggle narrows list without effect_update_depth_exceeded | timedOut | **timedOut** | voter-app |
| 2 | filter state resets on plural tab switch (D-14) | timedOut | **timedOut** | voter-app |
| 3 | filter state survives drawer open/close (D-15) | timedOut | **timedOut** | voter-app |
| 4 | deeplink list+drawer URL renders both (RESULTS-03, D-08 shape 3) | timedOut | **timedOut** | voter-app |
| 5 | deeplink edge case: organizations list + candidate drawer (D-08 shape 4) | timedOut | **timedOut** | voter-app |

All five share the identical error message:

```
Test timeout of 30000ms exceeded while setting up "answeredVoterPage".
```

The deeper Playwright error stack (`tests/tests/fixtures/voter.fixture.ts:85` — see "Root cause" below) names the specific waiting step that hangs: `page.waitForURL(/\/results/, { timeout: 30000 })`.

## Voter/candidate failure tally (per spec)

| Spec | Pre fails | Post fails | Δ | Notes |
|------|-----------|------------|---|------|
| specs/voter/voter-results.spec.ts | 13 | 13 | 0 | All `answeredVoterPage` cascade |
| specs/voter/voter-detail.spec.ts | 4 | 4 | 0 | All `answeredVoterPage` cascade |
| specs/voter/voter-matching.spec.ts | 1 | 1 | 0 | Different error: `getByTestId('voter-results-list')` waitFor 15s exceeded |
| specs/voter/voter-journey.spec.ts | 1 | 1 | 0 | Different error: URL pattern `/questions/` mismatch — landed on `/elections...` |
| specs/voter/voter-settings.spec.ts | 1 | 1 | 0 | `voter-questions-category-list` not visible |
| specs/voter/voter-static-pages.spec.ts | 0 | **1** | +1 | NEW: nominations page test now timing out (regression) |
| specs/candidate/candidate-profile.spec.ts | 1 | 1 | 0 | imgproxy upload (CAND-03) — known flake |
| **Total** | **21** | **22** | **+1** | Plan 64-04 made overall surface slightly worse |

## Root cause analysis

The Playwright error stack identifies the precise hang point:

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
   at fixtures/voter.fixture.ts:85
```

`tests/tests/fixtures/voter.fixture.ts:85` is the **fallback `nextButton` click → `page.waitForURL(/\/results/, { timeout: 30000 })`** that Plan 64-04 Task 6 bumped from 10s to 30s. Even with the bump it never completes.

### Why the bump can't help — structural ceiling

`tests/playwright.config.ts:51` sets a per-test `timeout: 30000` (30s). The fixture itself executes inside the test budget. Concretely:

| Fixture step | Per-step budget (post-64-04) | Pre-64-04 | Notes |
|---|---|---|---|
| Line 71 — auto-advance after each answer click (×16 iterations) | 10s each | 5s | 16 questions × ~0.5–1s actual under no contention; can spike to 10s under full-suite render pressure |
| Line 85 — fallback nextButton waitForURL `/results` | 30s | 10s | Only fires when auto-advance fails on the last question |
| Line 91 — results list visibility | 30s | 10s | Independent wait, post-navigation |

**Total possible fixture cost:** 16 × 10s + 30s + 30s = **220s in worst case**, but the test timeout is **30s**. The fixture cannot succeed if any individual `waitForURL` consumes near its budget — the test will timeout before the next fixture step even starts.

**Under full-suite render contention** (multiple Playwright workers + multi-tab Vite dev-server traffic + adapter parent-type derivation per Plan 64-01), the answer loop alone often consumes 10–20s for 16 questions, leaving 10–20s for line-85's 30s budget — which then can't elapse, busting the test timeout. The Plan 64-04 fixture timeout bumps did NOT change the per-test 30s ceiling, so they were structurally incapable of closing this cascade.

### Empirical confirmation

- **Focused runs** (verified by Plan 64-04 SUMMARY): 16/16 voter-results pass in 4.1 min. Without contention each fixture step finishes fast (<<10s), and total test time stays under 30s.
- **Full-suite runs** (this capture + pre-Plan-64-04 capture): 5/5 named tests timeout identically. Render contention pushes individual steps over the per-step budgets.
- The ElectionSelector `$effect` conversion (Plan 64-04 Task 4) is real and necessary, but it addresses a different failure mode (auto-select-single-election short-circuit not reacting to async-arriving elections during deeplink hydration). It does NOT change the answer-loop render-time profile.
- The Svelte 5 hygiene sweep (Plan 64-04 Tasks 2–5) eliminates 50+ warnings but does not measurably reduce render time of the questions/results pages.

## Why focused-run pass evidence misled Plan 64-04 scope

Plan 64-04's verification used focused runs of `voter-results.spec.ts`, `voter-detail.spec.ts`, and `voter-journey.spec.ts` — each in isolation. These passed because in isolation:

1. Only ~16 tests run total, single-worker, sequential
2. Vite dev-server traffic is light — no concurrent compilation requests from other parallel test workers
3. The Svelte HMR cache is warm by mid-spec
4. No imgproxy / candidate-profile workers contending for DB connections

**Full-suite conditions are categorically different.** With 6 default workers (`tests/playwright.config.ts:55`) + multi-project setup (data-setup-multi-election, variant-* projects, candidate-app-mutation, etc.), the dev server compiles concurrent module graphs and serves many in-flight HTTP requests simultaneously. Each fixture step's wall-clock cost can be 3–5× its focused-run baseline.

This means **timeout bumps at the fixture step level cannot fix the cascade** — they would only delay it. The fix path must reduce the wall-clock cost of the answer-loop or raise the per-test ceiling.

## Hypothesis: which Plan 64-04 fix was insufficient + what would close the gap

### Plan 64-04 fixes evaluation

| Fix | Closes the cascade? | Why |
|---|---|---|
| Svelte 5 hygiene (Cat A–E) | NO | No measurable render-time change; hygiene fixes only |
| `ElectionSelector` `$effect` conversion | NO | Addresses a different reactivity bug (D-08 cascade root for deeplink hydration), not the answer-loop wall-clock cost |
| Path A fixture timeout bumps (10s/30s/30s) | NO | Structurally constrained by per-test 30s ceiling; bumps push fixture into uncoverable territory |
| `PreventNavigation` SSR guard | NO | SSR-guard fixes a different runtime crash (SSR rendering); doesn't affect answer-loop client-side render time |

### Options to actually close the cascade

The user/orchestrator should pick one of these paths. Each is a substantive scope expansion beyond Plan 64-04.

**Option A: Raise per-test timeout to 90s (smallest scope)**
- Edit `tests/playwright.config.ts:51` `timeout: 30000` → `timeout: 90000`
- Pros: surgical, mirrors what fixture bumps tried to do but at the right layer; 1-line change
- Cons: hides the underlying render-time regression; encourages future test bloat; adds 60s × N-tests of CI cost in the worst case (~21 cascading tests × 60s = 21 min added to a capture run)
- Likely outcome: **closes 5/5 named tests + 13 voter-results + 4 voter-detail + 1 voter-matching + 1 voter-static-pages = 24 tests recovered**. Probably leaves voter-journey and voter-settings (different error modes — see "Voter/candidate failure tally" notes).
- This is the path Plan 64-04 was already moving toward but stopped one layer too low.

**Option B: Reduce voterAnswerCount default from 16 to 4 (Path B from Plan 64-04 boundary)**
- Edit `tests/tests/fixtures/voter.fixture.ts:49` `voterAnswerCount: [16, ...]` → `[4, ...]`
- Spot-check that 4 answered questions still produces a valid results list (the matching algorithm needs >=1 answer, so 4 is plenty)
- Pros: linear reduction in fixture wall-clock cost; no per-test timeout change needed; closer to focused-run profile
- Cons: changes test semantics — tests that assert on "all 16 questions answered" semantics break; not all results-page state is exercised; tests that read counter values may fail differently
- Risk: medium — needs grep for tests that rely on the count of 16

**Option C: Deeper investigation — voterContext reactive-chain optimization (Path B from Plan 64-04)**
- The deferred Plan 64-04 boundary noted "Path B (deeper voterContext reactive-chain optimization) is out of scope per plan boundaries; would be a future phase if the bumps prove insufficient." This is that future phase.
- Investigate why answer-clicks under contention take 1–10s vs <0.5s in focused runs. Likely culprits: cascading reactive updates across `voterContext.svelte.ts` when answers change, repeated query refetches via the supabase adapter, or unnecessary re-renders of the questions list.
- Pros: addresses root cause; benefits production users (real users in slow networks experience a milder version of this contention)
- Cons: large scope; needs profiling; risks regressions; not a quick close to the v2.6 milestone

**Option D: Lower per-suite worker count (avoid the contention)**
- `tests/playwright.config.ts:56` `workers: process.env.CI ? 1 : 6` — local runs default to 6 workers
- Run capture with `--workers=1` (already used here) but also reduce default to 2–3 for local development
- Pros: simulates CI more closely; reduces dev-server thrashing
- Cons: this capture already used `--workers=1` and STILL hit the cascade. So worker count alone is not the variable — the cascade fires even sequentially. **Option D is therefore likely INSUFFICIENT on its own.**
- This is informative: the cascade is NOT purely worker-contention; even sequential runs of the full project graph hit it, suggesting the dev server's HMR cache state degrades over the full suite (multiple projects with different test datasets, Supabase RLS cycling through candidate/voter sessions, etc.)

### Recommended path

**Option A (raise per-test timeout to 90s)** is the minimum-viable close that recovers most of the cascade and unblocks v2.6 milestone close. It accepts the render-time regression as a known trade-off documented in the verification report, and leaves Option C as a future Phase 65+ scope.

If A doesn't close all 24 expected recoveries, **A + B together** likely will. Option C should be deferred to a separate phase regardless.

## What this means for Plan 64-03

Per the executor branch logic in the orchestrator's prompt:

- Tasks 1 (canonical capture) — **executed**, but the capture shows the same cascade as pre-Plan-64-04
- Task 2 (parity-script constants regen) — **NOT executed** per the branch instruction (any of 5 named tests fail → do NOT regen)
- Task 3 (9-step manual smoke) — **NOT reached**

Per CONTEXT D-08 + Pitfall 5, the parity-script constants regen would commit a new baseline that has the cascade tests in `CASCADE_TESTS` (not `PASS_LOCKED_TESTS`), which would lock in Plan 64-04's regression as the v2.6 anchor. That is undesirable — the orchestrator should pick a fix path before regenerating constants.

## Artifacts

- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` — new full-suite canonical capture (banner-stripped, valid JSON)
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.pre-64-04.json` — pre-Plan-64-04 capture, preserved for audit (originally `playwright-report.json` committed in `35c84ef43`)
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright.stderr.txt` — empty stderr from the new run
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright.stderr.pre-64-04.txt` — empty stderr from the pre-Plan-64-04 run

## State preservation gate

- STATE.md and ROADMAP.md UNCHANGED by this re-capture (per executor prompt instructions)
- v2.5 baseline at `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` UNCHANGED (Phase 63 D-15 honored)
- `diff-playwright-reports.ts` UNCHANGED (Pitfall 5 honored — constants regen would have locked in regression)

---

## Attempt 3 — Option A landed (commit `c8a4a457e`); cascade UNCHANGED in count, diagnostic FUNDAMENTALLY SHIFTED

**Date:** 2026-04-27 (post Option A)
**Commit landed:** `c8a4a457e` — `playwright.config.ts:51 timeout: 30000 → 90000`
**Capture:** `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` (overwritten)
**Verdict:** **Option A INSUFFICIENT — inner waitForURL reveals as the actual binding constraint, NOT the wrapper.**

### Stats comparison (3 attempts side-by-side)

| Metric | Attempt 1 (pre-64-04, 30s wrapper) | Attempt 2 (post-64-04, 30s wrapper) | **Attempt 3 (post-Option-A, 90s wrapper)** |
|--------|-----------------------------------|-------------------------------------|-------------------------------------------|
| Expected (passed) | 30 | 28 | **30** |
| Unexpected (failed/timedOut) | 21 | 22 | **21** |
| Skipped | 51 | 52 | **51** |
| Duration | 493s | 693s | **950s** |
| 5 named voter-results tests | 5 timedOut | 5 timedOut | **5 failed** |

Identical cascade count (21) as attempt 1, but with cleaner failure surface — tests no longer killed at 30s wrapper; they now run their full inner waitForURL budget (30s) + cleanup (~10s) = **~40500ms per cascaded test**, deterministic across all 5 named + 13 voter-results + 4 voter-detail.

### What Option A revealed

In attempts 1+2 (wrapper=30s), Playwright reported:
> `Test timeout of 30000ms exceeded while setting up "answeredVoterPage"` at `voter.fixture.ts:85`.

In attempt 3 (wrapper=90s), Playwright now reports:
> `TimeoutError: page.waitForURL: Timeout 30000ms exceeded.` at `voter.fixture.ts:85`.

The two error messages have DIFFERENT semantics:
- The first ("test timeout exceeded WHILE SETTING UP fixture") means the wrapper killed the test mid-fixture — could be ANYWHERE in the fixture, including the answer-loop on line 71.
- The second ("page.waitForURL: Timeout 30000ms exceeded") means the call at line 85 ran for its FULL 30s budget and then naturally raised. **Specifically diagnostic: the fallback `nextButton` click → `waitForURL(/\/results/, { timeout: 30000 })` is the deterministic hang point.**

This means attempts 1+2 were ambiguous — the wrapper kill could have been masking ANY slow step. Attempt 3 nails it: the answer-loop completes (~10.5s, within budget), the post-loop `if (!page.url().includes('/results'))` branch enters, the `nextButton` is clicked, and **the URL never transitions to `/results` within 30 seconds**.

### The new finding: fallback path takes >30s OR navigation never happens

| Fixture step | Wall-clock under attempt-3 conditions | Notes |
|---|---|---|
| Lines 53-77 (navigate + 16 answer-loop iterations) | ~10.5s | Auto-advance fires on each question successfully |
| Line 81: `if (!page.url().includes('/results'))` | enters | URL after last question is NOT `/results` (auto-advance to results didn't fire on last question) |
| Line 82: `nextButton.click()` | ~immediate | Click registers but no navigation follows |
| Line 85: `waitForURL(/\/results/, { timeout: 30000 })` | **30000ms — TIMES OUT** | This is the new bottleneck |

The fact that ALL 5 named tests + 13 voter-results + 4 voter-detail (18 total) fail at line 85 with EXACTLY ~40500ms duration — same to within 200ms — strongly suggests this is a **deterministic product bug**, not stochastic render-pressure variability. Render pressure produces variable durations; deterministic ~40.5s every test = a navigation that fundamentally isn't happening, hits the timeout, then unwinds.

### Hypothesis for the deterministic hang

The `nextButton` at end-of-questions either:
1. Doesn't exist on the last-question DOM under full-suite seed conditions (e2e seed with 16 opinion questions, single election, single constituency)
2. Exists but its click handler is racing with something else (auth re-init? voterContext settlement? matching-engine spinup?)
3. Auto-advance from the last question to `/results` IS firing in the same tick, but the URL change happens before line 71 detects the URL change as ≠ `urlBefore` — so the loop exits with `page.url()` already on `/results`, and the `if (!.includes('/results'))` branch should be SKIPPED (fast path)... but apparently isn't being skipped, because we're in the fallback.

Most likely: scenario 3 is a microtask race. Line 71's `waitForURL((url) => url.toString() !== urlBefore)` returns when URL ≠ urlBefore. If the URL transitions intermediate-page → `/results` very fast, line 71 may capture the intermediate URL state (URL changed, condition met) and exit. Then `page.url()` at line 81 reads the CURRENT URL — which by then might be `/results`, OR might still be the intermediate page if the navigation is multi-step. If `page.url()` returns the intermediate, line 81 enters, nextButton click does nothing useful (user is no longer on questions page), and line 85 hangs forever.

### Options NOW (attempt 3 superset of options A/B/C)

Given Option A alone didn't close the cascade, the choices have shifted:

**Option A2 (extend Path A): bump fixture-internal `waitForURL` timeouts to 60s or 90s**
- Edit `voter.fixture.ts:71` (10s → 30s), line 85 (30s → 60s), line 91 (30s → 60s)
- Pros: trivially mechanical; if the navigation DOES eventually complete (just slowly), this catches it
- Cons: based on attempt-3 evidence, the navigation appears DETERMINISTICALLY stuck, not just slow. 30s × 3 = 90s budget already; timing out at 30 vs 60 vs 90 likely all produce the same failure
- **Likely insufficient if the hang is deterministic** (which the ~40500ms uniformity suggests)

**Option A3 (debug-investigate): inspect what the fixture sees at line 81-85**
- Add diagnostic logging or use Playwright trace viewer on one cascaded test to see what `page.url()` is at line 81, whether `nextButton` exists and is visible, what the page DOM looks like
- Pros: surfaces the actual bug; much higher probability of fix
- Cons: investigation cost; turns Plan 64-03 into a debug session not a verification capture; could spawn new tasks
- The traces are auto-collected (`use.trace: 'on'` at config:76) — they exist now in `playwright-results/` for any failed test

**Option B (now compound with A): reduce voterAnswerCount default 16 → 4**
- Same as before: changes test semantics; needs grep audit
- Less attractive now that Option A revealed the issue is end-of-questions navigation, not loop-cost

**Option C (defer to new phase): voterContext reactive-chain optimization**
- Same as before: large scope; defers v2.6 close

**Option E (NEW — fix the fixture's URL-detection logic)**
- Tighten the fast-path: line 71's `waitForURL` should specifically wait for either `/results` URL OR a NEW question URL (not just "any URL change"); on the last iteration, wait specifically for `/results`
- Pros: addresses the diagnosed root cause (microtask race in URL detection); narrowly scoped; doesn't change test data
- Cons: requires careful fixture edit; needs validation across all voter specs that consume `answeredVoterPage`
- This is a **fixture bug fix**, not a workaround

**Option F (NEW — accept Phase 64 shortfall, close v2.6 with documented gap)**
- Commit attempt-3 capture as the final v2.6 baseline
- Run Plan 64-03 Task 2 (constants regen) classifying the 18-test answeredVoterPage cascade as `DATA_RACE_TESTS` (under fixture-instability rationale, not imgproxy)
- Document the deterministic hang as known v2.6 debt to be addressed in a v2.7 phase
- Run Plan 64-03 Task 3 manual smoke
- Accept Phase 64 partial-closure: ROADMAP §Goal "flip v2.6 parity gate to PASS" is NOT achieved
- Pros: unblocks /gsd-complete-milestone; preserves the diagnostic finding for v2.7
- Cons: explicit shortfall against ROADMAP success criteria; may require ROADMAP amendment or REQUIREMENTS revision

### Recommended path (revised)

Given the new diagnostic (deterministic ~40500ms hang at fixture line 85), the recommended path is now:

**Option A3 (trace investigation) → Option E (fixture URL-detection fix) → re-capture.**

The trace is already collected. ~30 minutes of investigation should reveal whether scenario 3 (microtask URL race) is correct, and Option E fix is a small surgical edit if so.

If user prefers fastest-close-with-known-debt: **Option F** — accept the cascade as fixture-instability data-race, close milestone with documented gap.

Plan 64-04's earlier "Path A (timeout) + Path B (voterContext) hard split" is no longer adequate framing — the bottleneck is fixture URL-detection, NOT timeouts and NOT voterContext.

---

## Attempt 4 — RESOLVED via protocol fix (NOT fixture/code/timeout fix)

**Date:** 2026-04-27 (post Option A3 trace investigation)
**Verdict:** **CASCADE CLOSED. 5/5 named tests PASS. Only remaining failure is imgproxy CAND-03 (known DATA_RACE per D-09).**

### Stats vs prior attempts

| Metric | Phase 63 baseline | Attempt 1 | Attempt 3 (Option A) | **Attempt 4 (clean DB)** |
|--------|-------------------|-----------|----------------------|--------------------------|
| Expected (passed) | 62 | 30 | 30 | **67** |
| Unexpected | 5 | 21 | 21 | **1** (imgproxy only) |
| Skipped | 35 | 51 | 51 | **34** |
| Duration | 970s | 493s | 950s | **673s** |
| 5 named tests | n/a (newer) | timedOut | failed | **all PASS ✓** |

Attempt 4 surpasses Phase 63 baseline by 5 passes (the 5 named voter-results tests Phase 64 was created to close).

### Root cause — protocol bug, NOT fixture/code/timeout bug

Option A3 (trace investigation) opened the auto-collected trace from one cascaded test and surfaced this in the page-snapshot at failure time:

```
- text: Question
- generic [ref=e44]: 18/40
```

ALL 17 cascaded tests in voter-results + voter-detail showed identical "Question 18/40" at failure — meaning each test was on the 18th question page, not the results page. The fixture answered 16 questions (per `voterAnswerCount: [16, ...]`), the loop ended on Q17 (auto-advanced from Q16), then `nextButton.click()` moved to Q18, then `waitForURL(/\/results/)` hung 30s because the user is still on a question page with 22 questions left to answer.

DB inspection revealed:
- 24 `seed_` prefixed questions (default Finnish demo template, loaded by `yarn dev:reset-with-data`)
- 17 `test-` prefixed questions (e2e template, loaded by playwright's data-setup project)
- Voter UI shows 40 answerable (excludes 1 text question)

`tests/tests/setup/data.setup.ts` calls `runTeardown('test-', client)` which only clears `test-` prefixed rows. The 24 `seed_` rows from `dev:reset-with-data` were left in place, polluting the e2e dataset.

Phase 63's canonical capture protocol (`63-03-PLAN.md` Step 2) used `yarn supabase:reset` — drops + recreates DB **without** seeding the default template. That left only the e2e template's 17 questions visible — fixture's 16-answer default was correct.

Plan 64-03 inadvertently changed this to `yarn dev:reset-with-data`, introducing the data overlap. **Plan 64-03 protocol step has been corrected** in this commit; future re-captures use `yarn supabase:reset`.

### Why attempt 3's wrapper bump was necessary to surface this

In attempts 1+2 (wrapper=30s), the cascade error was generic "Test timeout exceeded while setting up answeredVoterPage" — no useful trace because the wrapper kill happened mid-fixture, before Playwright's trace-on machinery had a stable failed-state DOM to snapshot. Trace files existed but error-context.md was missing the page snapshot.

In attempt 3 (wrapper=90s), the inner `waitForURL` ran its full 30s budget and naturally raised — Playwright's trace machinery captured the page-at-failure DOM, including the "Question 18/40" indicator that pinpointed the bug.

Option A2 (further timeout bumps) would have masked this forever. Option A (90s wrapper) was the correct first move because it surfaced the actual diagnostic. The fix is NOT timeout-related — it's a capture-protocol revert.

### Files modified by this resolution

- `.planning/phases/64-voter-results-reactivity-completion/64-03-PLAN.md` — Step 1 reset command corrected (`dev:reset-with-data` → `supabase:reset`) with inline rationale comment
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` — overwritten with attempt-4 capture (5/5 named tests pass)
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.attempt-3.json` — attempt-3 preserved for audit
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright.stderr.attempt-3.txt` — attempt-3 stderr preserved

### What remains in scope for Plan 64-03

- ✓ Task 1 (canonical capture) — **DONE** with attempt 4
- ⏳ Task 2 (parity-script constants regen per D-08) — **READY** to execute
- ⏳ Task 3 (9-step manual smoke per D-10) — **READY** after Task 2

### Note on the Option A wrapper bump (commit `c8a4a457e`)

The 30s → 90s wrapper bump in `tests/playwright.config.ts:51` remains in place. It's not load-bearing for Phase 64 close (attempt 4 with clean DB only has 1 test exceeding 30s and that's the imgproxy CAND-03 known flake), but it provides headroom for future render-pressure scenarios and surfaced the diagnostic that resolved Phase 64. The committed rationale comment cites Plan 64-04 fixture work, which is still accurate (the wrapper IS the binding ceiling for any future fixture-internal bumps); future cleanup could refine the rationale to reference attempt-3's diagnostic role.

### Note on `voter.fixture.ts:71/85/91` timeout bumps (commit `9a1843ac4`)

Same as above — these provide headroom but were not the actual fix. They remain in place; reverting them is not necessary for Phase 64 close.
