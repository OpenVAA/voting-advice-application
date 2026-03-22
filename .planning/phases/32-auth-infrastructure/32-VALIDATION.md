---
phase: 32
slug: auth-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), svelte-check (types) |
| **Config file** | `apps/frontend/vitest.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend check` |
| **Full suite command** | `yarn workspace @openvaa/frontend check && yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend check`
- **After every plan wave:** Run `yarn workspace @openvaa/frontend check && yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 32-01-01 | 01 | 1 | AUTH-04 | type-check | `yarn workspace @openvaa/frontend check` | ❌ W0 | ⬜ pending |
| 32-01-02 | 01 | 1 | AUTH-04 | type-check | `yarn workspace @openvaa/frontend check` | ❌ W0 | ⬜ pending |
| 32-02-01 | 02 | 1 | AUTH-01, AUTH-02 | type-check | `yarn workspace @openvaa/frontend check` | ✅ | ⬜ pending |
| 32-03-01 | 03 | 2 | AUTH-05 | type-check | `yarn workspace @openvaa/frontend check` | ❌ W0 | ⬜ pending |
| 32-03-02 | 03 | 2 | AUTH-05 | type-check | `yarn workspace @openvaa/frontend check` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `@supabase/ssr` and `@supabase/supabase-js` added to frontend dependencies
- [ ] `@openvaa/supabase-types` added to frontend dependencies
- [ ] Type-check infrastructure already exists (`svelte-check`)

*Existing infrastructure covers type-checking. Package installation is part of Plan 01.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PKCE token exchange works end-to-end | AUTH-01 | Requires running Supabase instance | Start local Supabase, trigger email auth flow, verify callback exchanges token |
| Session cookies set correctly | AUTH-02 | Requires browser + running server | Login, check browser DevTools for Supabase cookies |
| Logout clears httpOnly cookies | AUTH-05 | Requires browser + running server | Login, call logout endpoint, verify cookies cleared |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
