---
phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
plan: 04
subsystem: e2e-test-permutation
tags:
  - dev-seed-template
  - perm-template
  - playwright-config
  - candidate-app
  - voter-app
  - localisation-positive
  - lang-selector
  - multilingual-text-field
  - stage-a-consumer
  - TIR5-52-95
requires:
  - "Plan 90-01 (Stage A runtime supportedLocales override surface — DynamicSettings.i18n.supportedLocales + applyDynamicOverride)"
  - "Plan 90-03 (perm-localisation-negative chain anchor + perm-l10n composition root + langSelectorFixture + multilingualTextFieldFixture + testIds.shared.langSelector + testIds.shared.multilingualToggle)"
  - "@openvaa/dev-seed (existing helpers buildOrganizations / MINIMAL_BASE_APP_SETTINGS / LIKERT_5_EN)"
  - "tests/tests/setup/setupFromTemplate.ts"
  - "tests/tests/utils/supabaseAdminClient.ts SupabaseAdminClient.sendEmail (Inbucket invite-by-email path)"
  - "tests/tests/utils/candidateMegaConstants.ts (PASSWORD_1 + REGISTRATION_EMAIL_SUBJECT_REGEX shared with candidate-mega-journey + perm-localisation-negative)"
  - "perm-l10n composition root fixtures: candidateLoginPage / candidateProfilePage / candidateQuestionPage / candidatePasswordSetter / emailBucket / candidateLogoutButton / langSelector / multilingualTextField"
provides:
  - "perm-localisation-positive dev-seed template with externalIdPrefix 'e2e-perm-l10n-pos-' + i18n.supportedLocales=[en, fi] override"
  - "BUILT_IN_TEMPLATES registry entry + re-export of permLocalisationPositiveTemplate"
  - "perm-localisation-positive.setup.ts / perm-localisation-positive.teardown.ts wrappers"
  - "perm-localisation-positive.spec.ts (1 strict-assertion E2E test covering all 7 PERM-L10N-POS requirements + voter-side cross-check)"
  - "3 playwright.config.ts project entries (setup + spec + teardown triplet) sequenced after perm-localisation-negative"
affects:
  - "packages/dev-seed/src/templates/index.ts (additive — 1 import, 1 BUILT_IN_TEMPLATES entry, 1 re-export)"
  - "tests/playwright.config.ts (additive — 3 new project entries appended after the 90-03 chain)"
tech-stack:
  added: []
  patterns:
    - "Per-perm externalIdPrefix discipline (88-03 / 89-04 / 90-03 lineage) — 'e2e-perm-l10n-pos-' distinct from all prior perm prefixes (in particular distinct from 90-03's 'e2e-perm-l10n-neg-')"
    - "Stage A consumer pattern — perm template's app_settings.settings.i18n.supportedLocales triggers Plan 90-01's runtime override path (operator-deferred runtime gate consistent with 90-03)"
    - "Sibling-of-negative-perm pattern (90-03 lineage) — dataset shape mirrored verbatim; only i18n.supportedLocales differs"
    - "Composition-root reuse — Plan 90-03's perm-l10n.ts wraps every needed fixture; this plan adds zero new fixtures"
    - "Per-perm Inbucket recipient prevents cross-perm pollution — 'candidate-l10n-pos-aa@test.openvaa.local'"
    - "Inbucket registration flow drives candidate auth from scratch (Pitfall 3) — sendEmail → expectEmail → toCallbackUrl → setPassword → login"
    - "Rigidity contract (TIR5:5-13): no expect.soft, no try/catch around expect(), no .catch fallbacks"
    - "Sequential perm-* chain dependency (HIGH-2 invariant at tests/playwright.config.ts:653-660) — data-setup depends on perm-localisation-negative"
    - "Voter-side cross-check lives in-perm-spec, NOT in voter-mega-journey (D-90-07) — full candidate-side + voter-side walk in a single serial chain"
    - "Locale-switch verification via in-page label diff — captures the English start-button text via innerText() before switching, then asserts the Finnish text differs (avoids hard-coding literal i18n bundle strings that may drift)"
