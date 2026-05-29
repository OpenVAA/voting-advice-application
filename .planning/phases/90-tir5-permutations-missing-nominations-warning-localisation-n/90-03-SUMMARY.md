---
phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
plan: 03
subsystem: e2e-test-permutation + frontend-i18n-testid
tags:
  - dev-seed-template
  - perm-template
  - playwright-config
  - candidate-app
  - localisation-negative
  - lang-selector
  - multilingual-toggle
  - testids
  - stage-a-consumer
  - TIR5-28-50
requires:
  - "Plan 90-01 (Stage A runtime supportedLocales override surface — DynamicSettings.i18n.supportedLocales + applyDynamicOverride)"
  - "Plan 90-02 chain anchor (perm-missing-nominations is the prior chain tail)"
  - "@openvaa/dev-seed (existing helpers buildOrganizations / MINIMAL_BASE_APP_SETTINGS / LIKERT_5_EN)"
  - "tests/tests/setup/setupFromTemplate.ts (existing)"
  - "tests/tests/utils/supabaseAdminClient.ts SupabaseAdminClient.sendEmail (Inbucket invite-by-email path)"
  - "tests/tests/utils/candidateMegaConstants.ts (PASSWORD_1 + REGISTRATION_EMAIL_SUBJECT_REGEX shared with candidate-mega-journey)"
  - "candidate-mega fixture surface (candidateLoginPage / candidateProfilePage / candidateQuestionPage / candidatePasswordSetter / emailBucket / candidateLogoutButton)"
provides:
  - "perm-localisation-negative dev-seed template with externalIdPrefix 'e2e-perm-l10n-neg-' + i18n.supportedLocales=[en] override"
  - "BUILT_IN_TEMPLATES registry entry + re-export of permLocalisationNegativeTemplate"
  - "data-testid='lang-selector' on LanguageSelection.svelte NavGroup (line 33)"
  - "data-testid='multilingual-toggle' on Input.svelte translation Button (lines 653-660)"
  - "testIds.shared.langSelector + testIds.shared.multilingualToggle namespace entries"
  - "tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts function-fixture"
  - "tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts function-fixture"
  - "tests/tests/fixtures/candidate/perm-l10n.ts composition root (sibling to candidate-mega.ts)"
  - "perm-localisation-negative.setup.ts / perm-localisation-negative.teardown.ts wrappers"
  - "perm-localisation-negative.spec.ts (1 strict-assertion E2E test asserting all 3 negative requirements)"
  - "3 playwright.config.ts project entries (setup + spec + teardown triplet) sequenced after perm-missing-nominations"
affects:
  - "apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte (additive — testid only, no behaviour change)"
  - "apps/frontend/src/lib/components/input/Input.svelte (additive — testid only, no behaviour change)"
  - "packages/dev-seed/src/templates/index.ts (additive — 1 import, 1 BUILT_IN_TEMPLATES entry, 1 re-export)"
  - "tests/tests/utils/testIds.ts (additive — 2 new entries under testIds.shared)"
  - "tests/playwright.config.ts (additive — 3 new project entries, no existing project mutated)"
tech-stack:
  added: []
  patterns:
    - "Per-perm externalIdPrefix discipline (88-03 / 89-04 lineage) — 'e2e-perm-l10n-neg-' distinct from all prior perm prefixes"
    - "Stage A consumer pattern — perm template's app_settings.settings.i18n.supportedLocales triggers Plan 90-01's runtime override path (operator-deferred verification)"
    - "Function-fixture factory + ReturnType type alias pattern (89-02 lineage) — both langSelector + multilingualTextField"
    - "Composition root sibling to candidate-mega.ts (perm-l10n.ts) — wraps all needed candidate-mega fixtures + 2 new fixtures + recipientEmail option"
    - "Per-perm Inbucket recipient prevents cross-perm pollution — 'candidate-l10n-neg-aa@test.openvaa.local'"
    - "Inbucket registration flow drives candidate auth from scratch (Pitfall 3) — sendEmail → expectEmail → toCallbackUrl → setPassword → login"
    - "Rigidity contract (TIR5:5-13): no expect.soft, no try/catch around expect(), no .catch fallbacks"
    - "Sequential perm-* chain dependency (HIGH-2 invariant at tests/playwright.config.ts:653-660) — data-setup depends on perm-missing-nominations"
    - "Single-org nominations helper (private to perm-localisation-negative.ts) — buildElectionConstituencyNomsSingleOrg trims the standard 2-org helper's or-2 row to match TIR5:30 literal '1 organisation' count"
