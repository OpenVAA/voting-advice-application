---
phase: 61
slug: voter-app-question-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 61 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source-of-truth Validation Architecture lives in 61-RESEARCH.md §Validation Architecture; this file projects it onto the Nyquist compliance form.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (unit) + Playwright 1.49.1 (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts`, `apps/frontend/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit --run` |
| **Full suite command** | `yarn test:unit && yarn test:e2e` |
| **Estimated runtime** | ~45s unit, ~8min E2E (local) |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend test:unit --run` (scoped to the touched file when feasible)
- **After every plan wave:** Run `yarn test:unit` across affected packages
- **Before `/gsd-verify-work`:** Full suite (unit + targeted E2E specs listed below) must be green
- **Max feedback latency:** 45 seconds for unit; 8 min for targeted E2E re-run

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 61-01-* | 01 | 1 | QUESTION-01, QUESTION-02 | — | N/A (no security-sensitive behavior) | unit + e2e | `yarn workspace @openvaa/frontend test:unit --run src/lib/components/questions` + targeted Playwright spec | ✅ existing | ⬜ pending |
| 61-02-* | 02 | 1 | QUESTION-03 | — | N/A | unit + e2e | `yarn workspace @openvaa/frontend test:unit --run src/lib/contexts/voter` + `yarn test:e2e --grep category-selection` | ✅ existing | ⬜ pending |
| 61-03-* | 03 | 2 | QUESTION-04 | — | N/A | e2e (primary) + unit (if context changes) | `yarn test:e2e --grep candidate-questions` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/components/questions/__tests__/OpinionQuestionInput.test.ts` — may need boolean-branch scaffold if missing (check before coding)
- [ ] `apps/frontend/src/lib/contexts/voter/__tests__/voterContext.category-selection.test.ts` — may need a focused context test for category default + reactivity

*If the two unit-test scaffolds above already exist, Wave 0 is satisfied by existing infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voter sees sensible default category selection on first visit (all opinion categories checked) | QUESTION-03 | Visual/UX verification — automated test covers counter math but not "feels right" | Fresh browser → `/[lang]/questions` → confirm every opinion category checkbox is pre-checked and the questions counter reflects the total |
| Candidate-questions-list + candidate-questions-start testIds render visibly within 2s | QUESTION-04 | E2E automated in Playwright, but manual smoke helps catch intermittent races | Full page load `/candidate/questions` → expect question list + Continue CTA to render within a beat, not stay on `<Loading />` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s (unit scope) / 8min (E2E scope)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (will promote to `approved YYYY-MM-DD` when plan-checker verifies Nyquist dimension)
