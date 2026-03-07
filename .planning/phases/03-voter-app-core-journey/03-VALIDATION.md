---
phase: 3
slug: voter-app-core-journey
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | tests/playwright.config.ts |
| **Quick run command** | `cd tests && npx playwright test --project=voter-app` |
| **Full suite command** | `cd tests && npx playwright test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tests && npx playwright test --project=voter-app`
- **After every plan wave:** Run `cd tests && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VOTE-01..12 | e2e | `npx playwright test --project=voter-app` | Wave 0 | pending |
| 03-02-01 | 02 | 2 | VOTE-01 | e2e | `npx playwright test voter-journey --grep "home page"` | Wave 0 | pending |
| 03-02-02 | 02 | 2 | VOTE-02, VOTE-03 | e2e | `npx playwright test voter-journey --grep "election\|constituency"` | Wave 0 | pending |
| 03-02-03 | 02 | 2 | VOTE-04 | e2e | `npx playwright test voter-journey --grep "intro"` | Wave 0 | pending |
| 03-02-04 | 02 | 2 | VOTE-06 | e2e | `npx playwright test voter-journey --grep "questions"` | Wave 0 | pending |
| 03-03-01 | 03 | 2 | VOTE-08 | e2e | `npx playwright test voter-results --grep "candidate"` | Wave 0 | pending |
| 03-03-02 | 03 | 2 | VOTE-09 | e2e | `npx playwright test voter-results --grep "organization"` | Wave 0 | pending |
| 03-03-03 | 03 | 2 | VOTE-10 | e2e | `npx playwright test voter-results --grep "tabs"` | Wave 0 | pending |
| 03-04-01 | 04 | 2 | VOTE-11 | e2e | `npx playwright test voter-detail --grep "candidate"` | Wave 0 | pending |
| 03-04-02 | 04 | 2 | VOTE-12 | e2e | `npx playwright test voter-detail --grep "party"` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/data/voter-dataset.json` — voter-specific test data with single constituency, deterministic answers
- [ ] `tests/tests/data/candidate-addendum.json` — candidate-app-specific data split from default
- [ ] `tests/tests/pages/voter/HomePage.ts` — voter home page object
- [ ] `tests/tests/pages/voter/IntroPage.ts` — voter intro page object
- [ ] `tests/tests/pages/voter/ResultsPage.ts` — voter results page object
- [ ] `tests/tests/pages/voter/EntityDetailPage.ts` — voter entity detail page object
- [ ] `tests/tests/fixtures/voter.fixture.ts` — parameterizable answer fixture
- [ ] `tests/tests/specs/voter/` — directory creation
- [ ] App settings override in data-setup for Phase 3 simple path (disable category intros)

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
