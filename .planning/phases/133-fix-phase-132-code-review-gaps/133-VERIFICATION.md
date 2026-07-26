---
phase: 133-fix-phase-132-code-review-gaps
verified: 2026-07-26T00:00:00Z
status: passed
score: 8/9 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:

  - truth: "A genuinely non-advancing elections/constituencies Continue button exhausts maxSteps and fails loudly at the terminal stopAt waitFor, naming the expected checkpoint (WR-01)"
    test: "Deliberately break the elections or constituencies Continue button so it never advances (e.g. stub the click handler / disable the route it targets), then run a voter journey through navigateToFirstQuestion (or a perm spec that uses it)"
    expected: "The run fails with a Playwright timeout at the terminal `answerOption.waitFor` / `questionsStart.waitFor` / `categoryStart.waitFor` (whichever `stopAt` applies), naming the expected checkpoint locator — the journey does NOT silently complete and no `page.goto()` redirect occurs"
    why_human: "No automated test in this phase (or the full 3x suite) deliberately breaks the Continue button to exercise the loud-failure path; the 3x green runs only exercised the happy path (Continue always eventually succeeds, sometimes after a transient stall-then-retry). The terminal `waitFor` block itself is pre-existing, unchanged code (not touched by this phase's diff), so this is a strong logical inference from static code reading, but grep/wiring checks cannot observe the runtime failure-path behavior — only a deliberately-broken build or a dedicated regression test can."
---

# Phase 133: Fix Phase 132 code review gaps Verification Report

**Phase Goal:** Fix the issues raised in the Phase 132 code review. For the `navigateDirectlyToQuestions` issue: remove that function completely and make `advanceVoterFlow` deterministically check for each of the possible screens instead — trial whether that causes any issues (E2E suite is the gate).
**Verified:** 2026-07-26
**Status:** human_needed
**Re-verification:** No — initial verification

## Note on Requirement IDs

