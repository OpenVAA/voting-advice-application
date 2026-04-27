---
phase: 18
slug: dependency-modernization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), Turborepo build pipeline |
| **Config file** | `vitest.config.ts` per workspace |
| **Quick run command** | `yarn build` |
| **Full suite command** | `yarn build && yarn test:unit` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn build`
- **After every plan wave:** Run `yarn build && yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | DEP-02 | build | `yarn build` | ✅ | ⬜ pending |
| 18-01-02 | 01 | 1 | DEP-01 | build | `yarn build` | ✅ | ⬜ pending |
| 18-02-01 | 02 | 1 | DEP-03 | build | `yarn build` | ✅ | ⬜ pending |
| 18-03-01 | 03 | 2 | DEP-04 | build+test | `yarn build && yarn test:unit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Build pipeline and unit tests already exist. No new test frameworks or fixtures needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `yarn install` no peer dep warnings | DEP-01 | Warning output inspection | Run `yarn install` and check stderr for resolution warnings |
| Yarn catalog completeness | DEP-04 | Requires cross-workspace audit | Compare catalog entries in `.yarnrc.yml` with shared deps across `package.json` files |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
