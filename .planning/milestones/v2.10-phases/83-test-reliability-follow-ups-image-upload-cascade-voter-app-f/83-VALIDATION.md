---
phase: 83
slug: test-reliability-follow-ups-image-upload-cascade-voter-app-f
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 83 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/tests test:e2e --project=candidate-app-mutation --workers=1` (1-run smoke, ~54 min — Phase 79 D-12 protocol) |
| **Full suite command** | `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json > .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/run-N.json` (~54 min/run × 3 = ~162 min — Phase 79 D-13 protocol) |
| **Estimated runtime** | ~162 seconds × 60 = ~162 min for the 3-run gate; ~54 min for the 1-run smoke |
| **Parity check** | `tsx tests/scripts/diff-playwright-reports.ts <baseline> .planning/phases/83-.../post-fix/run-3.json` |

---

## Sampling Rate

- **After every task commit:** No automated unit-test layer for Phase 83. Tasks 1, 2, 4, 5, 6 land structural edits validated by Task 3's 1-run cold-start smoke (Phase 79 D-12 pattern) and Task 7's 3-run gate (Phase 79 D-13 pattern). Task 9 is a filesystem move (no validation needed).
- **After every plan wave:** Task 3 (1-run smoke) gates Wave 4 entry; if RED, escalate D-01b/c per CONTEXT D-01d ladder before continuing. Task 7 (3-run gate) gates Task 8 (regen).
- **Before `/gsd-verify-work`:** Task 8 regen produces the new v2.10-close anchor; full suite must show 3-run SHA-256 identity per Phase 79 D-08.
- **Max feedback latency:** ~54 min (single cold-start run); agent-inline run_in_background per Phase 79 D-11. Operator (kalle) authorized for unattended execution.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 83-01-T01 | 01 | 1 | WR-01 (Phase 82 advisory) | — | N/A | E2E (Playwright) | `yarn workspace @openvaa/tests test:e2e --project=variant-hidden-required-candidate --workers=1` | ✅ tests/tests/setup/templates/variant-hidden-required.ts | ⬜ pending |
| 83-01-T02 | 01 | 2 | DETERM-06 (D-01a) | — | N/A | E2E (Playwright) | `yarn workspace @openvaa/tests test:e2e --project=candidate-app-mutation --workers=1 -g "should upload a profile image"` | ✅ tests/tests/pages/candidate/ProfilePage.ts | ⬜ pending |
| 83-01-T03 | 01 | 3 | DETERM-06 (D-01d gate) | — | N/A | E2E (1-run cold-start smoke) | `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean && yarn workspace @openvaa/frontend dev` (background) `&& yarn workspace @openvaa/tests test:e2e --project=candidate-app-mutation --workers=1` | n/a — gate task | ⬜ pending |
| 83-01-T04 | 01 | 4 | DETERM-07a | — | N/A | E2E (Playwright) | `yarn workspace @openvaa/tests test:e2e --project=voter-app -g "should show worst match"` | ✅ tests/tests/specs/voter/voter-matching.spec.ts:238 | ⬜ pending |
| 83-01-T05 | 01 | 4 | DETERM-07b | — | N/A | E2E (Playwright) | `yarn workspace @openvaa/tests test:e2e --project=voter-app -g "should open party detail drawer"` | ✅ tests/tests/specs/voter/voter-detail.spec.ts:124 | ⬜ pending |
| 83-01-T06 | 01 | 0 | IN-01 (Phase 82 advisory) | — | N/A | Static (cosmetic) | n/a — visual review | ✅ tests/tests/specs/candidate/candidate-profile-validation.spec.ts:6,51 | ⬜ pending |
| 83-01-T07 | 01 | 5 | DETERM-05-derivative (3-run gate) | — | N/A | Custom (Phase 79 protocol) | `node .planning/phases/83-.../post-fix/sha-identity.mjs` (across run-{1,2,3}.json) | ✅ Phase 79 archived tooling | ⬜ pending |
| 83-01-T08 | 01 | 6 (atomic) | IN-02 + DETERM-07b promotion + regen | — | N/A | Parity-script verification | `node .planning/phases/83-.../post-fix/regen-constants.mjs && tsx tests/scripts/diff-playwright-reports.ts <baseline> post-fix/run-3.json` | ✅ tests/scripts/diff-playwright-reports.ts | ⬜ pending |
| 83-01-T09 | 01 | 0 | Bookkeeping | — | N/A | Filesystem (no validation) | `git mv` ops | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/regen-constants.mjs` — copy from Phase 79 verbatim; edit `reportPath` to `run-3.json`. (Task 8 setup)
- [ ] `.planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/sha-identity.mjs` — copy from Phase 79 verbatim. (Task 7 setup)
- [ ] `.planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/` — create directory. (Task 7 setup)

*No additional test framework install needed — Playwright + tsx + Node already installed per RESEARCH.md §Standard Stack.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| IN-01 docstring count is accurate | IN-01 | Cosmetic only — no executable test asserts on the docstring text | After edit, manually verify `candidate-profile-validation.spec.ts:6,51` read "Covers 6 reliably-renderable cells (3 original + 2 Phase 81 lifts + 1 Phase 82 standalone)" and "all 6 test titles" respectively. |
| 1-run cold-start smoke is GREEN | DETERM-06 (D-01d) | Wall-time bound (~54 min) makes per-CI sampling impractical; agent-inline execution | Operator confirms Task 3 output via `parity-gate-output.txt` capture before triggering Task 4-5 wave. |
| 3-run SHA-256 identity is achieved | DETERM-05-derivative | Phase 79 D-09 instability protocol may need operator review on flake | If `sha-identity.mjs` reports non-identity, planner applies D-09 (re-run 3 more × cold-start, investigate) per Phase 79 precedent. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (Tasks 6 + 9 are explicitly bookkeeping; Tasks 1, 2, 4, 5, 7, 8 all have E2E or parity-script gates)
- [ ] Wave 0 covers all MISSING references (regen-constants.mjs, sha-identity.mjs, post-fix/ dir)
- [ ] No watch-mode flags
- [ ] Feedback latency < ~54 min (per-task) / ~162 min (3-run gate)
- [ ] `nyquist_compliant: true` set in frontmatter (after planner verification)

**Approval:** pending
