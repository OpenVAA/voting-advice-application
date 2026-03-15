---
phase: 15
slug: questiontemplate-and-verification-closure
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
| **Framework** | vitest 2.1.8 |
| **Config file** | packages/data/vitest.config.ts (workspace-based) |
| **Quick run command** | `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x --reporter=verbose` |
| **Full suite command** | `cd packages/data && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x --reporter=verbose`
- **After every plan wave:** Run `cd packages/data && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | DATA-01, DATA-02 | unit | `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | LOAD-04 | manual | Review 11-DECISION.md for benchmark data and recommendation | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/data/src/objects/questions/template/questionTemplate.test.ts` — covers DATA-01, DATA-02 (restore from git)
- [ ] `packages/data/src/objects/questions/template/questionTemplate.type.ts` — QuestionTemplateData interface (restore from git)
- [ ] `packages/data/src/objects/questions/template/questionTemplate.ts` — QuestionTemplate class (restore from git)

*Files will be restored from git commit 206ada739 as part of execution.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Answer storage decision documented | LOAD-04 | Document review, not code behavior | Verify 11-DECISION.md contains benchmark data and storage recommendation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