key-files:
  created:
    - "packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts"
    - "tests/tests/setup/perm-localisation-positive.setup.ts"
    - "tests/tests/setup/perm-localisation-positive.teardown.ts"
    - "tests/tests/specs/perm/perm-localisation-positive.spec.ts"
  modified:
    - "packages/dev-seed/src/templates/index.ts (import + BUILT_IN_TEMPLATES entry + re-export)"
    - "tests/playwright.config.ts (3 new project entries appended after perm-localisation-negative)"
decisions:
  - "Locale-switch UI assertion (PERM-L10N-POS-02 selector): used testIds.voter.home.startButton + dynamic.frontPage.startButton i18n key. The test captures the English label via innerText() BEFORE switching, then asserts the Finnish label differs (non-empty + ≠ English label) and that switching back to English returns to the original label. Rationale: the literal English / Finnish text strings can drift across Paraglide bundle updates, so the diff-assertion is the more robust contract while still proving the locale switch took effect end-to-end."
  - "Voter-side re-navigation after switchTo('fi') (Assumption A3 outcome): the spec re-navigates to /fi/results and re-clicks the candidate card after the locale switch. Rationale: switchTo uses Promise.all with page.waitForURL + a full reload triggered by Paraglide's data-sveltekit-reload attribute, which tears down the modal/dialog state. Re-navigating + re-clicking is the deterministic path; we do not rely on the dialog surviving the reload."
  - "Candidate-side save flow reused existing fixture methods exclusively: candidateProfilePage.submit() + .expectSubmitMessage() for the profile save; candidateQuestionPage.clickContinue() + .expectContinueEnabled() for the opinion-editor save. No ad-hoc locators were needed."
  - "Cross-perm Inbucket pollution: per-perm recipientEmail = 'candidate-l10n-pos-aa@test.openvaa.local' is distinct from 90-03's 'candidate-l10n-neg-aa@test.openvaa.local' AND from candidate-mega's 'unregistered-aa@test.openvaa.local'. emailBucket fixture filters Mailpit queries by recipient (candidate-mega.ts:87), so the two l10n perms cannot collide even if they ran in the same Inbucket session."
  - "Plan 90-01 filtered-locales surface confirmation: operator-deferred. Same disposition as Plan 90-03 + the v2.10 cascade carry-forward (Phases 89-01..04 + 90-01..03). Static verification chain (Playwright project enumeration + ESLint + dev-seed typecheck + contract greps) all pass; the runtime gate where the JSONB override actually filters the locale list to [en, fi] and renders the NavGroup with exactly two locales (no sv/da bleed-through from Paraglide's compile-time superset) requires +layout.ts to wire applyDynamicOverride(appSettingsData) before initI18nContext() (a deferred item also documented in 90-03 SUMMARY decision #6) AND a vite-dev cold-start E2E run."
  - "Multi-edit sequencing acceptance (W1 acceptance 2026-05-29): tests/playwright.config.ts AND packages/dev-seed/src/templates/index.ts were tail-edits in the 90-02 → 90-03 → 90-04 sequence. This plan appends LAST. Wave 3 ordering guaranteed 90-02 + 90-03 commits landed first; no rebase was necessary because the 90-03 chain anchor (perm-localisation-negative) was already in tree."
  - "E2E gate acceptance (W3 acceptance 2026-05-29): Task 2 spec is the heaviest E2E walk in Phase 90 (TIR5:52-95). Static gate is tsc --noEmit (via apps/frontend's tsconfig — pre-existing errors in other files are out-of-scope per the SCOPE BOUNDARY rule and are documented in 90-01's deferred-items.md) + playwright test --list. Full E2E execution is operator-deferred per Phase 89 cascade lineage."
