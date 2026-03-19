---
phase: 25
slug: dataprovider
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit --reporter=verbose` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend test:unit --reporter=verbose`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | READ-01 | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | READ-02 | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | READ-03 | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | READ-04 | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | READ-05 | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | READ-06 | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Unit test stubs for DataProvider methods (getElection, getConstituencies, getCandidates, getParties, getQuestions, getNominations, getAppSettings)
- [ ] Test fixtures for Supabase query responses
- [ ] Mock Supabase client for unit testing

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voter app renders election data from Supabase | READ-01–06 | End-to-end rendering requires running app | Start dev stack, navigate voter app, verify all data loads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