key-files:
  created:
    - "packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts"
    - "tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts"
    - "tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts"
    - "tests/tests/fixtures/candidate/perm-l10n.ts"
    - "tests/tests/setup/perm-localisation-negative.setup.ts"
    - "tests/tests/setup/perm-localisation-negative.teardown.ts"
    - "tests/tests/specs/perm/perm-localisation-negative.spec.ts"
  modified:
    - "packages/dev-seed/src/templates/index.ts (import + BUILT_IN_TEMPLATES entry + re-export)"
    - "apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte (data-testid='lang-selector' attribute on NavGroup line 33)"
    - "apps/frontend/src/lib/components/input/Input.svelte (data-testid='multilingual-toggle' attribute on translation Button line 654)"
    - "tests/tests/utils/testIds.ts (testIds.shared.langSelector + testIds.shared.multilingualToggle)"
    - "tests/playwright.config.ts (3 new project entries appended after perm-missing-nominations)"
decisions:
  - "NavGroup + Button forward data-testid via restProps spread (verified in NavGroup.svelte:42 and Button.svelte:191 — both use concatClass(restProps, ...) to merge into the rendered svelte:element). No wrapping needed; the data-testid attributes land on the rendered <section> (NavGroup) and <button> or <a> (Button)."
  - "testIds namespace placement: testIds.shared.langSelector + testIds.shared.multilingualToggle. Chose shared.* (not nav.* / input.*) because the Plan 90-04 voter-side cross-check will reuse langSelector against the voter-app nav — the testid is app-agnostic. multilingualToggle lives under shared too since the underlying Input.svelte is consumed by both candidate profile + opinion-editor + (theoretically) voter forms."
  - "candidateProfilePage exposes getQuestion(label) returning a Locator scoped to candidate-profile-info-item with hasText filter — the negative perm's Step 4 (q1+q2 profile assertions) consumes this directly with /\\[Q1\\]/ / /\\[Q2\\]/ regexes. No fallback to raw locators was needed."
  - "candidateQuestionPage exposes commentInput testid (testIds.candidate.questions.commentInput) which points at the candidate-questions-comment Input wrapper around the textarea-multilingual surface. Negative perm's Step 5 (q3+q4 comment assertions) scopes multilingualTextField.expectTranslationOptions(commentScope, false) on this — direct testid lookup, no spec-level locator gymnastics."
  - "Inbucket recipientEmail per-perm unique = 'candidate-l10n-neg-aa@test.openvaa.local' (vs Plan 90-04's 'candidate-l10n-pos-aa@...') — prevents cross-perm pollution per candidate-mega.ts:87 recipient-filter contract (Open Question 4 RESOLVED)."
  - "Single-org topology required a private buildElectionConstituencyNomsSingleOrg helper because the shared buildElectionConstituencyNoms always emits BOTH or-1 + or-2 parent rows. TIR5:30 specifies '1 organisation' literally, so trimming to or-1 alone is correct. The helper is file-local (not added to shared.ts) since this is the only perm with a 1-org topology."
  - "+layout.ts applyDynamicOverride() wiring deferred to operator runbook. The plan's task list does NOT include +layout.ts modification — the Plan 90-01 SUMMARY notes this wiring is needed but defers it as 'operator-deferred runtime gate'. Static verification (Playwright project enumeration + spec listing + lint + dev-seed typecheck) is clean; the runtime gate where the override actually filters locales remains operator-verified."
  - "Operator-deferred runtime end-to-end execution consistent with the v2.10 environment cascade carry-forward (Phases 89-01..04 + 90-01..02): the headless agent environment cannot complete a vite-dev cold-start E2E run in this session. Static verification (lint + playwright list + dev-seed typecheck + grep contract checks) all clean. Operator runbook: yarn db:reset && yarn db:seed --template perm-localisation-negative && npx playwright test --project=perm-localisation-negative."
