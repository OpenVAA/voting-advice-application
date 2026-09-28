---
phase: 15
slug: scaffold-and-build
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x (from yarn catalog) |
| **Config file** | `apps/frontend/vitest.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend test:unit`
- **After every plan wave:** Run `yarn workspace @openvaa/frontend build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | SCAF-01 | smoke | `cd apps/frontend && npx vite dev --port 5199 &; sleep 5; curl -s http://localhost:5199 > /dev/null && echo OK; kill %1` | N/A | ⬜ pending |
| 15-01-02 | 01 | 1 | SCAF-02 | unit | `! grep -r 'svelte-preprocess' apps/frontend/svelte.config.js` | N/A | ⬜ pending |
| 15-01-03 | 01 | 1 | SCAF-03 | unit | `grep '@tailwindcss/vite' apps/frontend/vite.config.ts` | N/A | ⬜ pending |
| 15-01-04 | 01 | 1 | SCAF-04 | smoke | `yarn workspace @openvaa/frontend build 2>&1 | grep -i alias` | N/A | ⬜ pending |
| 15-01-05 | 01 | 1 | SCAF-05 | integration | `yarn workspace @openvaa/frontend build` | N/A | ⬜ pending |
| 15-01-06 | 01 | 1 | SCAF-06 | integration | `yarn workspace @openvaa/frontend build 2>&1 | grep -c 'CompileError'` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The validation is primarily build-based (dev server + production build) rather than unit test-based.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev server renders pages correctly | SCAF-06 | Visual check | Start `vite dev`, navigate to home page, verify content renders |
| DaisyUI themed components display | SCAF-03 | Visual check | Check buttons and UI components have correct colors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
