---
phase: 132
slug: milestone-close-green-gate-svelte-check-zero-flip
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-23
---

# Phase 132 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E, `tests/playwright.config.ts`) + vitest (unit) + svelte-check 4.4.5 (types) |
| **Config file** | `tests/playwright.config.ts` / `apps/frontend/package.json` |
| **Quick run command** | `yarn workspace @openvaa/frontend check` (svelte-check) / targeted `npx playwright test -c ./tests/playwright.config.ts --project=<project>` |
| **Full suite command** | `yarn test:e2e` (fresh :5173 server + clean DB per run) |
| **Estimated runtime** | svelte-check ~60s; full E2E ~4–8 min/run |

---

## Sampling Rate

- **After every task commit:** Run the touched surface's targeted check (svelte-check for CI/script edits; isolated `--project=candidate-journey` for the step-13.5 harden)
- **After every plan wave:** Run `yarn test:e2e` (full suite, fresh server + clean DB)
- **Before `/gsd-verify-work`:** Full suite must be green 3× consecutive (the phase gate itself)
- **Max feedback latency:** ~480 seconds (one full E2E run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | — | — | HARDN-02 / TYPE-10 | — | N/A | e2e / cli | see plan tasks | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements (Playwright suite, vitest, svelte-check all installed and green-capable; no new framework needed).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI step actually blocks on a red svelte-check | TYPE-10 | The blocking behavior fires in GitHub Actions, not locally | Negative control locally: introduce a temp warning, run the exact CI command, assert non-zero exit; revert |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 480s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