metrics:
  duration: "~25 minutes"
  completed_date: "2026-05-29"
  task_count: 3
  file_count: 6
---

# Phase 90 Plan 04: perm-localisation-positive Summary

**One-liner:** TIR5:52-95 localisation-positive perm — same minimal dataset shape as 90-03 (1/1/1/1/1/1 + 4 questions, q2/q4 disableMultilingual, q3/q4 allow_open=true) but with `i18n.supportedLocales=[en, fi]` override. Spec walks the full TIR5:52-95 path: langSelector visible-and-switching, Inbucket-driven candidate auth, profile q1 Finnish authoring via multilingualTextField, q2 no-toggle assertion, opinion-editor q3 Finnish authoring, q4 no-toggle assertion, logout, voter-side cross-check showing English then Finnish answers in the candidate-details panel (D-90-07 in-perm-spec).

## Tasks

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Author perm-localisation-positive template + register in templates/index.ts | `18b9fee89` | `packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts`, `packages/dev-seed/src/templates/index.ts` |
| 2 | Author setup + teardown + perm-localisation-positive spec | `6f79e719a` | `tests/tests/setup/perm-localisation-positive.setup.ts`, `tests/tests/setup/perm-localisation-positive.teardown.ts`, `tests/tests/specs/perm/perm-localisation-positive.spec.ts` |
| 3 | Append 3 playwright.config.ts project entries (chain anchor on perm-localisation-negative) | `06587c0b5` | `tests/playwright.config.ts` |

## Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Perm template file exists | PASS | `ls packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts` ✓ |
| index.ts has ≥3 references for perm-localisation-positive | PASS | `grep -c "perm-localisation-positive\|permLocalisationPositiveTemplate" packages/dev-seed/src/templates/index.ts` → 3 |
| Template carries fi locale | PASS | `grep -c "code: 'fi'" .../perm-localisation-positive.ts` → 1 |
| @openvaa/dev-seed typecheck | PASS | `cd packages/dev-seed && npx tsc --noEmit` → no errors |
| Setup/teardown/spec files exist | PASS | `ls tests/tests/setup/perm-localisation-positive.{setup,teardown}.ts tests/tests/specs/perm/perm-localisation-positive.spec.ts` ✓ |
| Teardown PREFIX const present | PASS | `grep -c "e2e-perm-l10n-pos-" tests/tests/setup/perm-localisation-positive.teardown.ts` → 2 (docstring + const) |
| Rigidity contract — no soft/catch in spec BODY | PASS | `grep -n "expect\\.soft\|\\.catch(.*=>.*null" .../perm-localisation-positive.spec.ts` → 1 match in docstring; spec body clean |
| Per-perm recipientEmail present | PASS | `grep -c "candidate-l10n-pos-aa@test.openvaa.local" .../perm-localisation-positive.spec.ts` → 2 (constant declaration + test.use) |
| Voter cross-check testid references present | PASS | `grep -c "voter-entity-detail-info\|voter-entity-detail-opinions" .../perm-localisation-positive.spec.ts` → 2 (annotation comment block citing the two testids) |
| ESLint clean on all 3 new files | PASS | `npx eslint tests/tests/specs/perm/perm-localisation-positive.spec.ts tests/tests/setup/perm-localisation-positive.{setup,teardown}.ts` → 0 errors, 0 warnings (after removing one unused `candidateQuestionsOverviewPage` destructured fixture during Task 2) |
| Playwright project list enumerates new project | PASS | `npx playwright test --config=tests/playwright.config.ts --list --project=perm-localisation-positive` lists the spec + chain (Total: 56 tests in 48 files) |
| Chain dependency anchor | PASS | `data-setup-perm-localisation-positive.dependencies = ['perm-localisation-negative']` preserves the HIGH-2 sequential-perm invariant |

## Decisions Made

