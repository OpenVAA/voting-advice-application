---
phase: 130
slug: e2e-specs-new-feature-coverage
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-19
validated: 2026-07-20
---

# Phase 130 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + vitest (unit) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --grep <targeted spec>` (targeted leaf project) |
| **Full suite command** | `yarn test:e2e` (fresh dev server on :5173 + `yarn db:reset` first) |
| **Estimated runtime** | ~10–15 minutes full suite |

---

## Sampling Rate

- **After every task commit:** Run the targeted spec/leaf project touched by the task
- **After every plan wave:** Run `yarn test:e2e` (full suite — the trusted signal per E2E cardinal rule)
- **Before `/gsd-verify-work`:** Full suite must be green 3× deterministically (D-05: fresh server + clean DB per run)
- **Max feedback latency:** ~900 seconds (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 130-01 T1 | 01 | 1 | EQTYP-02 | — | N/A | e2e (probe) | `npx playwright test --project=_probes -c tests/playwright.config.ts -g "answerNumberScale"` | ✅ `tests/tests/specs/_probes/numberScale.probe.spec.ts` | ✅ green |
| 130-01 T2 | 01 | 1 | EQTYP-01 | — | N/A | e2e (probe) | `npx playwright test --project=_probes -c tests/playwright.config.ts -g "answerNumberScale"` | ✅ `tests/tests/specs/_probes/numberScale.probe.spec.ts` | ✅ green |
| 130-02 T1/T2 | 02 | 1 | EQTYP-03 | — | N/A | e2e | `npx playwright test --project=candidate-journey -c tests/playwright.config.ts` | ✅ `tests/tests/specs/candidate/candidate-journey.spec.ts` (steps 13 + 21) | ✅ green |
| 130-03 T1 | 03 | 2 | EQTYP-01 | — | N/A | e2e | `npx playwright test --project=voter-journey -c tests/playwright.config.ts` | ✅ `tests/tests/specs/voter/voter-journey.spec.ts` (100%-first-card + drawer displays) | ✅ green |
| 130-03 T2 | 03 | 2 | EQTYP-02 | — | N/A | e2e | `npx playwright test --project=voter-journey -c tests/playwright.config.ts` | ✅ `tests/tests/specs/voter/voter-journey.spec.ts` (EQTYP-02 boundary describe) | ✅ green |
| 130-04 T1/T2 | 04 | 2 | EFLOW-02 | — | N/A | e2e | `npx playwright test --project=voter-alliance -c tests/playwright.config.ts` | ✅ `tests/tests/specs/voter/voter-alliance.spec.ts` | ✅ green |
| 130-04 T3 | 04 | 2 | EFLOW-02 | — | N/A | e2e | `npx playwright test --project=voter-nominations -c tests/playwright.config.ts` | ✅ `tests/tests/specs/voter/voter-nominations.spec.ts` | ✅ green |
| 130-05 T1/T2 | 05 | 2 | EQTYP-01 | — | N/A | e2e | `npx playwright test --project=candidate-journey -c tests/playwright.config.ts` | ✅ `tests/tests/specs/candidate/candidate-journey.spec.ts` (steps 18.5 + 18.6) | ✅ green |
| 130-06 gate | 06 | 3 | EQTYP-01/02/03, EFLOW-02 | — | N/A | e2e (full suite ×3) | `yarn test:e2e` (fresh :5173 server + `yarn db:reset` per run) | ✅ (evidence in 130-06-SUMMARY.md) | ✅ green (3× 128/0/0) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — Playwright config, Phase 119 fixture layer, and `e2e/base` seed template are already in place. New fixture code (`answerNumberScale`, candidate `answerMultipleText`) is built fixtures-first with a smoke/probe before specs consume it.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (fixtures-first probe proved answerNumberScale + drawer-display fixtures before spec consumption — SC4)
- [x] No watch-mode flags
- [x] Feedback latency < 900s (full suite ~11 min per 130-06 gate runs)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-20 (retroactive audit via /gsd-validate-phase)

---

## Validation Audit 2026-07-20

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

State A audit (existing draft VALIDATION.md seeded by planner, never updated during execution). All 4 phase requirements (EQTYP-01, EQTYP-02, EQTYP-03, EFLOW-02) classified **COVERED**:

- **Artifacts verified on disk:** `numberScale.probe.spec.ts`, `voter-alliance.spec.ts`, `voter-nominations.spec.ts` exist; fixture helpers `answerNumberScale`, `expectNumberQuestionDisplay`, `fillMultipleTextQuestion` present by grep; Playwright project wiring for `_probes` (numberScale), `voter-alliance`, `voter-nominations` present in `tests/playwright.config.ts`.
- **Commits verified in git:** all 12 task commits across plans 130-01..130-05 plus the 130-06 deviation fix (`8725d86ef`) present.
- **Trusted signal:** D-05 determinism gate (130-06) — full default suite 3× consecutive green, 128 passed / 0 failed / 0 did-not-run per run, each on a fresh :5173 server + clean DB; all 4 new-coverage entries confirmed executed in every run log.
- **No auditor spawn required** — zero MISSING/PARTIAL gaps; this is a specs-only phase whose deliverables are the automated verification.
- **Manual-only items:** none. Two pre-existing product bugs discovered during 130-05 (BLOCKER-130-05 i18n gap, boolean falsy-guard quirk) are logged in `deferred-items.md` as out-of-scope product fixes, not validation gaps of this phase.
