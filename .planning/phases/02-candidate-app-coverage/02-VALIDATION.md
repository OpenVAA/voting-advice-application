---
phase: 2
slug: candidate-app-coverage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=candidate-app` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:e2e --project=candidate-app`
- **After every plan wave:** Run `yarn test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-02-01 | 02 | 2 | CAND-01 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-auth.spec.ts` | W0 | pending |
| 02-02-02 | 02 | 2 | CAND-02 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-auth.spec.ts` | W0 | pending |
| 02-02-03 | 02 | 2 | CAND-07 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-registration.spec.ts` | W0 | pending |
| 02-02-04 | 02 | 2 | CAND-08 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-registration.spec.ts` | W0 | pending |
| 02-03-01 | 03 | 3 | CAND-03 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-profile.spec.ts` | W0 | pending |
| 02-03-02 | 03 | 3 | CAND-04 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | W0 | pending |
| 02-03-03 | 03 | 3 | CAND-05 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | W0 | pending |
| 02-03-04 | 03 | 3 | CAND-06 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | W0 | pending |
| 02-03-05 | 03 | 3 | CAND-12 | e2e | Inline in profile + questions specs | N/A | pending |
| 02-04-01 | 04 | 2 | CAND-09 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | W0 | pending |
| 02-04-02 | 04 | 2 | CAND-10 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | W0 | pending |
| 02-04-03 | 04 | 2 | CAND-11 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | W0 | pending |
| 02-04-04 | 04 | 2 | CAND-13 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | W0 | pending |
| 02-04-05 | 04 | 2 | CAND-14 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | W0 | pending |
| 02-04-06 | 04 | 2 | CAND-15 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/specs/candidate/candidate-auth.spec.ts` -- stubs for CAND-01, CAND-02
- [ ] `tests/tests/specs/candidate/candidate-registration.spec.ts` -- stubs for CAND-07, CAND-08
- [ ] `tests/tests/specs/candidate/candidate-profile.spec.ts` -- stubs for CAND-03
- [ ] `tests/tests/specs/candidate/candidate-questions.spec.ts` -- stubs for CAND-04, CAND-05, CAND-06
- [ ] `tests/tests/specs/candidate/candidate-settings.spec.ts` -- stubs for CAND-09 through CAND-15
- [ ] `tests/tests/pages/candidate/ProfilePage.ts` -- page object
- [ ] `tests/tests/pages/candidate/QuestionsPage.ts` -- page object
- [ ] `tests/tests/pages/candidate/QuestionPage.ts` -- single question page object
- [ ] `tests/tests/pages/candidate/SettingsPage.ts` -- page object
- [ ] `tests/tests/pages/candidate/PreviewPage.ts` -- page object
- [ ] `tests/tests/pages/candidate/RegisterPage.ts` -- page object
- [ ] `tests/tests/pages/candidate/ForgotPasswordPage.ts` -- page object
- [ ] `tests/tests/utils/emailHelper.ts` -- SES email fetch + parse utility
- [ ] Dataset extension: unregistered candidate + additional question types (text, boolean, image)

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
