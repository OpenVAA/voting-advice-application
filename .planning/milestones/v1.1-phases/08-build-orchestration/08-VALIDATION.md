---
phase: 8
slug: build-orchestration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (packages), Vitest 2.x (frontend/strapi) |
| **Config file** | `vitest.workspace.ts` (root), `vitest.config.ts` (per-package) |
| **Quick run command** | `turbo run build --dry` |
| **Full suite command** | `turbo run build && turbo run test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `turbo run build --dry` (verify task graph correctness)
- **After every plan wave:** Run `turbo run build && turbo run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | BUILD-01 | smoke | `turbo run build --dry` | N/A (config) | ⬜ pending |
| 08-01-02 | 01 | 1 | BUILD-02 | smoke | `turbo run build --filter=@openvaa/app-shared...` | N/A (turbo output) | ⬜ pending |
| 08-01-03 | 01 | 1 | BUILD-03 | smoke | `turbo run build && turbo run build` (second < 5s) | N/A (timing) | ⬜ pending |
| 08-01-04 | 01 | 1 | FIX-01 | smoke | `turbo run build --filter=@openvaa/app-shared && ls packages/app-shared/build/esm/package.json` | N/A (file check) | ⬜ pending |
| 08-02-01 | 02 | 1 | BUILD-04 | manual-only | `test -f .planning/deno-compatibility.md` | N/A (document) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase modifies build tooling configuration, not application code. Existing tests validate that packages build correctly. Validation is primarily smoke testing (does turbo run build work? do cache hits happen? does the FIX-01 fix produce the right file?).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Deno compatibility document exists | BUILD-04 | Document review, not code behavior | Check `.planning/deno-compatibility.md` exists and covers Turborepo+Deno analysis |
| Cache hit timing | BUILD-03 | Timing-based, environment-dependent | Run `turbo run build` twice; second run should complete in under 5 seconds |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
