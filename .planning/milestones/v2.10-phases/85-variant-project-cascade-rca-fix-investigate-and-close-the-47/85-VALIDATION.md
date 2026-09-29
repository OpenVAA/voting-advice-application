---
phase: 85
slug: variant-project-cascade-rca-fix-investigate-and-close-the-47
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-14
---

# Phase 85 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from 85-RESEARCH.md §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `tests/playwright.config.ts` (451 lines; Plan 02 Path B touches line 236; Plan 01 RCA touches no test files) |
| **Quick run command** | Plan 01 RCA: `node -e "..."` artifact inspection against Phase 84 `run-{1,2,3}.json` (no test execution; ~5 min) |
| **Full suite command** | `yarn test:e2e --workers=1 --reporter=json > .planning/phases/85-…/post-fix/run-N.json` (~54 min per run for the 3-run gate) |
| **Estimated runtime** | Plan 01 RCA: ~5 min. Plan 02 3-run gate: ~162 min unattended. |

---

## Sampling Rate

- **Per Plan 01 task:** ~1-5 min (artifact inspection bash snippets; no test execution).
- **Per Plan 02 task commit:** atomic-commit-per-task per Phase 79 D-10 + Phase 83/84 precedent.
- **Plan 02 gate:** 3-run cold-start gate via Phase-84-renegotiated archived `regen-constants.mjs`. SHA-identical pass-sets required.
- **Phase gate:** Full 3-run cold-start green; new anchor SHA replaces Phase 84's `04ddfdd85cf…`.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 85-01-XX (planner-finalized) | 01 | 1 | DETERM-10 | manual-artifact-inspect | `cat .planning/phases/85-…/85-RCA-FINDINGS.md` (committed Plan 01 deliverable) | ❌ Wave 0 (Plan 01 deliverable) | ⬜ pending |
| 85-02-XX (planner-finalized, Path A/B) | 02 | 2 | DETERM-11 | E2E full-suite × 3 | `yarn test:e2e --workers=1 --reporter=json` ×3 + diff-playwright-reports.ts | ✅ Phase 79 / 84 rails | ⬜ pending |
| 85-02-XX (Path C if Phase 86 lands first) | 02 | 2 | DETERM-11 | done-as-noop verification | re-run 3-run gate post-Phase-86 to verify cascade clears | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs finalized by planner per RCA verdict.*

---

## Wave 0 Requirements

- [x] None — existing test infrastructure (`tests/playwright.config.ts`, `tests/scripts/diff-playwright-reports.ts`, Phase 79 archived `regen-constants.mjs`) covers all Phase 85 verification needs. No new test files or fixtures required.
- [x] Phase 84's binding anchor at SHA `04ddfdd85cf…` provides the diagnostic source for Plan 01 RCA (no fresh capture needed for the RCA itself).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Variant chain unblocks (47 CASCADE → ≤5) | DETERM-11 SC | Inspection of post-fix anchor `regen-output.txt` | Diff `tests/scripts/diff-playwright-reports.ts` CASCADE_TESTS array pre/post-regen; assert size ≤ 5 |
| No NEW variant deterministic failures introduced | DETERM-11 SC | Comparison vs Phase 84 anchor | Inspect post-fix run-3.json for new `failed` statuses on variant projects; route any to Phase 86 |
| RCA verdict identifies single-source vs multi-source cascade | DETERM-10 SC | Plan 01 RCA-FINDINGS.md is the authoritative artifact | Verify Plan 01 RCA-FINDINGS.md cites the chain-head failure with evidence from Phase 84 run-N.json |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (Plan 01 RCA tasks are diagnostic artifact reads; acceptable)
- [ ] Wave 0 covers all MISSING references (0 items — Phase 79/84 rails cover all)
- [ ] No watch-mode flags
- [ ] Feedback latency: Plan 01 ~5 min; Plan 02 ~54 min per cold-start
- [ ] `nyquist_compliant: true` set in frontmatter (planner sets after task IDs finalize)

**Approval:** pending
