---
phase: 81
slug: a11y-01-product-gap-cells-email-url-format
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 81 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 81 closes A11Y-05 (email-format) + A11Y-06 (URL-format) PRODUCT-GAP cells via additive client-side validation on the candidate profile route.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) per `tests/package.json`; Vitest for optional unit |
| **Config file** | `tests/playwright.config.ts` (`candidate-app-mutation` project regex already includes `profile-validation`) |
| **Quick run command** | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` (greps all 5 A11Y-01 cells = 3 existing + 2 new) |
| **Full suite command** | `yarn test:e2e --workers=1` (3-run cold-start determinism gate per D-13) |
| **Estimated runtime** | ~120s for quick run × 5 cells; ~12-18 min full cold-start × 3 runs |

---

## Sampling Rate

- **After every task commit:** Run `yarn lint:check && yarn workspace @openvaa/frontend build` (TypeScript + lint compile gate — catches missing `TranslationKey` union members + `playwright/no-raw-locators` violations)
- **After every plan wave merge:** Run `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` (5 cells PASS — 3 existing + 2 new)
- **Before `/gsd-verify-work`:** 3-run cold-start `yarn test:e2e --workers=1` full suite green; parity-script self-identity smoke (`tsx tests/scripts/diff-playwright-reports.ts | diff <expected-template> -`); Phase 79 v2.10 anchor at SHA `ff0334f856…` confirmed (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE + **2 new PASS_LOCKED** expected → 82 PASS_LOCKED post-Phase-81)
- **Max feedback latency:** ~30s (quick lint+build gate); ~120s per A11Y-01 grep run; ~12-18 min full cold-start

---

## Per-Task Verification Map

> Plan 01 task IDs are TBD — planner populates this table at PLAN.md authoring time.
> Each row maps a task to its automated verification command + Wave 0 dependency status.
> The 4 mapped requirements are A11Y-05 (email-format), A11Y-06 (URL-format), plus 2 inherited gates: TranslationKey type-safety compile gate + Phase 79 anchor preservation.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 81-01-NN | 01 | 1 | A11Y-05 (Input.svelte email branch + EMAIL_REGEX) | T-81-V5 | Pragmatic regex check; `handleError` fires on fail; value preserved by returning BEFORE `value=` assignment; same UX as URL branch | E2E (Playwright) cell 5 | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-05 email-format"` | ❌ W0 (added in Plan 01) | ⬜ pending |
| 81-01-NN | 01 | 1 | A11Y-06 (sort-21 retrofit subtype:'link' + spec cell 6) | T-81-V5 | URL validation already exists at Input.svelte:286-296; Phase 81 makes the dispatch path reachable on candidate-profile sort-21 social-link | E2E (Playwright) cell 6 | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-06 url-format"` | ❌ W0 (added in Plan 01) | ⬜ pending |
| 81-01-NN | 01 | 1 | A11Y-05 / A11Y-06 (TranslationKey type-safety) | T-81-V7 | TS compile catches mis-spelled / missing `components.input.error.invalidEmail` key references | Compile gate | `yarn build` (or `yarn workspace @openvaa/frontend build`) after the 7-Paraglide + 4-legacy JSON edits + `tsx apps/frontend/tools/translationKey/generateTranslationKeyType.ts` regen | ❌ W0 (added in Plan 01) | ⬜ pending |
| 81-01-NN | 01 | 1 | A11Y-05 / A11Y-06 (i18n 11-locale coverage) | — | Localized error strings render correctly in each locale; no `[components.input.error.invalidEmail]` fallback markers | Smoke (manual + automated grep) | `grep -l invalidEmail apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/components.json` returns 11 paths | ❌ W0 (added in Plan 01) | ⬜ pending |
| 81-01-NN | 01 | 1 | A11Y-05 / A11Y-06 (Phase 76 P01 cells preserve) | — | Image-type + image-size + name-too-long cells 1-3 continue to pass post-refactor (TEXT_CELLS loop split by `kind` discriminant) | E2E regression | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` shows 5/5 PASS (3 existing + 2 new) | ✅ existing (will re-run post-changes) | ⬜ pending |
| 81-01-NN | 01 | 2 | Phase 79 anchor preservation (D-14) | — | 3-run cold-start results in 80 + 2 = 82 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE (parity-script update may be required for the +2 PASS_LOCKED additive expansion) | E2E full suite × 3 cold-start | `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean && yarn test:e2e --workers=1` × 3 (per CONTEXT D-13) | ✅ existing 3-command chain | ⬜ pending |
| 81-01-NN | 01 | 2 | Phase 79 parity-script self-identity (D-15) | — | `diff-playwright-reports.ts` self-identity returns empty diff against expected template on cold-start | Smoke (diff against template) | `npx tsx tests/scripts/diff-playwright-reports.ts \| diff <expected-template> -` per CONTEXT D-15 | ✅ existing | ⬜ pending |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> **Planner instruction:** populate the `81-01-NN` IDs with the concrete task IDs from PLAN.md and re-flag File Exists per task. Task-to-row alignment is many-to-one for the 5 application-tier rows (1 task may cover multiple rows) and one-to-one for the 2 phase-gate rows.

---

## Wave 0 Requirements

- [ ] `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` — add `invalidEmail` key to each of the 7 Paraglide locale source files (per RESEARCH §Pitfall 1; **NOT 4 as CONTEXT D-10 indicated** — researcher amended)
- [ ] `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/components.json` — add `invalidEmail` key to each of the 4 legacy translation locale files (per RESEARCH §Pitfall 1 — these are the TranslationKey generator source files; missing → compile error)
- [ ] `apps/frontend/src/lib/types/generated/translationKey.ts` — regenerate via `tsx apps/frontend/tools/translationKey/generateTranslationKeyType.ts` after JSON edits (per RESEARCH §Pitfall 2)
- [ ] `apps/frontend/src/lib/components/input/Input.type.ts` — add `'email'` variant to `InputProps['type']` discriminated union (per CONTEXT D-04; RESEARCH §"Phase 81 InputProps['type'] discriminated union extension")
- [ ] `apps/frontend/src/lib/components/input/Input.svelte` — add `else if (type === 'email')` branch in `handleChange` (per CONTEXT D-05; RESEARCH §"Phase 81 NEW email validation branch") + add `'email'` to `ensureValue()` empty-string list at line 166 (per RESEARCH §"Phase 81 ensureValue empty-string branch extension") + inline `EMAIL_REGEX` constant in `<script>` block
- [ ] `apps/frontend/src/lib/components/input/QuestionInput.svelte` — add 1 new dispatch line at line 65 after the existing `'link' → 'url'` line (per CONTEXT D-04; RESEARCH §"Phase 81 dispatch line")
- [ ] `packages/dev-seed/src/templates/e2e.ts` — retrofit sort-21 with `subtype: 'link'` + add new sort-23 `test-question-email-1` row + add Alpha answer for `test-question-email-1` (plain string `'sentinel-81@example.com'` per Pitfall 4 option a) + migrate Alpha `test-question-social-1` answer from `{ en: '...' }` LocalizedString to plain string (per RESEARCH §Pitfall 4) + update PRODUCT-GAP-PARTIAL comment block at lines 617-620
- [ ] `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — refactor `TEXT_CELLS` loop with `kind` discriminant (HTML5 cap vs error UI) + add 2 new cells (5 email + 6 URL) + update docstring at lines 23-29 to note A11Y-05/A11Y-06 closure
- [ ] `81-VERIFICATION.md` — NEW per Plan 01 close, follows Phase 80 verdict shape (5 SCs assessed + 3-run determinism record + Phase 79 anchor confirmation)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `invalidEmail` localized string renders correctly in 4 default-runtime locales (en/fi/sv/da) — visual verification | A11Y-05 | The 7-Paraglide-locale extension was scoped by RESEARCH §Pitfall 1; spec runs default `en`. Other 3 locales are visually verified. | After Plan 01 wave 1: `yarn db:reset && yarn db:seed --template e2e && yarn dev`, log in as Test Candidate Alpha, navigate to /candidate/profile, type `not-an-email` in the new sort-23 email field, switch locale to fi/sv/da, confirm the error message renders localized (NOT the English fallback or `[components.input.error.invalidEmail]` key marker). |
| `invalidEmail` fallback behavior in et/fr/lb Paraglide locales | A11Y-05 | These locales are experimental Paraglide-only (no spec coverage). Per RESEARCH O-5: visual inspection only, no per-locale E2E. | After Plan 01: visually inspect that the et/fr/lb `components.json` files contain the `invalidEmail` key (even if untranslated, identical to `en`); Paraglide fallback chain handles undefined-locale gracefully. |
| Sort-21 retrofit doesn't perturb Phase 76 P02 reload-persistence anchor | A11Y-06 | The P02 persistence spec lives in candidate-questions.spec.ts:262-300 (CAND-06 / CAND-12); behavior is "value entered + reload + value retained". | After Plan 01: re-run `yarn test:e2e --project=candidate-app-mutation -g "CAND-12"` and confirm PASS post-retrofit (the test should still pass: it fills + saves a fresh URL, then reloads — the bad-URL retrofit dispatch only enforces validation on `handleChange`, not on already-saved valid URLs). |

---

## Validation Sign-Off

- [ ] All Plan 01 tasks have `<automated>` verify or Wave 0 dependencies (populated by planner)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (planner enforces in PLAN.md)
- [ ] Wave 0 covers all MISSING references (the 9 Wave 0 items above)
- [ ] No watch-mode flags (per gates.md — `yarn test:e2e --workers=1` is single-run cold-start, not watch)
- [ ] Feedback latency < 120s for quick A11Y-01 grep run
- [ ] 5 ROADMAP success criteria mapped to ≥ 2 distinct validation signals (E2E + compile gate + manual visual for i18n locales)
- [ ] Phase 79 v2.10 anchor preservation gate scheduled at Plan 01 Wave 2 close
- [ ] Parity-script self-identity smoke (D-15) scheduled at Plan 01 Wave 2 close
- [ ] IMGPROXY_TIED_TITLES safety verified (cells 5 + 6 titles do not collide — confirmed in CONTEXT D-12 + RESEARCH §Pitfall 7)
- [ ] `nyquist_compliant: true` set in frontmatter after planner populates task IDs

**Approval:** pending
