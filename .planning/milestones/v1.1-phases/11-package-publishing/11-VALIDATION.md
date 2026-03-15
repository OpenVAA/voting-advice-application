---
phase: 11
slug: package-publishing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.1.8 |
| **Config file** | Per-package `vitest.config.ts` (workspace-level) |
| **Quick run command** | `yarn test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/core build && yarn workspace @openvaa/core test:unit`
- **After every plan wave:** Run `yarn build && yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | PUB-01 | manual | Check `.changeset/config.json` has `"access": "public"` | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | PUB-02 | smoke | `node -e "const p=require('./packages/core/package.json'); console.assert(p.license && p.description && p.repository && p.files && p.publishConfig)"` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | PUB-03 | smoke | `node -e "const p=require('./packages/core/package.json'); console.assert(!p.private)"` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | PUB-04 | smoke | `yarn workspace @openvaa/core build && ls packages/core/dist/index.js` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | PUB-05 | smoke | `cd packages/core && yarn pack --dry-run 2>&1 \| grep workspace:` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | PUB-06 | integration | Pack tarball, install in temp dir, import and verify exports | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verification script for PUB-02/PUB-03 (npm metadata completeness check)
- [ ] Verification script for PUB-05 (tarball workspace: protocol check)
- [ ] Integration test script for PUB-06 (fresh install verification)
- [ ] Existing unit tests must pass with new tsup build output (regression check)

*Existing infrastructure covers unit test execution; smoke/integration scripts need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npm org exists and configured | PUB-01 | Requires npm account access | Verify `@openvaa` org on npmjs.com, check `.changeset/config.json` access field |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
