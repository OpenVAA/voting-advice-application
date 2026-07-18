---
phase: 130
slug: e2e-specs-new-feature-coverage
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-19
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
| (seeded by planner) | — | — | EQTYP-01/02/03, EFLOW-02 | — | N/A | e2e | `yarn test:e2e` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — Playwright config, Phase 119 fixture layer, and `e2e/base` seed template are already in place. New fixture code (`answerNumberScale`, candidate `answerMultipleText`) is built fixtures-first with a smoke/probe before specs consume it.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 900s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
