---
phase: 84
slug: imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-13
---

# Phase 84 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from 84-RESEARCH.md §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.45+ (`tests/playwright.config.ts`) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=candidate-app-settings,re-auth-setup --workers=1` (D-03 smoke scope) |
| **Full suite command** | `yarn test:e2e --workers=1` (D-05 3-run gate scope) |
| **Estimated runtime** | Quick run: ~10-15 min; full suite: ~54 min per cold-start run. |

---

## Sampling Rate

- **After every task commit:** No quick-run per task — Phase 84 changes are config-only (playwright.config.ts + regen-constants.mjs + diff-playwright-reports.ts). The 1-run cold-start smoke (~54 min) IS the per-task verification.
- **After every plan wave:** 1-run smoke after wave 1 (project-graph edit) or wave 3a (DETERM-09 if escalated).
- **Before `/gsd-verify-work`:** Full 3-run cold-start gate (~162 min). SHA-identical pass-sets required.
- **Max feedback latency:** ~54 min (single cold-start smoke).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 84-01-XX (planner-finalized) | 01 | 1 | DETERM-08 | — | re-auth-setup runs to completion when candidate-app-mutation has failing tests | E2E project-graph behavior | `yarn test:e2e --project=re-auth-setup --workers=1` after config edit | ✅ tests/playwright.config.ts | ⬜ pending |
| 84-01-XX (planner-finalized) | 01 | 2 | DETERM-08 | — | IMGPROXY_TIED_TITLES match-count assertion passes with 3-element const | Unit-like script invocation | `node .planning/phases/79-…/post-fix/regen-constants.mjs <run.json>` | ✅ regen-constants.mjs | ⬜ pending |
| 84-01-XX (planner-finalized) | 01 | 3 | DETERM-08 | — | 11 candidate-app-settings tests + re-auth-dual pass deterministically across 3 cold-start runs | E2E full-suite | `yarn test:e2e --workers=1` ×3 + `tsx tests/scripts/diff-playwright-reports.ts` | ✅ diff-playwright-reports.ts | ⬜ pending |
| 84-02-XX (contingent) | 02 | 3a | DETERM-09 | — | `[storage.image_transformation]` knob tune absorbs cold-warmup latency (FALLBACK ONLY) | E2E full-suite | Same as DETERM-08 full-suite; success = `DATA_RACE ≤ 3` after tune | ✅ apps/supabase/supabase/config.toml | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs finalized by planner.*

---

## Wave 0 Requirements

- [x] None — existing test infrastructure (`tests/playwright.config.ts`, `tests/scripts/diff-playwright-reports.ts`, `regen-constants.mjs`) covers all Phase 84 verification needs. No new test files or fixtures required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phase 73 D-09 binding renegotiation: IMGPROXY_TIED_TITLES list shrinks 14 → 3 | DETERM-08 SC #4 | Structural list edit verified by inspection + match-count assertion gate | `diff` regen-constants.mjs:67-82 before/after; assert 3 titles remain (CAND-03 upload + CAND-12 readback + CAND-03 info-fields readback) |
| Anchor commit shape: jsdoc + DATA_RACE_TESTS + CASCADE_TESTS + PASS_LOCKED_TESTS updates atomic | DETERM-08 SC #5 | Single-commit atomic-regen pattern (Phase 79 D-10 + Phase 83/84 D-06) | Inspect `git log -1 -p` after regen commit — single commit touches all affected files |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (Wave 0 has 0 items — existing infra covers all needs)
- [ ] No watch-mode flags
- [ ] Feedback latency < ~54 min (single cold-start smoke)
- [ ] `nyquist_compliant: true` set in frontmatter (planner sets after task IDs finalize)

**Approval:** pending
