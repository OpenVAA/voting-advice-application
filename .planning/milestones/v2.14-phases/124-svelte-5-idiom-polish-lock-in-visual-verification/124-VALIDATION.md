---
phase: 124
slug: svelte-5-idiom-polish-lock-in-visual-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 124 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (frontend unit suite) + ESLint 9.39.2 Node API + manual documented pass (RUNES-04) |
| **Config file** | `apps/frontend/vitest.config.ts` · `apps/frontend/eslint.config.mjs` |
| **Quick run command** | `yarn workspace @openvaa/frontend lint:check` |
| **Full suite command** | `yarn workspace @openvaa/frontend test:unit && yarn lint:check` (+ standard build/unit/E2E trust signal per cardinal rule) |
| **Estimated runtime** | ~30–90 seconds (lint + unit) |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend lint:check`
- **After every plan wave:** Run `yarn workspace @openvaa/frontend test:unit && yarn lint:check`
- **Before `/gsd-verify-work`:** Full suite must be green (build + unit + E2E per D-08; a "did-not-run" E2E counts as a failure)
- **Max feedback latency:** ~90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 1 | RUNES-03 | — | N/A | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |

*Populated by the planner. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Guard regression self-test spec (vitest + `ESLint.lintText` fire/silent fixtures) — stubs for RUNES-03

*RUNES-04 is a manual documented pass (no automated stub); see Manual-Only Verifications.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App-header / banner / post-login candidate-nav render correctly (no regression) | RUNES-04 | D-03 chose a one-time documented pass over pixel snapshots (pixel-diff flake collides with the cardinal no-flaky-E2E rule) | Bring up app (`yarn db:reset` + seed + `yarn dev`), walk the 3 surfaces per D-06 matrix, capture screenshots into `124-VISUAL-VERIFICATION.md` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