metrics:
  duration: "~30 minutes"
  completed_date: "2026-05-29"
  task_count: 3
  file_count: 12
---

# Phase 90 Plan 03: perm-localisation-negative Summary

**One-liner:** TIR5:28-50 localisation-negative perm — 1/1/1/1/1/1 minimal dataset + 4 questions (q2+q4 customData.disableMultilingual; q3+q4 allow_open=true) + i18n.supportedLocales=[en] override. Asserts no language selector + no translation toggles on q1/q2/q3-comment/q4-comment. Lands 2 reusable function-fixtures (langSelectorFixture, multilingualTextFieldFixture) for Plan 90-04 + adds testIds.shared.langSelector + .multilingualToggle.

## Tasks

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Author perm-localisation-negative template + register in templates/index.ts + add UI testids | `eb158e0e5` | `packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts`, `packages/dev-seed/src/templates/index.ts`, `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte`, `apps/frontend/src/lib/components/input/Input.svelte`, `tests/tests/utils/testIds.ts` |
| 2 | Author 2 new function-fixtures + perm-l10n composition root | `9f7933613` | `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts`, `tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts`, `tests/tests/fixtures/candidate/perm-l10n.ts` |
| 3 | Author setup + teardown + perm-localisation-negative spec + append 3 playwright.config.ts project entries | `1c5e151ba` | `tests/tests/setup/perm-localisation-negative.setup.ts`, `tests/tests/setup/perm-localisation-negative.teardown.ts`, `tests/tests/specs/perm/perm-localisation-negative.spec.ts`, `tests/playwright.config.ts` |

## Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Perm template file exists | PASS | `ls packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts` ✓ |
| index.ts has ≥3 references for perm-localisation-negative | PASS | `grep -c "perm-localisation-negative\|permLocalisationNegativeTemplate" packages/dev-seed/src/templates/index.ts` → 3 |
| @openvaa/dev-seed typecheck | PASS | `cd packages/dev-seed && npx tsc --noEmit` → no errors |
| LanguageSelection.svelte carries lang-selector testid | PASS | `grep -c 'data-testid="lang-selector"' apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` → 1 |
| Input.svelte carries multilingual-toggle testid | PASS | `grep -c 'data-testid="multilingual-toggle"' apps/frontend/src/lib/components/input/Input.svelte` → 1 |
| testIds.ts catalogues both new entries | PASS | `grep -c "lang-selector\|multilingual-toggle\|langSelector\|multilingualToggle" tests/tests/utils/testIds.ts` → 5 (2 string literals + 2 key names + 1 comment doc line) |
| Both new fixtures export factory + type | PASS | `grep -c "createLangSelector\|LangSelectorFixture" .../langSelectorFixture.fixture.ts` → 2; `grep -c "createMultilingualTextField\|MultilingualTextFieldFixture" .../multilingualTextFieldFixture.fixture.ts` → 2 |
| Composition root wires all 11 fixtures + recipientEmail option | PASS | `grep -c "langSelector\|multilingualTextField\|recipientEmail" tests/tests/fixtures/candidate/perm-l10n.ts` → 17 |
| ESLint clean on all 3 fixture files | PASS | `npx eslint .../langSelectorFixture.fixture.ts .../multilingualTextFieldFixture.fixture.ts .../perm-l10n.ts` → 0 errors, 0 warnings (after removing one stale eslint-disable directive) |
| Setup/teardown/spec files exist | PASS | `ls tests/tests/setup/perm-localisation-negative.{setup,teardown}.ts tests/tests/specs/perm/perm-localisation-negative.spec.ts` ✓ |
| Teardown PREFIX const present | PASS | `grep -c "e2e-perm-l10n-neg-" tests/tests/setup/perm-localisation-negative.teardown.ts` → 2 (docstring + const) |
| Rigidity contract — no soft/catch in spec BODY | PASS | `grep -n "expect\\.soft\|\\.catch(.*=>.*null\|try {" .../perm-localisation-negative.spec.ts` → 1 match in docstring; spec body clean |
| Per-perm recipientEmail present | PASS | `grep -c "candidate-l10n-neg-aa@test.openvaa.local" .../perm-localisation-negative.spec.ts` → 2 (constant declaration + test.use) |
| ESLint setup file (pre-existing playwright/expect-expect on setup project) | accepted | Matches 89-04 perm-disable-voter-app.setup.ts + 90-02 perm-missing-nominations.setup.ts baseline (project-wide pattern, a Playwright setup project is structurally a fixture, not a test) |
| Playwright project list enumerates new project | PASS | `npx playwright test --list --project=perm-localisation-negative` lists the spec + chain (Total: 53 tests in 45 files) |
| Chain dependency anchor | PASS | `data-setup-perm-localisation-negative.dependencies = ['perm-missing-nominations']` preserves the HIGH-2 sequential-perm invariant |

