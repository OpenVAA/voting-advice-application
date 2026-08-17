---
phase: 95
slug: domain-a-wave-1-tier-1-leaf-contexts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-04
---

# Phase 95 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts` / `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit` (then `yarn test:e2e` for the green-gate) |
| **Estimated runtime** | ~30–90 s unit; E2E minutes |

---

## Sampling Rate

- **After every task commit:** Run the relevant package unit tests (`yarn workspace @openvaa/frontend test:unit`)
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd-verify-work`:** Full unit suite green; existing E2E suite stays green (no behavior regression vs v2.10 baseline)
- **Max feedback latency:** ~90 s (unit)

---

## Per-Task Verification Map

> Populated by the planner/executor. Each leaf-context plan (CTX-01…05) maps its tasks here.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 95-01-01 | 01 | 1 | CTX-01 | — | N/A | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `mergeAppSettings` purity unit test (no shared-ref mutation) — **does not exist today** (per RESEARCH Wave-0 gaps)
- [ ] voter `answerStore` unit test — **does not exist today**
- [ ] CTX-01 SSR "DB-override-in-server-HTML" assertion (no post-hydration flash) — **new**
- [ ] Existing `candidateUserDataStore` / `persistedState` / `StackedState` tests must stay green

*Existing infrastructure (vitest + Playwright) covers the rest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No visible "default → DB-override" flash on slow connections | CTX-01 | Visual/timing perception | Throttle network, hard-load a DB-overridden instance, confirm server HTML already carries override |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