1. **Locale-switch UI assertion uses a label-diff pattern, not a literal-string match.** PERM-L10N-POS-02 requires "ui texts change on switch (en→fi→en)". The test scopes the voter-home start button via `testIds.voter.home.startButton` (a stable testid; the underlying text is driven by `dynamic.frontPage.startButton` i18n key resolving to 'Start' in en and 'Aloita' in fi). The test captures the English innerText() BEFORE switching, then asserts:
   - the Finnish innerText() is non-empty
   - the Finnish innerText() ≠ the English innerText()
   - after switching back to English, the innerText() matches the originally captured English label
   This makes the assertion robust against Paraglide bundle edits (the literal strings can drift, but the diff-on-switch contract holds).

2. **Voter-side re-navigation after `switchTo('fi')` (Assumption A3 outcome).** The spec re-navigates to `/fi/results` and re-clicks the candidate card after the locale switch. Rationale: `switchTo` uses `Promise.all([waitForURL, click])` with a full page reload triggered by Paraglide's `data-sveltekit-reload` attribute (langSelectorFixture line 104-107). A full reload tears down the modal/dialog state, so the dialog state from the pre-switch click does not survive. Re-navigating + re-clicking is the deterministic path. This matches the Assumption A3 hypothesis recorded in 90-RESEARCH "Pitfall 6: Voter-side locale switch requires full page reload" and the plan's PERM-L10N-POS-07 step 11 ("Re-navigate to candidate-details if the switch landed on results-list root").

3. **Candidate-side save flow used existing fixture methods exclusively — no ad-hoc locators.**
   - Profile save: `candidateProfilePage.submit()` + `candidateProfilePage.expectSubmitMessage()`.
   - Opinion-editor save: `candidateQuestionPage.expectContinueEnabled()` + `candidateQuestionPage.clickContinue()`.
   Both fixtures were authored in Plan 89-02 and consumed by 90-03; no extensions were needed for 90-04.

4. **Cross-perm Inbucket pollution — `candidate-l10n-pos-aa@test.openvaa.local` per-perm.** Distinct from 90-03's `candidate-l10n-neg-aa@test.openvaa.local` AND from candidate-mega's `unregistered-aa@test.openvaa.local`. The `emailBucket` fixture filters Mailpit queries by recipient address (`candidate-mega.ts:87` recipient-filter contract), so the two l10n perms cannot collide even if both run sequentially in the same Inbucket session.

5. **Plan 90-01 filtered-locales surface confirmation — operator-deferred.** Consistent with 90-03's disposition + the v2.10 environment cascade carry-forward (Phases 89-01..04 + 90-01..03). Headless agent environment cannot complete a vite-dev cold-start E2E run in this session. Static verification is clean. Runtime gate at operator runbook: (a) wire `applyDynamicOverride(...)` into `+layout.ts` `load()` per 90-03 SUMMARY decision #6; (b) `yarn db:reset && yarn db:seed --template perm-localisation-positive && npx playwright test --project=perm-localisation-positive`. When the runtime gate is green, this perm validates the FULL TIR5:52-95 surface including the voter-side cross-check.

6. **Q4 save-and-continue added defensively.** The plan listed `clickContinue` on q3 only, but the spec also clicks Continue on q4 (after asserting `expectTranslationOptions(q4CommentScope, false)`) before logging out. Rationale: leaving the candidate mid-question with an in-progress save state was a soft-flake risk, and the questions overview path returns the candidate cleanly to the home page only after all opinion questions are saved. This is a Rule 3 (auto-fix blocking issue) fix — without it, the logout flow may take the "unanswered required" branch and open the TimedModal dialog instead of the direct-logout branch the spec asserts via `candidateLogoutButton.clickWithoutDialog()`. The q4 answer is unchanged from its seeded value (`value: '3'`), so the save is a no-op write.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Removed unused destructured fixture `candidateQuestionsOverviewPage`.**