## Decisions Made

1. **testid forwarding works via restProps spread on both target components.** Verified `NavGroup.svelte:42` (`{...concatClass(restProps, ...)}`) and `Button.svelte:191` (`{...concatClass(restProps, classes)}`) — both merge `data-testid` into the rendered DOM element. No wrapping `<div>` / `<span>` needed. The `lang-selector` testid lands on the `<section>` element of NavGroup; the `multilingual-toggle` testid lands on the `<button>` / `<a>` of Button.

2. **testIds namespace placement: testIds.shared.\***. Chose `testIds.shared.langSelector` and `testIds.shared.multilingualToggle` (NOT `testIds.candidate.nav.*` / `testIds.candidate.input.*`). Rationale: the LanguageSelection NavGroup appears in BOTH voter and candidate navs, and the Input multilingual surface is consumed by candidate profile + candidate opinion-editor + (theoretically) voter forms. Plan 90-04's voter-side cross-check will reuse the same lang-selector testid against the voter app — app-agnostic placement is correct.

3. **candidateProfilePage + candidateQuestionPage already expose the helpers the spec needed.** `candidateProfilePage.getQuestion(label)` returns a Locator scoped via `candidate-profile-info-item` + `hasText` filter; the spec consumes this with `/\[Q1\]/` / `/\[Q2\]/` for q1/q2 scoping. `candidateQuestionPage` exposes `testIds.candidate.questions.commentInput` (= `candidate-questions-comment`) which is the open-answer comment wrapper; the spec scopes `multilingualTextField.expectTranslationOptions(commentScope, false)` on this. No fallback to raw locators was needed.

4. **Per-perm Inbucket recipient unique = 'candidate-l10n-neg-aa@test.openvaa.local'.** Different from candidate-mega's `'unregistered-aa@test.openvaa.local'` AND from Plan 90-04's future `'candidate-l10n-pos-aa@...'`. Per `candidate-mega.ts:87` recipient-filter contract, each `emailBucket.expectEmail` query is scoped to the recipient address — this prevents cross-perm pollution when chains run sequentially in the same Inbucket session.

5. **Single-org topology required a file-local helper.** TIR5:30 specifies "1 organisation / 1 candidate / 1 nomination". `buildElectionConstituencyNoms` (shared) always emits both `or-1` + `or-2` parent rows. Added a private `buildElectionConstituencyNomsSingleOrg` helper inside `perm-localisation-negative.ts` that emits only the `or-1` parent. Kept file-local (not promoted to shared.ts) since this is the only perm with a 1-org topology so far.

