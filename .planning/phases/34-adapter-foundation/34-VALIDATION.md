---
phase: 34
slug: adapter-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `apps/frontend/vitest.config.ts` |
| **Quick run command** | `cd apps/frontend && yarn vitest run src/lib/api/adapters/supabase/` |
| **Full suite command** | `cd apps/frontend && yarn test:unit` |
| **Estimated runtime** | ~5 seconds (supabase adapter tests only) |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/frontend && yarn vitest run src/lib/api/adapters/supabase/`
- **After every plan wave:** Run `cd apps/frontend && yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 34-01-01 | 01 | 1 | ADPT-05 | unit | `vitest run src/lib/api/adapters/supabase/utils/mapRow.test.ts` | ❌ W0 | ⬜ pending |
| 34-01-02 | 01 | 1 | ADPT-05 | unit | `vitest run src/lib/api/adapters/supabase/utils/getLocalized.test.ts` | ❌ W0 | ⬜ pending |
| 34-01-03 | 01 | 1 | ADPT-05 | unit | `vitest run src/lib/api/adapters/supabase/utils/localizeRow.test.ts` | ❌ W0 | ⬜ pending |
| 34-01-04 | 01 | 1 | ADPT-05 | unit | `vitest run src/lib/api/adapters/supabase/utils/toDataObject.test.ts` | ❌ W0 | ⬜ pending |
| 34-01-05 | 01 | 1 | ADPT-05 | unit | `vitest run src/lib/api/adapters/supabase/utils/storageUrl.test.ts` | ❌ W0 | ⬜ pending |
| 34-02-01 | 02 | 1 | ADPT-05 | type-check | `yarn build --filter=@openvaa/frontend` | ✅ | ⬜ pending |
| 34-03-01 | 03 | 2 | ADPT-06 | type-check | `yarn build --filter=@openvaa/app-shared` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing test infrastructure (vitest + jsdom) covers all phase requirements
- Test files will be created as part of plan tasks (copied from parallel branch)
- No additional test framework installation needed

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Adapter switch selects correct adapter | ADPT-06 | Requires runtime config change | 1. Set `staticSettings.dataAdapter.type` to `'supabase'` 2. Verify dynamic import resolves |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
