---
phase: 131
slug: e2e-reliability-hardening-deferred-flake-race-triage
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-22
---

# Phase 131 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + vitest (unit) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --grep <targeted spec>` (targeted leaf project; `_probes` surfaces need `--project=_probes`) |
| **Full suite command** | `yarn test:e2e` (fresh dev server on :5173 + `yarn db:reset` first) |
| **Estimated runtime** | ~1–3 min per targeted spec; ~10–15 min full suite |

---

## Sampling Rate

- **After every task commit:** Run the covering spec(s) touched by the task (targeted leaf project)
- **After every plan wave:** Run the phase's targeted 3× cold-start gate on every spec changed/hardened this phase (D-04 — full-suite 3× gate is deferred to Phase 132)
- **Before `/gsd-verify-work`:** Every triaged surface's covering spec green 3× (fresh :5173 server + `yarn db:reset` per run, D-01/D-11)
- **Max feedback latency:** ~300 seconds (3× targeted spec run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *(seeded draft — filled from PLAN.md task list at plan time / validate-phase)* | | | HARDN-01 | | | e2e | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — the Playwright suite, fixtures, and dev-seed templates are already in place; this phase triages/hardens existing specs and helpers rather than installing new test infrastructure.

---

## Manual-Only Verifications

All phase behaviors have automated verification (spec runs are the disposition evidence). The only non-spec artifacts are documentation stamps (todo disposition stamps + `131-DISCUSSION-POINTS.md` checkboxes), verified by file inspection.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