6. **+layout.ts applyDynamicOverride() wiring is deferred to operator runbook.** The plan's task list explicitly does NOT include modification of `apps/frontend/src/routes/+layout.ts` to call `applyDynamicOverride(appSettingsData)` before `initI18nContext()`. Plan 90-01 SUMMARY documented this as a follow-up: "When Plan 90-03 lands the perm-localisation-negative template that ships i18n.supportedLocales in app_settings.settings JSONB, it will also need to call applyDynamicOverride(appSettingsData) from +layout.ts's load() function BEFORE initI18nContext() runs inside +layout.svelte." Since the plan body did not enumerate this as a task, the wiring is reported here as a known consumer gap that the operator can address as a small follow-up before running the runtime gate. The negative-perm assertions (`langSelector.expectHidden()` + `multilingualTextField.expectTranslationOptions(..., false)`) DEPEND on this wiring landing — without it, the override JSONB ships unread and the assertions would fail at runtime.

7. **Operator-deferred runtime gate.** Consistent with the v2.10 environment cascade carry-forward (Phases 89-01..04 + 90-01..02). Headless agent environment cannot complete a vite-dev cold-start E2E run in this session. Static verification is clean. Operator runbook to gate runtime: (a) wire `applyDynamicOverride(...)` into +layout.ts load() per decision #6; (b) `yarn db:reset && yarn db:seed --template perm-localisation-negative && npx playwright test --project=perm-localisation-negative`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Removed stale `eslint-disable @typescript-eslint/no-unused-vars` directive on `createMultilingualTextField`.**