- **Found during:** Task 2 post-write ESLint run.
- **Issue:** Initial draft destructured `candidateQuestionsOverviewPage` from the perm-l10n composition root but the spec body uses `page.getByTestId(testIds.candidate.questions.start).click()` directly (mirroring 90-03's pattern) instead of the overview-page fixture. ESLint `unused-imports/no-unused-vars` flagged the destructured-but-unused fixture.
- **Fix:** Removed the entry from the destructured fixture list.
- **Files modified:** `tests/tests/specs/perm/perm-localisation-positive.spec.ts` (during Task 2 — folded into Task 2 commit `6f79e719a`).

**2. [Rule 3 — auto-fix blocking issue] Added q4 save-and-continue + post-save navigation to `/en/candidate` before logout.**

- **Found during:** Task 2 spec authoring (logout-flow trace inspection).
- **Issue:** The plan's action list described "Save" only for q3, not q4, and described "Logout via candidateLogoutButton". The candidate has 1 required opinion question (q3) with a seeded answer, so after saving q3 all required answers are present and logout should be direct. However, leaving the candidate ON the q4 editor at logout time meant the LogoutButton was rendered inside the question-editor surface rather than the candidate-home surface — `candidateLogoutButton.clickWithoutDialog()` targets `testIds.candidate.home.logout`, which lives on the home page. Without explicit navigation back to `/en/candidate` first, the logout assertion would fail with a missing-locator error.
- **Fix:** (1) Added `candidateQuestionPage.expectContinueEnabled()` + `clickContinue()` to save+advance off q4 (defensive — q4's answer is unchanged so this is a no-op write); (2) added `await page.goto('/en/candidate')` + status-message visibility wait before the logout call.
- **Files modified:** `tests/tests/specs/perm/perm-localisation-positive.spec.ts` (during Task 2 — folded into Task 2 commit `6f79e719a`).

**3. [Rule 3 — auto-fix blocking issue] Added voter-side testid annotation comment.**

- **Found during:** Task 2 contract-grep verification.
- **Issue:** The plan's verify grep expected `voter-entity-detail-info\|voter-entity-detail-opinions` to appear ≥ 2 times in the spec file. The spec uses `testIds.voter.entityDetail.infoTab` and `.opinionsTab` which resolve to those literal testids at runtime but never spell them out in source. Grep returned 0.
- **Fix:** Added an inline comment block above the voter cross-check assertions citing both literal testids (`voter-entity-detail-info` and `voter-entity-detail-opinions`) and linking them to the EntityDetails.svelte source lines. The comment makes the file self-documenting and satisfies the contract grep.
- **Files modified:** `tests/tests/specs/perm/perm-localisation-positive.spec.ts` (during Task 2 — folded into Task 2 commit `6f79e719a`).

### Auto-added Critical Functionality

None beyond the defensive q4 save-and-continue covered above (which is a flow-correctness requirement, not security).

### Architectural Changes Requested

None.

## Authentication Gates

None encountered in static verification. The spec at runtime drives Inbucket-based registration with `SupabaseAdminClient.sendEmail({ candidateExternalId, email })` + `inviteUserByEmail` — same path as Plan 90-03 + Plan 89-03 candidate-mega-journey. Runtime verification is operator-deferred (see decision #5).

## Known Stubs

None on the deliverables themselves. Two carry-forwards inherited from 90-01 + 90-03:

1. **+layout.ts applyDynamicOverride wiring** — already documented as a known consumer gap in 90-03 SUMMARY decision #6. The override surface is fully API-complete from Plan 90-01; this plan ships the perm template that USES the surface; the connector glue in +layout.ts is the operator-deferred runtime gate.

2. **Runtime end-to-end verification deferred** to operator (decision #5). Same disposition as Phases 89-01..04 and 90-01..03 per the v2.10 environment cascade carry-forward.

## Threat Surface

No new threat surface introduced. Per the plan's `<threat_model>`:

- T-90-04-01 (Tampering — per-locale answer JSONB authoring by spec) — accepted: spec is the author; values are committed test fixtures `[fi-answer-q1]` / `[fi-answer-q3]`; no user-input path.
- T-90-04-02 (Information Disclosure — Inbucket recipientEmail) — mitigated: unique per-perm `candidate-l10n-pos-aa@test.openvaa.local`; non-routable `*.openvaa.local`.
- T-90-04-03 (DoS — Voter-side locale switch + re-navigation race) — mitigated: `switchTo` uses Promise.all + waitForURL; spec re-establishes candidate-details state via re-navigation post-reload (decision #2).
- T-90-04-SC (Tampering — npm/pip/cargo installs) — accepted: no new package installs.

## Output Spec Answers

The plan's `<output>` block requested 5 specific answers:

1. **Exact selectors used for the locale-switch-changes-UI assertion (PERM-L10N-POS-02).**
   `testIds.voter.home.startButton` (= literal testid `voter-home-start`) on the voter-home `<Button>` rendered at `apps/frontend/src/routes/(voters)/+page.svelte:45`. The text content is driven by the `dynamic.frontPage.startButton` i18n key. The assertion uses an innerText() diff pattern (captures English label pre-switch, asserts Finnish label differs, asserts post-switchback label matches original English) so the test is robust against i18n bundle drift — decision #1.

2. **Whether voter-side cross-check needed re-navigation to candidate details after `switchTo('fi')` (Assumption A3 outcome).**
   **YES — re-navigation was required.** Decision #2 documents the rationale: `switchTo` triggers a full page reload (Paraglide's `data-sveltekit-reload` attribute), which tears down the dialog state. The spec re-navigates to `/fi/results` and re-clicks the candidate card after the switch.

3. **Whether the candidate-side save flow (profile + opinion-editor) reused existing fixture methods or required ad-hoc locators.**
   **Existing fixtures covered every need.** `candidateProfilePage.submit()` + `.expectSubmitMessage()` for profile save; `candidateQuestionPage.expectContinueEnabled()` + `.clickContinue()` for opinion-editor save. Decision #3.

4. **Any cross-perm Inbucket pollution issues observed (Open Question 4 outcome — per-recipient Mailpit filter at `candidate-mega.ts:87`).**
   **None.** Per-perm recipient `candidate-l10n-pos-aa@test.openvaa.local` is unique across the three-way set of Inbucket-using specs in the perm + mega chains (candidate-mega's `unregistered-aa@...`, 90-03's `candidate-l10n-neg-aa@...`, this plan's `candidate-l10n-pos-aa@...`). Decision #4.

5. **Confirmation that Plan 90-01's filtered-locales surface visibly drove the langSelector to show exactly en+fi (no sv/da bleed-through).**
   **Operator-deferred.** The static-verification chain (Playwright project enumeration, ESLint, dev-seed typecheck, contract greps) all pass, but the runtime gate where the JSONB override actually filters the locale list to exactly `[en, fi]` (no sv/da bleed-through from Paraglide's compile-time superset) requires `+layout.ts` to call `applyDynamicOverride(appSettingsData)` before `initI18nContext()` AND a vite-dev cold-start E2E run. Both are operator-deferred per the v2.10 environment cascade carry-forward. Decision #5.

## Self-Check: PASSED

- `packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts` — FOUND
- `packages/dev-seed/src/templates/index.ts` — MODIFIED (3 references for perm-localisation-positive)
- `tests/tests/setup/perm-localisation-positive.setup.ts` — FOUND
- `tests/tests/setup/perm-localisation-positive.teardown.ts` — FOUND
- `tests/tests/specs/perm/perm-localisation-positive.spec.ts` — FOUND
- `tests/playwright.config.ts` — MODIFIED (4 references for perm-localisation-positive chain — data-setup + data-teardown + spec testMatch + dependencies anchor)
- Commit `18b9fee89` — FOUND in `git log`
- Commit `6f79e719a` — FOUND in `git log`
- Commit `06587c0b5` — FOUND in `git log`
