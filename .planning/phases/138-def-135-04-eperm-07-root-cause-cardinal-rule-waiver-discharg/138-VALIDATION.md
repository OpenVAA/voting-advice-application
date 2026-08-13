---
phase: 138
slug: def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-13
---

# Phase 138 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `138-RESEARCH.md` § Validation Architecture (lines 1525-1571).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright Test 1.58.2 (`node_modules/@playwright/test/package.json`) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line` *(project lands in Wave 0)* |
| **Full suite command** | `yarn test:e2e` (`package.json:27`) |
| **Estimated runtime** | quick ≈ seconds; full suite ≈ 648 s (measured, 134/134) |
| **Unit framework (unaffected)** | vitest via `turbo run test:unit` (`package.json:25`) |

**Execution prerequisite (project-specific):** one freshly started dev server, and a clean DB
(`yarn db:reset`, ≈28-30 s) before any full-suite gate run. Port `:5173` may be held by a Docker
sibling's wildcard bind — use the `FRONTEND_PORT` escape hatch (the Phase-137 gate used `5273`).
Every evidence run must be confirmed by the Phase-137 served-app preflight (D-17).

---

## Sampling Rate

- **After every task commit:** `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line`, plus `yarn typecheck:tests` and `yarn lint:check` (`package.json:32-33`)
- **After every plan wave:** `yarn test:e2e --project=voter-journey` (pulls `data-setup-base`; the EPERM-07 step is inside it)
- **Before `/gsd-verify-work`:** full suite green, then the 16-run determinism batch
- **Max feedback latency:** < 60 s for the isolated spec; ~648 s for a full-suite sample

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD (planner fills) | 01 | 1 | INTEG-01 | — | N/A | e2e artifact | forensic capture produces video + console/network logs on a failing run | ❌ W0 | ⬜ pending |
| TBD (planner fills) | 02 | 2 | INTEG-01 | — | N/A | e2e | `EPERM07_FORCE_CPU_RATE=… EPERM07_FORCE_BUDGET_MS=… npx playwright test --project=eperm07-term-trigger` | ❌ W0 | ⬜ pending |
| TBD (planner fills) | 02 | 2 | INTEG-01 | — | N/A | e2e artifact | `eperm07-state` annotation present in `results.json` (H1/H2/H3 discriminator) | ❌ W0 | ⬜ pending |
| TBD (planner fills) | 03 | 3 | INTEG-02 | — | N/A | negative control | same forcing command on the **pre-fix** tree → FAILS | ❌ W0 | ⬜ pending |
| TBD (planner fills) | 03 | 3 | INTEG-02 | — | N/A | negative control | byte-identical env on the **post-fix** tree → PASSES | ❌ W0 | ⬜ pending |
| TBD (planner fills) | 04 | 4 | INTEG-02 | — | N/A | e2e batch | 16 consecutive full-suite runs, 134/134, zero EPERM-07 failures | ❌ W0 | ⬜ pending |
| TBD (planner fills) | 04 | 4 | INTEG-02 | — | N/A | grep | `grep -c 'E2E PREFLIGHT FAILED' run-NN/stdout.log` → 0 for all 16 | ✅ preflight exists | ⬜ pending |
| TBD (planner fills) | 05 | 5 | INTEG-03 | — | N/A | static | `! grep -rnE 'test\.(skip\|fixme\|only)\(\|describe\.(skip\|only)\b' tests/tests --include='*.ts'` | ✅ baseline 0 | ⬜ pending |
| TBD (planner fills) | 05 | 5 | INTEG-03 | — | N/A | static | waiver + every referencing document reflects discharge (§R7.1 checklist) | ✅ files exist | ⬜ pending |
| TBD (planner fills) | — | — | D-08 | — | N/A | static | `! grep -n 'expect.soft(questionHeading)' tests/tests/specs/voter/voter-journey.spec.ts` | ✅ file exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs are assigned by the planner; the rows above are the required verification coverage, not a fixed plan split.*

---

## Wave 0 Requirements

- [ ] `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` — the isolated hunt spec (INTEG-01, criteria 1-2)
- [ ] `eperm07-term-trigger` project entry in `tests/playwright.config.ts`
- [ ] `tests/tests/fixtures/shared/forensicCapture.fixture.ts` + registration in `views.ts` (D-11)
- [ ] `video` retention on the `voter-journey` project (D-09)
- [ ] Run wrapper script owning dev-server spawn + log redirection + per-run ledger (D-10, D-12, criterion 3)
- [ ] `138-NEGATIVE-CONTROL.md` (criterion 2, format per Phase 137)
- [ ] `138-DETERMINISM-LEDGER.md` (criterion 3)
- [ ] Framework install: **none required** — Playwright 1.58.2 already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Root cause is *named* (mechanism, file:line, ordering, or contended resource) | INTEG-01 | A prose diagnosis cannot be asserted by a command; only its presence can | Read the diagnosis document; confirm it names a mechanism with file:line, not a symptom |
| D-06 escalation decision, if the mechanism proves test-side | INTEG-01/02 | CONTEXT.md D-06 forbids the executor from applying a test-side remedy unilaterally | Executor stops at a `checkpoint:decision` and presents the forced-repro evidence to the operator |
| No "could not reproduce" closure exists anywhere in the record | INTEG-03 | Requires reading the phase record for intent, not just grepping a token | Review all Phase-138 artifacts for non-reproduction closure language |
| Waiver discharge is unrenewed (no successor waiver) | INTEG-03 | Absence-of-a-new-document is a judgement over the planning tree | Confirm no new `*-WAIVER.md` and no re-scoped exception was added |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (isolated spec)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
