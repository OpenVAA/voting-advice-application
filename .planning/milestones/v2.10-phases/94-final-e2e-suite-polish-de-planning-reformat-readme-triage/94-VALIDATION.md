---
phase: 94
slug: final-e2e-suite-polish-de-planning-reformat-readme-triage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 94 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + Vitest (`@openvaa/dev-seed` unit) + `tsc` (typecheck) |
| **Config file** | `tests/playwright.config.ts`, `tests/vitest.config.ts`, `tests/tsconfig.json` |
| **Quick run command** | `yarn typecheck:tests` (exit 0) |
| **Full suite command** | `cd tests && npx playwright test --list` (count gate) + `yarn workspace @openvaa/dev-seed test:unit` + `yarn test:e2e` (final gate, needs `yarn dev`) |
| **Estimated runtime** | typecheck ~seconds · `--list` ~seconds · full `test:e2e` minutes |

---

## Sampling Rate

- **After every task commit:** `yarn typecheck:tests` (fast, exit 0).
- **After every plan wave (merge):** scoped residual-token grep on the wave's directory + `cd tests && npx playwright test --list` parses cleanly.
- **Before `/gsd:verify-work`:** full suite green.
- **Max feedback latency:** ~30 seconds for the per-task/per-wave loop (full `test:e2e` is the phase gate, not per-task).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (WR) | WR | seq | WR-01 husk deleted | — | N/A | unit | `yarn workspace @openvaa/dev-seed test:unit` | ✅ | ⬜ pending |
| (WR) | WR | seq | WR-03 empty-prefix non-base throws; `e2e/base` maps | — | fail-loud guard | e2e/unit | `yarn test:e2e` (base + perm chains green) | ✅ | ⬜ pending |
| (WR) | WR | seq | WR-04 median ordinal default; Likert-5 still `'3'` | — | N/A | unit | `yarn workspace @openvaa/dev-seed test:unit` (`buildMinimal.test.ts`, `base.test.ts`) | ✅ | ⬜ pending |
| (sweep) | sweep | 1..N | residual grep empty (with carve-outs); titles plain | — | N/A | grep + list | gate grep + `--list` count reconciled (84/72) | ✅ | ⬜ pending |
| (all) | all | all | no type regressions from edits | — | N/A | typecheck | `yarn typecheck:tests` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*WR-02 carries no test of its own beyond `--list` parsing cleanly — per D-03 nothing is removed; the only change is the re-enable TODO marker.*

---

## Wave 0 Requirements

- [ ] Re-capture `cd tests && npx playwright test --list` and pin the baseline = **84 tests / 72 files** (unchanged from current, since D-03 removes nothing). Store alongside `93-PLAYWRIGHT-LIST-BASELINE.txt` if a baseline file convention exists.

*Existing infrastructure (Playwright, Vitest, tsc) covers all phase verification — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full `yarn test:e2e` green | de-planning + WR fixes don't regress behaviour | requires running `yarn dev` + local Supabase stack | Operator runs `yarn dev` then `yarn test:e2e` as the final phase gate |
| README prose reads cleanly with zero archaeology | D-04/D-05/D-06 | prose quality is not machine-checkable beyond the token grep | Reviewer reads `tests/README.md` + `tests/tests/helpers/README.md` |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (`yarn typecheck:tests` / vitest / `--list` grep) or are the manual `test:e2e` final gate
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (every commit runs typecheck)
- [ ] Wave 0 pins the `--list` baseline (84/72)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for the per-task loop
- [ ] `nyquist_compliant: true` set in frontmatter (after planner completes the per-task map)

**Approval:** pending
