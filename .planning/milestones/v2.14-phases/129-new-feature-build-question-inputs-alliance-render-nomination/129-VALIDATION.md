---
phase: 129
slug: new-feature-build-question-inputs-alliance-render-nomination
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-17
---

# Phase 129 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit, per package) + Playwright (E2E, repo-root `tests/`) |
| **Config file** | `tests/playwright.config.ts` (E2E); per-package vitest configs |
| **Quick run command** | `yarn test:unit` (or scoped: `cd packages/data && yarn test:unit`) |
| **Full suite command** | `yarn test:e2e` (requires fresh dev server on :5173 + `yarn db:reset` first) |
| **Estimated runtime** | unit ~60s scoped; E2E full suite ~10–15 min |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:unit` for the touched package; typecheck via `yarn build --filter=@openvaa/<pkg>`
- **After every plan wave:** Run full `yarn test:e2e` on fresh :5173 + clean DB
- **Before `/gsd-verify-work`:** Full E2E suite must be green (cardinal rule — "did not run" counts as failure)
- **Max feedback latency:** ~900 seconds (full E2E wave gate)

---

## Per-Task Verification Map

*(Task IDs filled by the planner; requirement-level map from RESEARCH.md Validation Architecture.)*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | — | — | UNBLK-02 | — | N/A | unit | `cd packages/data && yarn test:unit` (`multipleChoiceCategoricalQuestion.test.ts`) | ✅ add cases | ⬜ pending |
| TBD | — | — | UNBLK-05 | — | N/A | E2E + unit | `yarn test:e2e` (voter-journey re-baseline) | ✅ re-baseline | ⬜ pending |
| TBD | — | — | UNBLK-01 | — | N/A | E2E | `yarn test:e2e` (Phase 130 asserts; 129 ships input + seed, suite green) | ❌ Phase-130 spec | ⬜ pending |
| TBD | — | — | UNBLK-04 | — | N/A | E2E | `yarn test:e2e` (Phase 130 asserts; 129 fixes loader, suite green) | ❌ Phase-130 spec | ⬜ pending |
| TBD | — | — | UNBLK-06 | — | N/A | E2E | `yarn test:e2e` + D-10 render verification | ❌ Phase-130 spec | ⬜ pending |
| TBD | — | — | D-16 (buildMinimal number branch) | — | N/A | unit | `cd packages/dev-seed && yarn test:unit` (`buildMinimal.test.ts`) | ✅ add case | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/fixtures/voter/` — number + multi-choice answer handling in the voter-journey fixture layer (required before the re-baseline walk can answer the new question types — D-14)
- [ ] `tests/tests/utils/testIds.ts` — new locators registered (slider value, checkbox choices, multi-text rows)
- [ ] `packages/data/.../multipleChoiceCategoricalQuestion.test.ts` — unit cases for matching methods
- [ ] `packages/dev-seed/.../buildMinimal.test.ts` — number-default unit case

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Alliance card + member-orgs drawer render in voter results | UNBLK-06 (D-10) | Dedicated E2E spec lands in Phase 130; 129 verifies render | `yarn db:seed --template e2e/base`, open voter results, confirm alliance section + drawer + gauge |
| Slider keyboard exact-value control (a11y + E2E contract) | UNBLK-05 (D-03) | Interaction-quality check ahead of Phase 130 fixture | Focus slider, arrow keys step exact values, label updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 900s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
