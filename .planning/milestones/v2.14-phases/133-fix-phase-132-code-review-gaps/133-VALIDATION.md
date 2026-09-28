---
phase: 133
slug: fix-phase-132-code-review-gaps
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-24
validated: 2026-07-26
---

# Phase 133 — Validation Strategy (retroactive audit)

> Per-phase validation contract for feedback sampling during execution. This phase's diff is
> **test infrastructure itself** (two Playwright test files, 56 insertions / 92 deletions, zero
> product code) — the appropriate validation signal is behavioral execution of the test suite,
> not new unit tests wrapping the tests.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=<affected-project> --no-deps` (targeted re-run of a single perm/journey spec) |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~3 min per full-suite run (129 tests) |

---

## Sampling Rate

- **After every task commit:** Targeted single-project Playwright re-run of the perm spec(s) consuming the changed helper.
- **After every plan wave:** Full E2E suite (`yarn test:e2e`).
- **Before `/gsd-verify-work`:** Full suite green — required 3x consecutively (this phase's explicit gate, Plan 133-03).
- **Max feedback latency:** ~3 min (one full-suite run).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 133-01 | 01 | 1 (tracer) | WR-01 / IN-02 | — | `advanceVoterFlow` fails loudly (no `page.goto()` bypass) when Continue never advances; dead `resolveSeedUuids`/`uuidCache`/`navigateDirectlyToQuestions` removed | E2E (behavioral, deliberately-broken-build experiment) + full-suite regression | `yarn test:e2e` (3x) + one-off broken-build experiment against `perm-hide-election-tags` | ✅ | ✅ green |
| 133-02 | 02 | 2 | IN-01 | — | `candidate-journey` step 13.5 asserts positive `/candidate` regex, not negative lookahead | E2E (full-suite regression) | `yarn test:e2e` (3x) | ✅ | ✅ green |
| 133-03 | 03 | 3 | WR-01 / IN-01 / IN-02 (aggregate) | — | Full suite green 3x consecutive, 0 unexpected / 0 flaky / 0 skipped | E2E (determinism gate) | `yarn test:e2e` ×3 | ✅ (no new file — gate only) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — Playwright + the existing `tests/tests/utils/voterNavigation.ts` and `candidate-journey.spec.ts` files are both test code and the object under change. No new fixtures or framework installs were needed.

The wave-1 tracer (Plan 133-01, WR-01/IN-02) was the risk-bearing change (behavioral rewrite of the shared navigation helper consumed by 5 specs); its outcome gates the rest. **Tracer outcome: PASS.**
- Structural: 3x full-suite green (129/129, 0 unexpected/flaky/skipped each run) with the tracer's rewritten `advanceVoterFlow` live.
- Behavioral: a deliberately-broken-build experiment (133-UAT.md, test 1) proved the specific invariant WR-01 exists to restore — a no-op'd Continue button now fails loudly at the terminal `stopAt` `waitFor` (`voterNavigation.ts:236`), naming the expected checkpoint locator, with no `page.goto()` rescue. This closed the one gap `133-VERIFICATION.md` flagged as `human_needed` (truth 3, "present but behavior-unverified").

---

## Manual-Only Verifications

All phase behaviors have automated or executed-experiment verification. One item required a human-executed one-off experiment rather than a durable automated test (see below) — it has been run and recorded, not left as an open manual gap.

| Behavior | Requirement | Why Manual (one-off, already executed) | Test Instructions / Evidence |
|----------|-------------|------------------------------------------|-------------------------------|
| Terminal `stopAt` loud-failure path fires when Continue genuinely never advances | WR-01 | The 3x full-suite gate only exercises the happy path (Continue always eventually succeeds). Proving the failure path requires deliberately breaking product code, which is not a durable regression test to keep in the suite (would require permanently sabotaging `elections/+page.svelte`). Executed once as a throwaway experiment, reverted immediately after. | Recorded in `133-UAT.md` test 1: no-op'd `onclick={handleSubmit}` in `apps/frontend/src/routes/(voters)/elections/+page.svelte:123`, ran `yarn test:e2e --project=perm-hide-election-tags --no-deps`, observed failure at `voterNavigation.ts:236` naming `question-choice`, 54.4s, no `page.goto()` rescue. Reverted; `git status` confirmed clean. |

---

## Validation Sign-Off

- [x] All tasks have automated verify (3x full-suite gate) or a recorded executed-experiment (WR-01 loud-failure invariant)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — full suite ran after every wave
- [x] Wave 0 covers all MISSING references — none; tracer (wave 1) risk was closed by the 3x gate + UAT experiment
- [x] No watch-mode flags
- [x] Feedback latency < 3 min (one full-suite run)
- [x] `nyquist_compliant: true` set in frontmatter

## Audit Notes (retroactive, 2026-07-26)

- `133-VERIFICATION.md` initially scored 8/9 truths, routing to `human_needed`: the terminal
  `stopAt` loud-failure path (truth 3) was present and structurally wired but not behaviorally
  exercised by the 3x green suite (which only proves the happy path). This is a legitimate gap —
  a suite that stays green after removing a fallback does not, by itself, prove the fallback's
  removal restores the intended failure-loud behavior.
- `133-UAT.md` closed that exact gap with an **executed** (not inferred) experiment: source was
  deliberately broken, the specific failure signature WR-01 requires was observed and matches
  exactly (terminal `waitFor`, correct locator name, no `page.goto()` rescue, within the 90s
  ceiling), then reverted. Result: pass, source: executed-experiment. This is real behavioral
  coverage, not a rubber-stamp.
- No new test files were generated for this audit — per the phase's own framing, doing so would
  test the tests redundantly. The two real coverage instruments (3x full-suite determinism gate +
  the one executed loud-failure experiment) are adequate and already ran to completion.
- **Remaining known gap, correctly out of scope:** DEF-133-01 (`voterIntro.ts:28` intro-CTA click
  flake in `perm-2e-asymmetric`, ~11% observed rate across 9 runs) is a real, currently-unfixed
  intermittent E2E failure. It is untouched by this phase's diff (confirmed: `perm-2e-asymmetric`
  imports only from `voterIntro`, never `voterNavigation`) and is logged in `deferred-items.md`
  for separate follow-up. It does not block this phase's `nyquist_compliant` status because it is
  not a validation gap in what Phase 133 changed — but per the project's own E2E Hard Rule
  ("no known-flaky exemptions"), it remains an outstanding cardinal-rule violation at the
  repo-suite level that should be picked up as its own phase/quick-task soon.

**Approval:** approved 2026-07-26
