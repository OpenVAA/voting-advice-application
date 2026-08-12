---
phase: 119
slug: e2e-fixtures-helpers-seed
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-14
---

# Phase 119 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Body derived from RESEARCH.md §Validation Architecture; the Per-Task Verification Map is filled by the planner / gsd-nyquist-auditor once plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E fixtures + smoke/probes) + Vitest (`@openvaa/dev-seed` unit suite) |
| **Config file** | `tests/playwright.config.ts` (read-only this phase) · `packages/dev-seed` vitest config |
| **Quick run command** | `yarn typecheck:tests && yarn lint:check` (locator guard `no-restricted-locators`) |
| **Full suite command** | `yarn workspace @openvaa/dev-seed test:unit` + the per-fixture smoke/probes |
| **Estimated runtime** | typecheck+lint ~30–60s · dev-seed unit ~seconds · per-probe ~seconds each |

---

## Sampling Rate

- **After every task commit:** Run `yarn typecheck:tests` (+ `yarn lint:check` when a new fixture/helper lands).
- **After every plan wave:** Run `yarn workspace @openvaa/dev-seed test:unit` (must stay green — SC4) + any wave smoke/probes.
- **Before `/gsd-verify-work`:** typecheck:tests green + locator guard green + dev-seed unit suite green + each new fixture has a passing smoke/probe (SC1/SC2) + UNBLK-03 running-app check passed (SC3).
- **Max feedback latency:** ~60 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _TBD by planner_ | — | — | UNBLK-03 / SC1–SC4 | — | N/A | unit / probe | `{command}` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Each new fixture/helper gets a smoke/probe stub before it is relied upon (A8 fixtures-first; SC2).
- [ ] `@openvaa/dev-seed` unit suite remains the green gate for every seed-template change (SC4).
- [ ] No new test framework needed — Playwright + Vitest already present.

*Existing infrastructure covers all phase requirements (no framework install needed).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `yarn db:seed:default` produces a valid dataset (parties present, candidates tab populated, consistent naming) | UNBLK-03 / SC3 | SC3 explicitly mandates running-app verification, not a DB/unit assertion; the symptom is a live-UI observation | `yarn db:reset` → `yarn db:seed:default` → load the app → confirm parties present, candidates tab populated, naming consistent (per RESEARCH.md UNBLK-03 finding) |

*Smoke/probes automate the fixture/view-manipulation behaviors; only the UNBLK-03 running-app symptom is manual per SC3.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (typecheck / lint / unit / probe) or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