WR-01, IN-01, IN-02 are code-review finding IDs originating in `133-RESEARCH.md § Phase Requirements`
(traceable verbatim to `132-REVIEW.md`), not entries in `.planning/REQUIREMENTS.md`. `REQUIREMENTS.md`
was grepped and contains no WR-01/IN-01/IN-02/"133" rows — confirmed. `ROADMAP.md`'s Phase 133 entry
lists `**Requirements**: WR-01, IN-01, IN-02` directly (not "TBD"), consistent with each plan's
frontmatter documenting the TBD-at-plan-time provenance. This is accounted for against
`133-RESEARCH.md` per the orchestrator's guidance, not flagged as a REQUIREMENTS.md gap.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `navigateDirectlyToQuestions` no longer exists anywhere in the codebase (module-private) | ✓ VERIFIED | `grep -rn "navigateDirectlyToQuestions" **/*.ts` across the repo returns 0 hits in any `.ts` source file — remaining hits are exclusively in `.planning/` historical docs (RESEARCH/PLAN/prior-phase archives), which is expected and correct. `grep -c` on `voterNavigation.ts` itself returns 0. |
| 2 | `advanceVoterFlow`'s elections and constituencies branches use bounded waits + a deterministic continue on stall (no `page.goto` bypass) | ✓ VERIFIED | Read `tests/tests/utils/voterNavigation.ts:150-224` in full. Both branches: `TIMEOUTS.slowPage` bounded visibility wait → `catch { continue; }`; `click({ timeout: 3000 })` → `catch { continue; }`; non-throwing `waitForURL(...).catch(() => null)` → `continue`. `grep -c 'page.goto' tests/tests/utils/voterNavigation.ts` → 0. |
| 3 | A genuinely non-advancing elections/constituencies Continue button exhausts `maxSteps` and fails loudly at the terminal `stopAt` `waitFor` | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code present and wired (terminal `waitFor` block at lines 232-241, unchanged from pre-phase code, is the sole path once the catch-branches no longer bypass it). No test deliberately breaks the Continue button to prove the loud-failure path actually fires — see Human Verification. |
| 4 | `resolveSeedUuids` + `uuidCache` empty-array-cache path and the degenerate `/questions?` fallback URL are gone, deleted with their only consumer (IN-02) | ✓ VERIFIED | `grep -c 'resolveSeedUuids'` and `grep -c 'uuidCache'` on `voterNavigation.ts` both → 0. Function, module var, and `SupabaseAdminClient` import all absent from the file (confirmed by direct read); `tests/tests/utils/supabaseAdminClient.ts` class file and its ~other importers untouched. |
| 5 | `candidate-journey` step 13.5 asserts the POSITIVE candidate-home destination (`/candidate`) instead of the negative-lookahead (IN-01) | ✓ VERIFIED | Read `candidate-journey.spec.ts:660-676`. Line reads `await page.waitForURL(/\/candidate\/?(?:\?|#|$)/, { timeout: TIMEOUTS.slowPage });`. `grep -c 'candidate(?!' candidate-journey.spec.ts` → 0 (negative-lookahead fully gone). |
| 6 | A post-submit misroute now fails fast at the `waitForURL` and names the true destination, rather than being masked until the downstream `statusMessage` check | ✓ VERIFIED | Static regex-boundary analysis (deterministic, not runtime-dependent): `/\/candidate\/?(?:\?|#|$)/` matches `/candidate`, `/candidate/`, `/candidate?…`, `/candidate#…` (tolerating an optional locale prefix via the un-anchored-at-start pattern) but requires `?`/`#`/end-of-string immediately after an optional slash, so it structurally cannot match `/candidate/profile`, `/candidate/questions`, `/candidate/login`, or any other sub-route. Destination confirmed against source: `profile/+page.svelte`'s field-cleared submit path resolves `getRoute.current('CandAppHome')` → `route.ts: CandAppHome: CANDIDATE = '/candidate'`. |
| 7 | The full E2E suite (`yarn test:e2e`) passes with 0 failed and 0 did-not-run, three consecutive times | ✓ VERIFIED | Per orchestrator-supplied facts (independently decoded from each run's preserved HTML `report.json`, not console-tail-only): run1/run2/run3 each `{"total":129,"expected":129,"unexpected":0,"flaky":0,"skipped":0,"ok":true}`. `total==expected` with `skipped:0` establishes 0 did-not-run. |
| 8 | Removing the hard-nav fallback did NOT reintroduce the elections/constituencies continue-stall flake | ✓ VERIFIED | 3x clean full-suite runs (above) plus the four perm-spec consumers of `navigateToFirstQuestion` (`perm-hide-election-tags`, `perm-hide-category-tags`, `perm-hide-if-missing-answers`, `perm-disable-allow-open`) each passing in all 3 runs, per 133-03-SUMMARY.md's per-project decoded tallies. |
| 9 | The candidate-journey positive-home assertion (IN-01) passes end-to-end inside the suite | ✓ VERIFIED | `candidate-journey` project 1/1 passing in all three runs, per 133-03-SUMMARY.md. |

**Score:** 8/9 truths verified (1 present + wired, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/utils/voterNavigation.ts` | Rewritten: dead code removed, four hard-nav catch branches replaced with deterministic continue | ✓ VERIFIED | Full-file read confirms structure matches plan spec exactly; sole export `navigateToFirstQuestion` unchanged (`grep -c '^export '` → 1). |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` | Line ~671 URL settle uses a positive candidate-home regex | ✓ VERIFIED | Confirmed at the exact line; comment reworded accordingly; step 14's `toHaveURL(/\/candidate\/profile/)` untouched. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `advanceVoterFlow` top-of-loop `anyCheckpoint.waitFor` | terminal `stopAt` `waitFor` (loop exhaustion) | Self-healing re-detection each cycle; loud failure on exhaustion | ✓ WIRED (structurally) | Both blocks read directly; the `continue` in every catch branch routes back to the top-of-loop probe, and loop exhaustion falls through to the terminal `waitFor`. Runtime firing of the terminal path specifically is the item flagged in Human Verification (Truth 3). |
| `navigateToFirstQuestion` (sole export) | perm-spec consumers | Direct import | ✓ WIRED | `grep -rn "navigateToFirstQuestion"` confirms imports in `perm-hide-election-tags.spec.ts`, `perm-hide-category-tags.spec.ts`, and `minimalVoterResultsPage.fixture.ts`; `perm-hide-if-missing-answers.spec.ts` and `perm-disable-allow-open.spec.ts` consume it transitively via the fixture. |
| candidate-journey positive settle | `candidate-journey` project run | Behavioral (suite execution) | ✓ WIRED | 1/1 pass in all 3 runs per 133-03-SUMMARY.md. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) in either changed file | `grep -n -E "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER" tests/tests/utils/voterNavigation.ts tests/tests/specs/candidate/candidate-journey.spec.ts` | no matches (exit 1) | ✓ PASS |
| `yarn lint:check` (full workspace, run once) | `yarn lint:check` | exit 0 — 0 errors; only pre-existing warnings in unrelated files (`dev-seed` generators, `candidateContext.svelte.test.ts`, `candidate-bank-auth-journey.spec.ts`, `mockOidcIssuerEntry.ts`) | ✓ PASS |
| Working tree clean apart from pre-existing unrelated file | `git status --short` | only `M supabase/.temp/cli-latest` (pre-existing, unrelated) | ✓ PASS |
| Full E2E suite 3x determinism gate | `yarn test:e2e` ×3 (independently decoded by orchestrator from preserved reports) | 129/129, 0 unexpected, 0 flaky, 0 skipped — all 3 runs | ✓ PASS (per orchestrator-supplied evidence, spot-checked against SUMMARY per-project tallies) |
| Probe: no runnable single-command deterministic-loop-exhaustion check exists | — | — | ? SKIP (routed to Human Verification, Truth 3) |

### Anti-Patterns Found

None. Both changed files were scanned for debt markers, empty implementations, and hardcoded stub values — clean.

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|----------|
| WR-01 | 133-RESEARCH.md (from `132-REVIEW.md`) | Remove hard-nav fallback; deterministic screen checks in `advanceVoterFlow` | ✓ SATISFIED (with 1 behavior-unverified sub-claim) | Truths 1, 2, 3, 7, 8 above |
| IN-01 | 133-RESEARCH.md (from `132-REVIEW.md`) | Positively assert candidate-home destination | ✓ SATISFIED | Truths 5, 6, 9 above |
| IN-02 | 133-RESEARCH.md (from `132-REVIEW.md`) | `resolveSeedUuids` empty-array caching + degenerate `/questions?` URL resolved by deletion | ✓ SATISFIED | Truth 4 above |

No orphaned requirements — `.planning/REQUIREMENTS.md` was grepped and has no Phase-133-mapped IDs to cross-check against (confirmed empty result), consistent with the roadmap-level requirement IDs being code-review finding IDs rather than REQUIREMENTS.md entries.

### Deferred Items (informational — not a phase gap)

**DEF-133-01** — Latent intermittent flake in `tests/tests/utils/voterIntro.ts:28` (`bypassIntroThen` intro-CTA click, 2s stability budget), observed 1/9 full-suite runs across this code state. Logged in `deferred-items.md`, not fixed.

Independently re-verified as out of this phase's scope: `perm-2e-asymmetric.spec.ts` (the spec that hit the flake) imports exclusively from `../../utils/voterIntro` — `grep -n "voterNavigation\|voterIntro"` on the spec confirms zero references to `voterNavigation`. The Phase 133 diff touches exactly `tests/tests/utils/voterNavigation.ts` and `tests/tests/specs/candidate/candidate-journey.spec.ts`; `voterIntro.ts` is untouched by this phase. The deferral is accepted — it does not bear on whether this phase's goal (removing the hard-nav fallback without regression) was achieved, and the phase's own 3x gate ran cardinal-clean (0/129 failures × 3).

## Human Verification Required

### 1. Loud-failure path on a genuinely broken Continue button

**Test:** Deliberately break the elections or constituencies "Continue" button (e.g., stub its click handler to a no-op, or point it at a route that never resolves) in a throwaway local branch, then run a voter journey through `navigateToFirstQuestion` (or any perm spec that consumes it, e.g. `perm-hide-election-tags`).

**Expected:** The run fails with a Playwright timeout at the terminal `answerOption.waitFor` / `questionsStart.waitFor` / `categoryStart.waitFor` (whichever `stopAt` value applies), naming the expected checkpoint locator in the error. The journey must NOT silently complete, and no `page.goto()` redirect must occur.

**Why human:** This is the specific behavior WR-01 exists to restore (a broken Continue button must fail loudly, not be bypassed), but no automated test in this phase — including the 3x full-suite gate — deliberately breaks the Continue button to exercise this exact failure path; the 3x runs only exercised the happy path. The terminal `waitFor` block that would fire is pre-existing, unchanged code (not part of this phase's diff), which makes this a strong logical inference from static reading, but grep/wiring checks cannot observe a runtime failure-path outcome — only a deliberately-broken build or a dedicated regression test can confirm it fires as intended.

### Gaps Summary

No must-have truth FAILED. One must-have truth (the terminal loud-failure path on a genuinely stuck Continue button — the core anti-regression property WR-01 is meant to restore) is present in code and structurally wired, but was not exercised by any behavioral test in this phase, including the 3x full-suite gate (which only proves the happy path stayed green). This routes the phase to `human_needed` rather than `passed` per the verification framework's rule that behavior-dependent truths require behavioral evidence, not just presence/wiring, to be marked VERIFIED.

This is a genuinely minor gap in practice: the terminal `waitFor` mechanism is pre-existing code untouched by this phase's diff, and the phase's core deliverable — removing the `page.goto()` bypass so that mechanism becomes reachable again — is fully and independently verified (Truth 2, `grep -c 'page.goto'` → 0). No further code changes are indicated; this is a request for a human (or a future dedicated regression test) to confirm the failure path fires as designed, not evidence of a defect.

---

_Verified: 2026-07-26_
_Verifier: Claude (gsd-verifier)_
