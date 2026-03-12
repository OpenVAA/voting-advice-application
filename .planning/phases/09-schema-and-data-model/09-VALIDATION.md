---
phase: 9
slug: schema-and-data-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^2.1.8 |
| **Config file** | `packages/data/vitest.config.ts` |
| **Quick run command** | `cd apps/supabase && npx supabase db reset` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/supabase && npx supabase db reset` (validates all migrations apply cleanly)
- **After every plan wave:** Run `yarn test:unit` (validates QuestionTemplate TypeScript changes)
- **Before `/gsd:verify-work`:** Full suite must be green + `supabase db reset` clean + `supabase db lint` clean
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | SCHM-01 | smoke | `cd apps/supabase && npx supabase db reset` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | SCHM-02 | smoke | `cd apps/supabase && npx supabase db reset` | ✅ | ⬜ pending |
| 09-01-03 | 01 | 1 | SCHM-03 | smoke | `cd apps/supabase && npx supabase db reset` (elections_localized view) | ✅ | ⬜ pending |
| 09-01-04 | 01 | 1 | MTNT-01 | smoke | `cd apps/supabase && npx supabase db reset` | ✅ | ⬜ pending |
| 09-01-05 | 01 | 1 | MTNT-02 | smoke | `cd apps/supabase && npx supabase db reset` | ✅ | ⬜ pending |
| 09-01-06 | 01 | 1 | MTNT-03 | smoke | `cd apps/supabase && npx supabase db reset` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 2 | SCHM-07 | smoke | `cd apps/supabase && npx supabase db reset` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 2 | SCHM-04 | lint | `cd apps/supabase && npx supabase db lint` | ✅ | ⬜ pending |
| 09-02-03 | 02 | 2 | SCHM-05 | smoke | `cd apps/supabase && npx supabase db reset` | ✅ | ⬜ pending |
| 09-02-04 | 02 | 2 | SCHM-06 | smoke | Apply/rollback alternative migrations | ✅ | ⬜ pending |
| 09-02-05 | 02 | 2 | MTNT-07 | smoke | `cd apps/supabase && npx supabase db reset` (verify seed) | ✅ | ⬜ pending |
| 09-02-06 | 02 | 2 | SCHM-01 | smoke | `import { COLUMN_MAP } from '@openvaa/supabase-types'` resolves | ✅ | ⬜ pending |
| 09-03-01 | 03 | 1 | DATA-01 | unit | `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 1 | DATA-02 | unit | Same as above | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/data/src/objects/questions/template/questionTemplate.test.ts` — stubs for DATA-01, DATA-02
- [ ] `packages/data/src/objects/questions/template/questionTemplate.ts` — QuestionTemplate class
- [ ] `packages/data/src/objects/questions/template/questionTemplate.type.ts` — QuestionTemplateData interface

*These stubs are needed before Wave 1 execution for QuestionTemplate unit tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tables visible in Supabase Studio with correct columns | SCHM-02 | Requires Supabase Studio UI inspection | Run `supabase start`, open Studio at localhost:54323, verify table list and column names |
| Localized views return resolved text | SCHM-03 | Requires running SQL with session variable | Run `SELECT set_config('app.locale', 'fi', TRUE); SELECT * FROM elections_localized;` and verify text output (not JSONB) |

*All other behaviors have automated verification via `supabase db reset` or `supabase db lint`.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
