# Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 124-svelte-5-idiom-polish-lock-in-visual-verification
**Areas discussed:** RUNES-03 deliverable, RUNES-04 verification method, RUNES-04 baseline reference, On-regression handling

---

## RUNES-03 — guard deliverable (glob already app-wide; zero violations)

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm + self-test | Assert zero violations, document RUNES-03 as already-met by Phase 115, AND add a permanent guard regression test (a deliberate `svelte/store` import that must trip lint). Belt-and-braces, low effort. | ✓ |
| Confirm-only | Just run `lint:check`, assert zero violations, mark complete by reference to Phase 115. No new test. | |
| Harden the guard | Strengthen beyond the import-name ban (ban `get()`/`subscribe()`/`Readable`/`Writable`, `$store` auto-subscribe, close the `.js` glob gap). Beyond the requirement text. | |

**User's choice:** Confirm + self-test
**Notes:** Scout confirmed during discussion that the glob is already `src/**/*.{ts,svelte}` (Phase 115 SWEEP-03), zero `svelte/store` imports remain, no eslint-disable escapes; only generated Paraglide `.js` files sit outside the glob. So RUNES-03 becomes confirm + a permanent self-test that proves the guard fires.

---

## RUNES-04 — verification method

| Option | Description | Selected |
|--------|-------------|----------|
| Manual documented pass | Drive the running app (light/dark, both apps, candidate login), capture screenshots, write a verification report. One-time pass, no permanent test, no flake. Matches the todo's stated approach. | ✓ |
| Functional E2E assertions | Extend Playwright specs to assert each surface renders correctly (no pixels). Permanent lock-in, low flake risk. | |
| Playwright pixel snapshots | `toHaveScreenshot()` baselines committed + CI-enforced. Strongest coverage but net-new infra + pixel-diff flake vs. the cardinal no-flaky-E2E rule. | |

**User's choice:** Manual documented pass
**Notes:** Avoids net-new visual-snapshot infra and pixel-diff flake risk; the originating todo already sketches a manual light/dark, both-apps, candidate-post-login walk.

---

## RUNES-04 — "no regressions" reference

| Option | Description | Selected |
|--------|-------------|----------|
| Correctness smoke | No historical diff — assert each surface present-and-correct per spec. "Regression" = "broken," not "pixel-changed." | ✓ |
| Pre-migration git diff | Check out the pre-runes commit, capture reference screenshots, diff. Objective but heavy; baseline point ambiguous (migration spanned v2.13 113–117 + Phase 123). | |
| Operator visual sign-off | Agent presents current-state screenshots; operator confirms. Subjective, fast. | |

**User's choice:** Correctness smoke
**Notes:** Treats the three surfaces as present-and-correct checks, not pixel comparisons — fits the manual documented pass.

---

## On-regression handling

| Option | Description | Selected |
|--------|-------------|----------|
| File follow-up todos | Verification only; log fix todos, keep boundary tight. | |
| Fix in-phase | Fix any regression found within Phase 124 (expands scope to repair). | ✓ |
| Fix trivial, defer complex | Fix trivial inline; file todos for anything needing investigation. | |

**User's choice:** Fix in-phase
**Notes:** Captured in CONTEXT.md D-05 with a guardrail — small/surgical repairs land in-phase (atomic commit + re-verify); a large/architectural regression is flagged for an operator scope decision rather than ballooning the phase.

---

## Claude's Discretion

- The exact mechanism of the RUNES-03 guard self-test (lint-on-fixture vs. CI assertion).
- The verification-report filename, format, and screenshot storage.
- Per-surface depth within the verification scope matrix (exact routes/locales/viewports beyond the stated minimums).
- Commit granularity (RUNES-03 lock-in separate from any RUNES-04 fix).

## Deferred Ideas

None beyond the reviewed-but-not-folded todos (feature/other-phase work) listed in CONTEXT.md `<deferred>`. Discussion stayed within the verification/lock-in scope.