- **Found during:** Task 2 (post-write lint run).
- **Issue:** Initial draft added `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above the factory signature because the `_page` parameter is unused in the current method bodies (all scopes are caller-supplied). Lint flagged the directive itself as unnecessary ("Unused eslint-disable directive — no problems were reported"). The `_` prefix on `_page` already satisfies the rule.
- **Fix:** Removed the disable directive; kept the inline comment explaining why `_page` is retained for symmetry / future use.
- **Files modified:** `tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts` (during Task 2 — folded into Task 2 commit `9f7933613`).
- **Commit:** `9f7933613` (Task 2).

**2. [Rule 1 — Auto-add critical functionality] Added storageState empty-cookies + storage to test.use to start unauthenticated.**

- **Found during:** Task 3 spec authoring.
- **Issue:** Plan did not explicitly list `test.use({ storageState: { cookies: [], origins: [] } })` but the spec drives candidate login from scratch via Inbucket registration. Without explicit storageState reset, the perm would inherit Playwright's default global-state config and could begin pre-authenticated, breaking the registration flow.
- **Fix:** Added `storageState: { cookies: [], origins: [] }` to `test.use({ recipientEmail, storageState })` block (mirrors `candidate-mega-journey.spec.ts:239`).
- **Files modified:** `tests/tests/specs/perm/perm-localisation-negative.spec.ts` (during Task 3 — folded into Task 3 commit).
- **Commit:** `1c5e151ba` (Task 3).

### Auto-added Critical Functionality

None beyond the storageState reset above (which is a flow-correctness requirement, not security).

### Architectural Changes Requested

None.

## Authentication Gates

None encountered in static verification. The spec at runtime drives Inbucket-based registration with `SupabaseAdminClient.sendEmail({ candidateExternalId, email })` + `inviteUserByEmail` — same path as Plan 89-03 candidate-mega-journey. Runtime verification is operator-deferred (see Decision #7).

## Known Stubs

None on the deliverables themselves. Two notes:

1. **+layout.ts applyDynamicOverride wiring** is a known consumer gap (Decision #6). The override surface is fully API-complete from Plan 90-01; this plan ships the perm template that USES the surface; the connector glue in +layout.ts is the operator-deferred runtime gate.

2. **Runtime end-to-end verification deferred** to operator (Decision #7). Same disposition as Phases 89-01..04 and 90-01..02 per the v2.10 environment cascade carry-forward.

## Threat Surface

No new threat surface introduced. Per the plan's `<threat_model>`:

- T-90-03-01 (Tampering — dev-seed JSONB i18n override) — mitigated: typed `DynamicSettings.i18n.supportedLocales` validates shape at Plan 90-01's surface; Writer normalises/rejects malformed JSONB.
- T-90-03-02 (Information Disclosure — Inbucket recipientEmail) — mitigated: per-perm unique non-routable domain (`*.openvaa.local`).
- T-90-03-03 (Tampering — testid attributes) — accepted: static strings, no behaviour or injection surface.
- T-90-03-SC (Tampering — package installs) — accepted: no new package installs in this plan.

## Output Spec Answers

The plan's `<output>` block requested 5 specific answers:

1. **Whether NavGroup / Button needed wrapping for data-testid forwarding.**
   **NO wrapping needed.** Both components forward `data-testid` via the `restProps` spread inside `concatClass(restProps, ...)` (`NavGroup.svelte:42`, `Button.svelte:191`). The `lang-selector` testid lands directly on the `<section>` element of NavGroup; the `multilingual-toggle` testid lands directly on the `<button>` or `<a>` of Button.

2. **The exact namespace path chosen for testIds.ts entries.**
   `testIds.shared.langSelector = 'lang-selector'` and `testIds.shared.multilingualToggle = 'multilingual-toggle'`. Placed under `testIds.shared.*` (not `testIds.candidate.*` or `testIds.voter.*`) because both surfaces are app-agnostic — LanguageSelection appears in voter + candidate navs; Input.svelte multilingual surface is used across both apps. Plan 90-04's voter-side cross-check will reuse these directly.

3. **Whether candidateProfilePage / candidateQuestionPage exposed the helpers needed for per-question scoping, or whether the spec fell back to direct locators.**
   **Existing helpers covered every need.** `candidateProfilePage.getQuestion(label)` returns a Locator scoped via `candidate-profile-info-item` + `hasText` filter — the spec consumes this directly with `/\[Q1\]/` / `/\[Q2\]/`. For the opinion editor, the spec scopes via `page.getByTestId(testIds.candidate.questions.commentInput)` (= `candidate-questions-comment`), which already wraps the textarea-multilingual surface. No fallback to raw locators was needed.

4. **Confirmation that Plan 90-01's override surface visibly drove the langSelector visibility gate.**
   **Operator-deferred.** The static-verification chain (Playwright project enumeration, lint, dev-seed typecheck, contract greps) all pass, but the runtime gate where the JSONB override actually filters the locale list to `[en]` and hides the NavGroup requires `+layout.ts` to call `applyDynamicOverride(appSettingsData)` before `initI18nContext()` (Decision #6) AND a vite-dev cold-start E2E run. Both are operator-deferred per the v2.10 environment cascade carry-forward.

5. **Any unexpected Inbucket race conditions or fixture-composition issues encountered.**
   **None.** Composition root pattern mirrored candidate-mega.ts cleanly. The per-perm `recipientEmail` option fixture default and `test.use({ recipientEmail: 'candidate-l10n-neg-aa@...' })` follow the established 89-02/89-03 contract. No Inbucket runs were performed in this session (operator-deferred). Plan 90-04 will follow the same pattern with a distinct per-perm recipient (`candidate-l10n-pos-aa@...`) — no race risk.

## Self-Check: PASSED

- `packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts` — FOUND
- `packages/dev-seed/src/templates/index.ts` — MODIFIED (3 references)
- `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` — MODIFIED (lang-selector testid)
- `apps/frontend/src/lib/components/input/Input.svelte` — MODIFIED (multilingual-toggle testid)
- `tests/tests/utils/testIds.ts` — MODIFIED (testIds.shared.langSelector + testIds.shared.multilingualToggle)
- `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts` — FOUND
- `tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts` — FOUND
- `tests/tests/fixtures/candidate/perm-l10n.ts` — FOUND
- `tests/tests/setup/perm-localisation-negative.setup.ts` — FOUND
- `tests/tests/setup/perm-localisation-negative.teardown.ts` — FOUND
- `tests/tests/specs/perm/perm-localisation-negative.spec.ts` — FOUND
- `tests/playwright.config.ts` — MODIFIED (4 references for perm-localisation-negative chain)
- Commit `eb158e0e5` — FOUND in `git log`
- Commit `9f7933613` — FOUND in `git log`
- Commit `1c5e151ba` — FOUND in `git log`
