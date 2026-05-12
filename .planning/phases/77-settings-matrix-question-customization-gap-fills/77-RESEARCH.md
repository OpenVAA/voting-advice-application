# Phase 77: Settings Matrix + Question-Customization Gap-Fills — Research

**Researched:** 2026-05-12
**Domain:** Playwright E2E spec authoring (per-toggle assertion matrix + filter-type matrix + per-question customData gap-fills) on top of the post-Phase-73 deterministic baseline
**Confidence:** HIGH on toggle inventory + filter-type surface + carry-forward landmines; **MEDIUM** on SETTINGS-02 reframing (CONTEXT D-07 contains a load-bearing factual error — see LANDMINE-1); HIGH on determinism contract inheritance
**HEAD at research:** `e8463a814` (current branch `feat-gsd-roadmap`)

> **Read this section first.** Three findings change the planner's input materially relative to CONTEXT:
> 1. **CRITICAL — SETTINGS-02 voter-side "author + persist" is a PRODUCT GAP.** The voter app has NO open-comment input on the question page. `customData.allowOpen` only gates the **candidate-side** comment input (`apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:294`); the voter `answerStore.setAnswer(questionId, value)` accepts only `value`, not `info` (`apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:19,28`). The voter-side surface for `allowOpen` is `EntityOpinions.svelte:76-78` which **DISPLAYS** the entity's `answer.info` via `<QuestionOpenAnswer>` in the entity-detail drawer. Reframe SETTINGS-02 as a display-side assertion (entity comment renders / does-not-render) — see LANDMINE-1.
> 2. **CRITICAL — categorical-question + Number + Text filters do NOT render in voter UI today on the e2e dataset.** The `e2e` template carries NO `customData.filterable: true` on any question (`packages/dev-seed/src/templates/e2e.ts` — no `filterable` references). `filterStore.svelte.ts:58-61` only includes a question in the FilterGroup if `getCustomData(q).filterable` is truthy. The party / parent-nomination filter renders because `buildParentFilters` always emits it; question-type filters are gated by the per-question flag. **Plan 02 MUST extend the e2e template fixtures to set `filterable: true` on the relevant questions** OR captures `RENDER-PARTIAL` for those cells. See LANDMINE-2.
> 3. **CRITICAL — voter-side required-info enforcement is NOT a gating surface in the product.** `unansweredRequiredInfoQuestions` and `profileComplete` exist ONLY on `candidateContext.svelte.ts:347-368` (verified by `grep -rn "requiredInfoQuestions\|unansweredRequiredInfo\|profileComplete" apps/frontend/src/lib/contexts/`). The voter context exposes `requiredInfoQuestions` / `unansweredOpinionQuestions` only in `candidateContext.type.ts`. Voter "must-answer" enforcement is the `matching.minimumAnswers` threshold at `voterContext.svelte.ts:312-322` — already covered by Phase 74 E2E-02 (browse-without-match). **SETTINGS-03 voter-side required cell is a PRODUCT-GAP**; only the hidden cell is asserter-able voter-side. See LANDMINE-3.

## Phase Context

<user_constraints>

### Locked Decisions (verbatim from `77-CONTEXT.md` `<decisions>`)

- **D-01 — 5-plan layout, verification gate folded into final plan.**
  1. Plan 01 — SETTINGS-01 wave A: per-toggle matrix on `candidate-settings.spec.ts` (~12-15 toggles)
  2. Plan 02 — SETTINGS-01 wave B: filter-type matrix on `voter-results.spec.ts` (NumberFilter, TextFilter, categorical, constituency, FilterGroup AND/OR, MISSING_FILTER_VALUE) — folds `2026-04-27-extend-e2e-filter-type-coverage.md`
  3. Plan 03 — SETTINGS-02 (`customData.allowOpen`) — `variant-allowopen.ts` overlay + `voter-allowopen.spec.ts`
  4. Plan 04 — SETTINGS-03 (visibility + required) — `variant-hidden-required.ts` overlay + `voter-visibility-required.spec.ts` (+/- `candidate-required-info.spec.ts`)
  5. Plan 05 — Verification gate: vite-cache wipe + 3-run cold-start + parity-script regen
- **D-02 — `variant-allowopen.ts` for SETTINGS-02.** NEW variant template; mirrors `variant-multi-election.ts` shape (`mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)` per Pitfall 4 — DEEP merge from `@openvaa/app-shared`, NOT shallow `mergeAppSettings` from frontend).
- **D-03 — `variant-hidden-required.ts` for SETTINGS-03.** NEW variant template; flips `customData.hidden: true` on ≥1 Question + `customData.required: true` on ≥1 info Question.
- **D-04 — NO new variant for SETTINGS-01.** Plan 01 wave A applies toggles via `SupabaseAdminClient.updateAppSettings()` at TEST-TIME (matches existing CAND-10/11/13/15 pattern). Plan 02 wave B extends e2e template with 1 numeric Question; no new variant.
- **D-05 — ~28 uncovered toggles enumerated.** Per scout §1.
- **D-06 — Filter-type matrix needs 1 new fixture question.** Plan 02 adds `test-question-number-1` (type `'number'`) at sort 19.
- **D-07 — SETTINGS-02 asserts voter-side persistence (NEW), not candidate-side (covered by CAND-12).** ⚠️ FACTUAL ERROR — see LANDMINE-1 below.
- **D-08 — SETTINGS-03 covers voter-side hidden + candidate-side required.** Voter-side required is a contingent path (planner verifies at PLAN.md time) — see LANDMINE-3.
- **D-09 — Determinism contract.** All new specs MUST pass 3× cold-start `--workers=1` identically; the Phase-73-locked DATA_RACE pool (15) MUST NOT grow.
- **D-10 — Parity-script constants regen — conditional.** Plans 03 + 04 add 2 new variant projects → constants regen IS a trigger.
- **D-11 — Inherits Phase 74 D-11 / Phase 75 D-06 / Phase 76 D-11a locator + lint convention.** Role/aria locators by default; `getByTestId` requires inline `// reason:`. Lint at `'error'`.
- **D-12 — Vite-cache wipe MANDATORY** before the 3-run smoke (`rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit`).
- **D-13 — Plans mostly-parallel with some serial.** {P01 ∥ P02 ∥ P03 ∥ P04} → P05.

### Claude's Discretion (verbatim)

- Plan 02 split into 02a + 02b if scope exceeds per-plan ceiling.
- Plan 01 split into 01a + 01b if matrix breadth exceeds ceiling.
- SETTINGS-03 split into voter-side spec + candidate-side spec (default) vs. bundled.
- Whether SETTINGS-02 needs a NEW `variant-allowopen.ts` or asserts against e2e default's existing 6 `allowOpen: true` questions (default: NEW variant for differential).
- `headerStyle.*` color/sizing settings (D-05 out-of-scope) — defer.
- Whether to add explicit OR-mode UI to `FilterGroup` if not exposed (default: defer with PASS-WITH-DEFERRAL).

### Deferred Ideas (OUT OF SCOPE)

- `headerStyle.*` color / sizing / position toggles (visual-regression territory).
- `FilterGroup` OR-mode UI assertion if surface doesn't exist (PASS-WITH-DEFERRAL per Phase 74 D-04 / Phase 75 D-03 precedent).
- `entityDetails.contents[*]` / `showMissingElectionSymbol[*]` / `showMissingAnswers[*]` multi-key splitting — bundle as multi-effect cells.
- Multi-locale toggle coverage (en only).
- Settings overlay live-reload coverage (mid-session toggle changes propagating live).
- `appCustomization` runtime override toggle matrix (separate from `dynamicSettings` — not v2.9 scope).
- Voter-side required-info coverage if voter app doesn't enforce (PASS-WITH-DEFERRAL — see LANDMINE-3).
- `58-E2E-AUDIT.md`-style addendum for Plan 02's `test-question-number-1` extension.

### Folded Todos

- **`.planning/todos/pending/2026-04-27-extend-e2e-filter-type-coverage.md`** — folded into Plan 02. Resolves at Plan 02 close.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **SETTINGS-01** | `appSettings` / `appCustomization` per-toggle E2E coverage. Enumerate the toggles surfaced by `staticSettings` + `dynamicSettings`; assertion-per-toggle. Folds `2026-04-27-extend-e2e-filter-type-coverage.md`. | §"Toggle Inventory" maps each ~28 uncovered `dynamicSettings` toggle to (UI surface | locator | assertion shape | risk class | PRODUCT-GAP flag). §"Filter-Type Matrix" maps each filter type to surface + locator + assertion + PRODUCT-GAP. Plan 02 must extend e2e template with `test-question-number-1` AND add `customData.filterable: true` to that question + the existing categorical (sort 17) + the existing text question (sort 8). |
| **SETTINGS-02** | `customData.allowOpen` E2E-covered. Variant fixture enables `allowOpen` on subset of questions; spec asserts (a) open-comment UI surfaces, (b) voter authors comment text, (c) comment persists across reload. | §"SETTINGS-02 Persistence Path" — REFRAMED. Voter app has NO authoring surface for open comments; the voter-side `allowOpen` surface is the **entity-detail drawer's display** of the entity's `answer.info` via `<QuestionOpenAnswer>` at `EntityOpinions.svelte:76-78`. The differential assertion is "entity comment row renders for `allowOpen: true` question OR is filtered/hidden when `allowOpen: false`". Persistence-across-reload is automatic (entity answers are server-side, not voter-side). |
| **SETTINGS-03** | Per-question visibility + must-answer enforcement. Hidden questions don't render in voter flow; required-but-unanswered blocks navigation to results. | §"SETTINGS-03 Audit" — voter-side `customData.hidden` is asserter-able (filter at `voterContext.svelte.ts:215-230`). Candidate-side `customData.required` is asserter-able via `profileComplete` (`candidateContext.svelte.ts:347-368`) — disables submit-CTA and `LogoutButton` warning at line 100. Voter-side `customData.required` is a PRODUCT-GAP (no equivalent gating; only `matching.minimumAnswers` threshold gates voter-results-CTA, already covered by Phase 74 E2E-02). |

</phase_requirements>

## Validation Architecture (8 dimensions — Nyquist)

> Required because `workflow.nyquist_validation` is implicitly enabled (`.planning/config.json` does not set it to `false`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright `1.58.2` (per Phase 75 verification record + Phase 76 RESEARCH) |
| Config file | `tests/playwright.config.ts` (90s per-test timeout; `fullyParallel: true`; `workers: 1` in CI / `6` local) |
| Quick run command (per task) | `yarn playwright test -c tests/playwright.config.ts <spec-glob> --workers=1 --reporter=line` |
| Full suite command | `yarn supabase:reset && yarn dev:seed --template e2e && yarn test:e2e --workers=1` (NOT `yarn dev:reset-with-data` — that loads `default` template; Phase 75 P02a finding) |
| Per-plan smoke | Same as quick run, scoped to the new spec(s) — Phase 74/75/76 precedent: PASS × 3 isolated before merging |
| Parity gate | `yarn tsx tests/scripts/diff-playwright-reports.ts <run-N> <run-M>` × 3 pair comparisons (1v2, 2v3, 1v3) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETTINGS-01 (toggle matrix wave A) | ~12-15 cells of `updateAppSettings({...})` → assert UI surface OR absence → restore. Each cell parameterized inside `candidate-settings.spec.ts`. | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/candidate/candidate-settings.spec.ts --workers=1 --project=candidate-app-settings` | ✅ host file (extension) |
| SETTINGS-01 (filter-type matrix wave B) | NumberFilter / TextFilter / categorical / constituency / FilterGroup AND / MISSING_FILTER_VALUE — each asserts narrowing behavior. | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/voter/voter-results.spec.ts --workers=1 --project=voter-app -g "SETTINGS-01"` | ✅ host file (extension) |
| SETTINGS-02 (allowOpen display) | Voter walks to entity-detail drawer for `allowOpen: true` question → `<QuestionOpenAnswer>` renders entity's `answer.info`. Voter walks to entity-detail drawer for `allowOpen: false` question → no `<QuestionOpenAnswer>`. | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/voter/voter-allowopen.spec.ts --workers=1 --project=variant-allowopen` | ❌ Wave 0 (new spec + new variant) |
| SETTINGS-03 (voter-hidden) | Voter walks to /questions → hidden question's `external_id` absent from DOM (`expect(getByTestId(question-${id})).toHaveCount(0)`). | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/voter/voter-visibility-required.spec.ts --workers=1 --project=variant-hidden-required` | ❌ Wave 0 (new spec + new variant) |
| SETTINGS-03 (candidate-required) | Candidate logs in → leaves required info question unanswered → submit/results CTA disabled OR `LogoutButton` shows "Your profile is incomplete" warning. | Playwright e2e | `yarn playwright test -c tests/playwright.config.ts tests/tests/specs/candidate/candidate-required-info.spec.ts --workers=1 --project=variant-hidden-required` | ❌ Wave 0 (new spec) |
| SETTINGS-03 (voter-required) | PRODUCT-GAP — no voter-side enforcement surface beyond `minimumAnswers` (covered by Phase 74 E2E-02). | DEFER (PASS-WITH-DEFERRAL per LANDMINE-3) | n/a | n/a |

### Sampling Rate

- **Per task commit:** scoped per-spec smoke (`--workers=1 -g "<grep-pattern>"`).
- **Per wave merge:** full per-plan smoke 3× isolated (Phase 74/75/76 precedent) + lint pass.
- **Phase gate:** vite-cache wipe → 3-run cold-start `--workers=1` SHA-256 identical sorted (title|status) sets → 3 PARITY GATE PASS pair comparisons → conditional constants regen if Plans 03+04 added new variant projects (per CONTEXT D-10).

### Wave 0 Gaps

- [ ] `tests/tests/setup/templates/variant-allowopen.ts` — new variant template (Plan 03).
- [ ] `tests/tests/setup/variant-allowopen.setup.ts` — new setup file (Plan 03).
- [ ] `tests/tests/specs/voter/voter-allowopen.spec.ts` — new spec (Plan 03).
- [ ] `tests/tests/setup/templates/variant-hidden-required.ts` — new variant template (Plan 04).
- [ ] `tests/tests/setup/variant-hidden-required.setup.ts` — new setup file (Plan 04).
- [ ] `tests/tests/specs/voter/voter-visibility-required.spec.ts` — new spec (Plan 04).
- [ ] `tests/tests/specs/candidate/candidate-required-info.spec.ts` — new spec (Plan 04).
- [ ] `tests/playwright.config.ts` — 4 new project entries (Plans 03 + 04: `data-setup-allowopen`, `variant-allowopen`, `data-setup-hidden-required`, `variant-hidden-required`).
- [ ] `tests/tests/setup/templates/index.ts` — register new variants.
- [ ] `packages/dev-seed/src/templates/e2e.ts` — Plan 02 adds `test-question-number-1` at sort 22 + `custom_data: { filterable: true }` on that question + existing `test-question-text` (sort 8) + `test-question-directional-1` (sort 17). Requires `yarn build @openvaa/dev-seed` after edit.
- [ ] Plan 04 candidate-side spec MAY require `playwright.config.ts:124` regex extension to add `candidate-required-info` to the `candidate-app-mutation` testMatch pattern (per Phase 76 deferred-items.md item #3).

### Dimension Coverage

#### 1. Existence

- **What to test:** Every new spec file is loadable by Playwright. Every new variant project resolves. e2e fixture extension still satisfies the existing voter-matching invariants (LIKERT_SCALE = 5, candidate count, etc.).
- **How to assert:** `yarn playwright test --list -c tests/playwright.config.ts | grep -E "voter-allowopen|voter-visibility-required|candidate-required-info|SETTINGS-01"`. After Plan 02's fixture extension: `yarn build @openvaa/dev-seed && yarn workspace @openvaa/dev-seed test:unit` to verify the template registry round-trips.

#### 2. Behavior

- **What to test:** Each cell's binary-toggle effect (on vs. off). Each filter-type cell's narrowing semantics. Each variant fixture's overlay applies cleanly (no shallow-merge clobber of base settings).
- **How to assert:**
  - SETTINGS-01 wave A: `await client.updateAppSettings(overlay); await page.goto(...); await expect(<surface>).toBeVisible()` AFTER overlay applied; `test.afterAll()` restores defaults.
  - SETTINGS-01 wave B: pattern from existing `voter-results.spec.ts:152-215` RESULTS-01/02 test — open filter dialog → toggle filter → `expect.poll(() => page.getByTestId(testIds.voter.results.card).count(), { timeout: 5000 }).toBeLessThan(initialCount)` (NOT `toBeLessThanOrEqual` per Phase 73 IN-04 finding).
  - SETTINGS-02: `await expect(drawer.getByText(ENTITY_INFO_LITERAL)).toBeVisible()` for `allowOpen: true` question's row; for `allowOpen: false` question's row, the differential is whether the entity's `answer.info` is presented to the voter (Note: this is field-level config, not server-fetch suppression — the `customData.allowOpen` field gates CANDIDATE authoring, but the entity-detail drawer ALWAYS displays `answer.info` if it exists in the DB row regardless of `allowOpen`). **See LANDMINE-1 for the reframed assertion shape.**
  - SETTINGS-03 voter-hidden: `await expect(page.getByText(HIDDEN_QUESTION_TEXT_LITERAL)).toHaveCount(0)` after walking to /questions in the variant project.
  - SETTINGS-03 candidate-required: `await expect(submitButton).toBeDisabled()` when required info question is empty; OR `await expect(logoutButton.getByText(/incomplete/i)).toBeVisible()`.
- **Command:** per-plan smoke × 3 in isolation.

#### 3. Integration

- **What to test:** New variant projects participate in the existing 27-project dependency chain WITHOUT breaking. Plans 03 + 04 add 2 new variants AFTER `variant-Ne-Nc` (the current last variant). Sequential dependency keeps variant-data-setup races bounded (Pitfall 5 inherited from Phase 74 D-13).
- **How to assert:** `tests/scripts/diff-playwright-reports.ts` parity gate: 3 pair comparisons output `PARITY GATE: PASS` after constants regen. New PASS_LOCKED entries grow by the count of new-spec passes (~10-15 for SETTINGS-01 wave A + ~6-7 for wave B + ~2-3 for SETTINGS-02 + ~2-3 for SETTINGS-03 = ~20-28 total).

#### 4. Edge Cases

- **SETTINGS-01 wave A — overlay restoration race:** `test.afterAll()` blocks may run BEFORE the next test's `updateAppSettings`. Plan 01 mitigates via existing serial-mode contract (`test.describe.configure({ mode: 'serial' })`). Concurrent test workers MUST NOT touch settings — `candidate-app-settings` project already enforces (`playwright.config.ts:140-151`).
- **SETTINGS-01 wave B — filter-dialog modal-close race** (Phase 64 D-11 + D-15 hardening): the existing `voter-results.spec.ts` already handles this via `await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 })`. New filter-type cells inherit the pattern.
- **SETTINGS-02 — `allowOpen: false` differential:** if BOTH allowOpen=true and allowOpen=false questions are in the same variant, voter walks ONE drawer and asserts presence; walks ANOTHER drawer and asserts absence. Watch for ordering — entity-detail drawer pagination may surface ALL questions; the assertion is per-question-row, not whole-drawer.
- **SETTINGS-03 voter-hidden — categorical-question filter render side effect:** if the hidden question is the categorical `test-question-directional-1`, that ALSO removes the categorical filter from the voter results UI (since `filterStore` builds filters from `infoQuestions` + `opinionQuestions`). The variant fixture should hide a NON-filterable question to keep the side-channel narrow.
- **SETTINGS-03 candidate-required — `LogoutButton` warning surfaces ONLY for unanswered REQUIRED info questions OR (when `hideIfMissingAnswers.candidate` is true) for unanswered opinion questions:** `LogoutButton.svelte:100` — the boolean is `unansweredRequiredInfoQuestions?.length !== 0 || ($appSettings.entities?.hideIfMissingAnswers?.candidate && unansweredOpinionQuestions?.length !== 0)`. To assert the required-only path, set `hideIfMissingAnswers.candidate: false` in the variant overlay so the second clause is OFF.

#### 5. Observability

- **What to test:** When a Phase 77 spec fails, the failure cause is identifiable from the Playwright HTML report.
- **How to assert:** Each spec uses `test.step('description', async () => { ... })` to break long sequences into report-visible steps. Parameterized cells use named `test()` titles (`SETTINGS-01 ${cell.name}`) per the existing CAND-09..CAND-15 pattern.
- **Command:** `yarn playwright show-report tests/playwright-report` after a run.

#### 6. Performance

- **What to test:** New specs do NOT inflate full-suite cold-start runtime beyond the Phase 75/76 baseline. Settings-mutation tests are inherently slower (settings overlay roundtrip via Supabase RPC + page navigation per cell). Estimate: ~5-8s per cell × 12-15 cells = +60-120s for SETTINGS-01 wave A; ~3-5s per cell × 6-7 cells = +20-35s for wave B; ~5-8s × 2-3 cells = +10-25s for SETTINGS-02; ~5-8s × 2-3 cells = +10-25s for SETTINGS-03. Total: +100-205s = +1.7-3.4 min. Plan 05 captures.
- **How to assert:** Capture per-test duration from `report.json`; surface in `77-VERIFICATION.md` if any new test exceeds 30s.

#### 7. Security

- **What to test:** Phase 77 specs do NOT submit credentials over plain HTTP, do NOT scrape DOM with PII into committed artifacts, do NOT log auth tokens. `SupabaseAdminClient.updateAppSettings()` uses the service-role key — confirm it stays in env var, not committed.
- **How to assert:** Visual review at code-review time. The settings-overlay JSON shapes contain ONLY toggle values (booleans + LocalizedString notification content), no PII. The IdP-related toggles (`access.adminApp`) do not embed secrets.

#### 8. Validation-of-Validation

- **What to test:** The verification gate itself is honest — 3-run SHA identity is computed correctly (`projectName :: file > title|status` format per Phase 74/75/76 precedent); parity-script regen targets the right `run-N-report.json`; 2 new variant projects are correctly registered in PASS_LOCKED.
- **How to assert:** Plan 05 verification gate replicates Phase 76 P04 shape:
  ```bash
  rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit
  yarn supabase:reset
  yarn dev:seed --template e2e
  yarn test:e2e --workers=1 --reporter=html
  # × 3 runs
  # SHA-256 each run's sorted-status capture; assert all 3 hashes identical
  yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-2.json
  # × 3 pair comparisons (1v2, 2v3, 1v3)
  ```
- **Command:** Plan 05 records the exact recipe in `77-VERIFICATION.md`.

## Toggle Inventory

> 28 uncovered `dynamicSettings` toggles enumerated. Each cell maps to (UI surface | suggested locator | assertion shape | risk class | PRODUCT-GAP flag).
>
> CONTEXT D-05's enumeration is ACCURATE; this section provides the concrete locator + assertion shape per cell. CONTEXT scopes to `dynamicSettings` only — `staticSettings` (locales, fonts, colors, dataAdapter) is NOT in Phase 77 scope.

### Plan 01 Wave A — `updateAppSettings()`-overlay-driven cells

| # | Toggle path | UI surface | Locator | Assertion shape (ON / OFF) | Risk | PRODUCT-GAP? |
|---|------------|-----------|---------|---------------------------|------|--------------|
| 1 | `access.voterApp` | `apps/frontend/src/routes/(voters)/+layout.svelte` (root layout shows MaintenancePage when false) | `page.getByRole('heading', { level: 1 })` (MaintenancePage h1) | OFF: heading visible + voter content NOT visible. Mirror of CAND-10 pattern. | LOW | No |
| 2 | `access.adminApp` | Admin app routes (NOT in current scope per scout — admin app is a separate route tree; verify reachable from voter test) | TBD — admin app may not have e2e fixture; defer or test indirectly | If admin app surface unreachable in e2e: PASS-WITH-DEFERRAL. | MEDIUM | **Possibly PARTIAL** — admin app fixture surface confirm at PLAN.md time |
| 3 | `candidateApp.questions.hideVideo` | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:276` (`{#if !($appSettings.candidateApp.questions.hideVideo && customData.video)}`) | `page.getByRole('region', { name: /video/i })` OR `getByTestId('candidate-questions-video')` if added | ON: video region NOT visible (when question has video customData); OFF: video region visible. Same pattern as `hideHero` CAND-15 — uses `figure[role="presentation"]` raw selector with `// reason:` block per Phase 73 IN-03. | LOW | **PARTIAL** — fixture has no `customData.video` on any question today; assertion can only confirm the boolean check fires (not the video render). Either add a `customData.video` to a fixture question OR fold this into a structural-only assertion. |
| 4 | `header.showFeedback` | `apps/frontend/src/routes/(voters)/+layout.svelte:67` (sets `feedback: 'show' \| 'hide'`) — feedback button in header | `page.getByRole('button', { name: /feedback/i })` (header feedback icon) | ON: button visible; OFF: `await expect(button).toHaveCount(0)`. | LOW | No |
| 5 | `header.showHelp` | `apps/frontend/src/routes/(voters)/+layout.svelte:68` — help button in header | `page.getByRole('link', { name: /help/i })` | ON: link visible; OFF: `await expect(link).toHaveCount(0)`. | LOW | No |
| 6 | `notifications.voterApp` | `apps/frontend/src/lib/components/notification/Notification.svelte:13` (`<Notification data={$appSettings.notifications.voterApp}/>`) | `page.getByRole('dialog')` (Alert with role="dialog") | ON (with `show: true`, `title`, `content`): dialog visible with title text; OFF: dialog NOT present. Same shape as CAND-13. | LOW | No |
| 7 | `entities.showAllNominations` | `apps/frontend/src/routes/(voters)/nominations/+layout.ts:19` — `if (!appSettings.entities.showAllNominations) { error(404, ...) }`. Also `VoterNav.svelte:96`. | `page.goto('/nominations')` → assert 404 OR assert nav link absent | ON: nav link visible AND `/nominations` route returns 200; OFF: nav link absent AND `/nominations` returns 404. | LOW | No |
| 8 | `entities.hideIfMissingAnswers.candidate` | `voterContext.svelte.ts:328` + `nominationAndQuestionStore.svelte.ts:42` — filters out candidates with missing opinion answers. | `page.getByTestId(testIds.voter.results.card).count()` | ON: 11 visible candidates (current default); OFF: 12-13 visible (includes candidates without answers). Use `expect.poll()`. | MEDIUM | No — but the assertion delta is small (1-2 candidates). Cell is asserter-able. |
| 9 | `elections.disallowSelection` | `voterContext.svelte.ts:55` (`!appSettingsState.current.elections?.disallowSelection && ...`) + `impliedParams.ts:38` + `VoterNav.svelte:15` | `page.goto('/elections')` → assert auto-bypass to next route | ON (true): selector NOT shown — page redirects to constituencies/questions; OFF (false): selector shown when `elections.length > 1`. Note: needs multi-election fixture for full assertion (default e2e is 1 election, so disallowSelection is moot). May require composing with multi-election variant — may be OUT OF SCOPE for Plan 01 wave A. | MEDIUM | **PARTIAL** — needs multi-election variant context; defer to Plan 02 or composed-variant approach. |
| 10 | `elections.showElectionTags` | `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte:74` (`{#if $appSettings.elections.showElectionTags}`) + `candidate questions/+page.svelte:144` | `page.getByText(/Test Election 2025/i)` on a question page | ON: election tag text visible; OFF: `await expect(tagText).toHaveCount(0)`. | LOW | No |
| 11 | `questions.categoryIntros.show` | `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:147` + `category/[categoryId]/+page.svelte:73` | `page.getByTestId(testIds.voter.questions.categoryStart)` (existing testId from `multi-election.spec.ts`) | ON: category-intro page renders between categories; OFF: skipped. Walk voter through 2+ categories to assert. | MEDIUM (sequence-dependent) | No |
| 12 | `questions.categoryIntros.allowSkip` | `category/[categoryId]/+page.svelte:116` (`{#if $appSettings.questions.categoryIntros?.allowSkip}`) | `page.getByRole('button', { name: /skip/i })` on category-intro page | ON: skip button visible; OFF: NOT visible. Bundle with #11 (multi-effect cell). | LOW | No |
| 13 | `questions.questionsIntro.show` | `(voters)/(located)/questions/+page.svelte:59` + `[questionId]/+page.svelte:137` | URL assertion on `/questions` route | ON: lands on intro page; OFF: bypasses to first question. | LOW | No |
| 14 | `questions.questionsIntro.allowCategorySelection` | `(voters)/(located)/questions/+page.svelte:112` (`{#if $appSettings.questions.questionsIntro.allowCategorySelection}`) | `page.getByRole('checkbox')` for category-selection list | ON: category checkboxes visible on intro page; OFF: NOT. Depends on #13 = true. Bundle. | LOW | No |
| 15 | `questions.interactiveInfo.enabled` | `[questionId]/+page.svelte:186` (`{#if $appSettings.questions.interactiveInfo?.enabled && (info \|\| customData.infoSections?.length)}`) | `getByRole('button', { name: /info/i })` (QuestionExtendedInfoButton) | ON: info button visible; OFF: `<QuestionBasicInfo>` shown instead. Needs a question with `info` text — fixture confirm. | LOW-MED | No |
| 16 | `questions.showCategoryTags` | `EntityOpinions.svelte:45` + `QuestionHeading.svelte:79` | `page.getByText(/test category/i)` near question text | ON: category tag visible; OFF: hidden. | LOW | No |
| 17 | `questions.showResultsLink` | `(voters)/(located)/questions/+layout.svelte:37` (`results: $appSettings.questions.showResultsLink ? 'show' : 'hide'`) | `page.getByRole('link', { name: /results/i })` in header during questions flow | ON: results link visible (when enough answers given); OFF: hidden. | LOW | No |
| 18 | `matching.organizationMatching` (enum: `'none' \| 'answersOnly' \| 'impute'`) | `voterContext.svelte.ts:366` + `(voters)/about/+page.svelte:52` (`{#if $appSettings.matching.organizationMatching !== 'none'}`) — ALSO affects matchStore behavior | About page text: `getByText(t('about.organizationMatching.title'))` | ON (`'none'`): about-page section absent; OFF (`'impute'` or `'answersOnly'`): section present + text contains the method name. Cell asserts the 3 enum values. | MEDIUM | No |
| 19 | `results.cardContents.candidate` | `EntityCard.svelte:123` (`showSM = $appSettings.results?.cardContents?.[type]?.includes('submatches')`) | `getByRole('meter', { name: /economy|social/i })` per Phase 74 P05 SubMatch locator | ON (`['submatches']`): submatches render on candidate cards; OFF (`[]`): NOT. | MEDIUM (paired with E2E-07 surface) | No |
| 20 | `results.cardContents.organization` | `EntityCard.svelte:140` (`{#if $appSettings.results?.cardContents?.organization?.includes('children')}`) | TBD — children list inside organization card | ON (`['children']`): child candidates listed in org card; OFF: NOT. | MEDIUM | No |
| 21 | `results.cardContents.alliance` | `EntityCard.svelte:149` — same shape | TBD | Same pattern. May not have alliance fixture in e2e default — confirm at PLAN.md time. | MEDIUM | **Possibly PARTIAL** — verify alliance fixture surface in e2e |
| 22 | `results.sections` (`Array<'candidate' \| 'organization' \| 'alliance'>`) | `EntityInfo.svelte:70` + `(voters)/(located)/results/+layout.svelte` (drives entity-tabs) — controls which entity-type tabs render | `page.getByTestId(testIds.voter.results.entityTabs).getByRole('tab').count()` | Default `['candidate', 'organization']` → 2 tabs; setting to `['candidate']` only → 1 tab. | LOW | No |
| 23 | `results.showFeedbackPopup` (number, seconds) | `(voters)/(located)/results/+layout.svelte:212` (`if ($appSettings.results.showFeedbackPopup != null) startFeedbackPopupCountdown(...)`) | Feedback popup `getByRole('dialog')` after timeout | Setting `showFeedbackPopup: 1` → popup appears within ~1.5s of results-page mount; setting to `null` or `0` → no popup. **NOTE:** existing `voter-popups.spec.ts` covers this surface; SETTINGS-01 may DEFER to avoid duplication. | LOW (duplicate-with-voter-popups risk) | **Already covered by `voter-popups.spec.ts`** — confirm at PLAN.md time; defer if covered. |
| 24 | `results.showSurveyPopup` (number) | `(voters)/(located)/results/+layout.svelte:218` — same shape as #23 | Same | Same — likely already covered by `voter-popups.spec.ts`. Defer-confirm. | LOW | **Already covered (likely)** |
| 25 | `entityDetails.contents.candidate` (`Array<'info' \| 'opinions'>`) | `EntityDetails.svelte:74` (`$appSettings.entityDetails.contents[nakedEntity.type as keyof ...]`) | Tab list inside entity-detail drawer: `drawer.getByRole('tablist').getByRole('tab').count()` | Default `['info', 'opinions']` → 2 tabs; setting to `['info']` only → 1 tab. | LOW | No |
| 26 | `entityDetails.contents.organization` (`Array<'info' \| 'children' \| 'opinions'>`) | Same | Same shape | Default `['info', 'children', 'opinions']` → 3 tabs. | LOW | No |
| 27 | `entityDetails.contents.alliance` | Same | Same shape | Same. May depend on alliance fixture availability. | LOW | **Possibly PARTIAL** |
| 28 | `entityDetails.showMissingElectionSymbol.{candidate,organization}` | `EntityInfo.svelte:90` (`{#if electionSymbol \|\| $appSettings.entityDetails.showMissingElectionSymbol[entityType]}`) | `drawer.getByText(/election symbol/i).locator('..').getByText('—')` (the missing-marker `—`) | ON: missing-marker `—` visible; OFF: row hidden. Bundle as multi-effect cell across entity types. | MEDIUM | No |
| 29 | `entityDetails.showMissingAnswers.{candidate,organization}` | `EntityInfo.svelte:106` — same shape | Same | Same. Bundle. | MEDIUM | No |

**Out-of-scope styling cells** (per CONTEXT D-05): `headerStyle.dark.bgColor`, `headerStyle.light.bgColor`, `headerStyle.dark.overImgBgColor`, `headerStyle.light.overImgBgColor`, `headerStyle.imgSize`, `headerStyle.imgPosition`. **These are NON-TOGGLE (string values + sizing); deferred to a future visual-regression workstream.**

**SCOPE-CLARIFICATION:** CONTEXT D-05 lists ~33 toggles total. Cells already covered by Phase 73/74/v2.4 baseline:
- `access.candidateApp` — CAND-10
- `access.underMaintenance` — CAND-11
- `access.answersLocked` — CAND-09
- `candidateApp.questions.hideHero` — CAND-15
- `notifications.candidateApp` — CAND-13
- `matching.minimumAnswers` — Phase 74 E2E-02 (variant-low-minimum-answers)
- `elections.startFromConstituencyGroup` — Phase 74 / `variant-startfromcg`

That accounts for 7 covered + ~28 uncovered shown in the table above + 6 styling = 41 total surface — slightly higher than CONTEXT's "~33", reflecting how multi-key entries (`entityDetails.contents.{c,o,a}`, `cardContents.{c,o,a}`, `showMissingAnswers.{c,o}`, etc.) split when counted per-cell. **Recommended Plan 01 wave A scope:** ~12-15 highest-value cells: #1, #4, #5, #6, #7, #8, #10, #13, #16, #17, #22, #25, #28+#29 (multi-effect bundle). Defer #2 (admin), #3 (no fixture), #9 (multi-election), #11+#12 (sequential cells; bundle), #14 (paired with #13), #15 (interactive), #18 (3-enum cell), #19+#20+#21 (cardContents trio — Plan 01 wave B may pick up since they affect the results card surface), #23+#24 (already covered by voter-popups), #26+#27 (entityDetails trio).

Final cell count for Plan 01 wave A: **12-15 cells** (some bundled multi-effect). Plan 01 may be split into 01a (access + maintenance + notifications + header) + 01b (questions + results + entityDetails) per CONTEXT D-01 risk note.

## Filter-Type Matrix Concrete Shapes

> Plan 02 wave B. **Critical pre-condition: `customData.filterable: true` MUST be set on the questions Plan 02 asserts against** — currently NO question in the e2e template carries this flag (verified — `grep filterable packages/dev-seed/src/templates/e2e.ts` returns 0 hits). Without `filterable: true`, the question filter does NOT render in the UI per `filterStore.svelte.ts:58-61`. **This is a Plan 02 fixture-extension blocker** in addition to the new `test-question-number-1` add per CONTEXT D-06.

| Filter type | Backing question (e2e fixture) | Where rendered | Locator | Assertion shape | PRODUCT-GAP? |
|-------------|-------------------------------|----------------|---------|----------------|--------------|
| **EnumeratedFilter / ObjectFilter (parties)** | `test-nom-org-party-a` / `-b` / `test-voter-nom-org-party-a` / `-b` (parent_nomination links on candidates) | Voter results filter dialog (always rendered when ≥1 candidate has parent_nomination) | `page.getByTestId('entity-list-filter')` → `page.getByRole('dialog').getByRole('checkbox')` | **Already covered by RESULTS-01/02 in `voter-results.spec.ts:152-215`** — assert pattern: open filter → toggle checkbox → narrow assertion. CONTEXT correctly notes this is "EnumeratedFilter via party filters" — already covered. | No (already covered) |
| **NumberFilter** (NumberQuestionFilter) | NEEDS NEW: `test-question-number-1` (Plan 02 fixture extension; CONTEXT D-06). MUST set `customData: { filterable: true }`. Question MUST have `min` + `max` defined (per `numberQuestion.ts:47-56` — the question is matchable + filter-renderable when min and max exist). Alpha gets a number answer cell. | `EntityFilters.svelte:48-51` → `NumericEntityFilter.svelte` (range inputs `<input type="range">`) | `page.getByRole('slider')` (×2 — min + max) | Move min slider above Alpha's value → `expect.poll(() => cards.count(), { timeout: 5000 }).toBeLessThan(initialCount)`. Reset → `toEqual(initialCount)`. | **PARTIAL** — fixture extension required (Plan 02). Verify `min`/`max` field shape on `Question` schema before authoring. |
| **TextFilter** (TextQuestionFilter) | Existing `test-question-text` at `e2e.ts:425-433` (sort 8). MUST set `customData: { filterable: true }`. | `EntityFilters.svelte:44-46` → `TextEntityFilter.svelte` (`<input type="text">` with `aria-label="entityFilters.text.ariaLabel"`) | `page.getByRole('textbox', { name: t('entityFilters.text.ariaLabel') })` | Type substring of Alpha's text answer (`'Progress'` from Alpha's `'Progress for all'`) → `expect.poll(() => cards.count()).toBeLessThan(initialCount)`. Clear → restore. | No, but fixture flag required |
| **ChoiceQuestionFilter (categorical)** | Existing `test-question-directional-1` (sort 17, `singleChoiceCategorical`, choices a/b/c). MUST set `customData: { filterable: true }`. | `EntityFilters.svelte:52-55` → `EnumeratedEntityFilter.svelte` (existing — uses dialog checkboxes) | Same as parties pattern (`page.getByRole('dialog').getByRole('checkbox')`) | Uncheck Option A (Alpha's value `'a'`) → assert Alpha NOT visible. Check back → restore. | No, but fixture flag required |
| **Constituency-based filter** | Constituency-variant project fixture | `variant-constituency.spec.ts` host. Per `filterStore.svelte.ts` + `buildParentFilters.ts`, constituency may surface as part of parent-nomination filters when constituency variation exists. **VERIFY at PLAN.md time** whether constituency renders as a separate filter or only as a sub-nomination filter in the existing constituency variant. | TBD — depends on UI surface | Toggle constituency in filter dialog → assert entity list narrows. | **Possibly PARTIAL** — surface may not be a top-level filter in the current product. Fold as additive block in `variant-constituency.spec.ts`; PASS-WITH-DEFERRAL if surface absent. |
| **FilterGroup AND** | (in-spec composition; toggle 2+ filters at once) | Same filter dialog | n/a — composed at test level | Toggle 2 filters (party A + categorical Option A) → assert narrower than either alone. **No fixture change**, but BOTH source filters MUST render (i.e., requires the filterable-flag work). | No |
| **FilterGroup OR** | Same | UI for OR-mode toggle in filter dialog — **VERIFY EXISTS at PLAN.md time**. `FilterGroup.logicOperator` setter exists at `filterGroup.ts:75-79`, but **no UI surface emits `LOGIC_OP.Or` today** (verified — `grep -rn "logicOperator\|LOGIC_OP" apps/frontend/src/lib/components/entityFilters/` returns 0 hits — `EntityFilters.svelte` does not render an OR/AND mode-toggle). | n/a (UI does not exist) | n/a | **PRODUCT-GAP** — DEFER per CONTEXT D-08 PASS-WITH-DEFERRAL. Filed as follow-up todo at Plan 02 close. |
| **MISSING_FILTER_VALUE sentinel** | Any filter; surfaces via the `excludeMissing` checkbox in `NumericEntityFilter.svelte:101-107` (and equivalent in `EnumeratedEntityFilter` for missing-value cells) | `NumericEntityFilter.svelte:101-107` `<input type="checkbox">` labeled `t('entityFilters.missingValue')` | `page.getByRole('checkbox', { name: t('entityFilters.missingValue') })` | Toggle off → assert candidates with MISSING value are excluded → entity count drops. Requires ≥1 entity with MISSING value on the asserted question — `test-voter-cand-partial` already provides 4 unanswered cells. | Surfaces only on filter types that expose the rule; verify per filter type at PLAN.md time |

**Plan 02 fixture extension summary** (single-template extension per Phase 74 P05 / Phase 75 P01 / Phase 76 P01 precedent):

```ts
// packages/dev-seed/src/templates/e2e.ts — Plan 02 additions

// Pattern: add custom_data: { filterable: true } to existing 2 questions
// + add NEW number question at sort 22 (after Phase 76's social-link at sort 21).
{
  external_id: 'test-question-text',
  // ... existing fields ...
  custom_data: { filterable: true }, // NEW — Plan 02
},
{
  external_id: 'test-question-directional-1',
  // ... existing fields ...
  custom_data: { filterable: true }, // NEW — Plan 02
},
{
  external_id: 'test-question-number-1',
  type: 'number',
  name: { en: 'Test Number Question 1 (SETTINGS-01 wave B NumberFilter anchor)' },
  category: { external_id: 'test-category-info' },
  custom_data: { filterable: true, min: 0, max: 100 }, // NEW — Plan 02
  allow_open: false,
  required: false,
  sort_order: 22,
  is_generated: false
}
// + Alpha + 2-3 other candidates get number answer cells:
// 'test-question-number-1': { value: 25 }, etc.
```

**VERIFY at PLAN.md time:**
1. Number question `min`/`max` field shape — currently no number-typed question exists in any template; the field may be expected as `customData.min`/`customData.max` (per `numberQuestion.ts:47-56` reads from question data) OR as a top-level `min`/`max` row column. `numberQuestion.test.ts` reading would confirm. **Confidence: MEDIUM** — Plan 02 author confirms by reading `numberQuestion.ts` test fixtures.
2. Constituency-filter UI surface — does `variant-constituency` actually emit a constituency filter in the entity-filter dialog? OR is constituency only a navigation surface (election→constituency selector chain)? Plan 02 author confirms.

## Variant-Template Skeletons

### `variant-allowopen.ts` — SETTINGS-02

> Per CONTEXT D-02 + the canonical `variant-low-minimum-answers.ts` shape. **Existing e2e default already has `customData.allowOpen: true` on 6 questions (test-question-1..6 at sorts 0-5).** The variant flips a SUBSET to `allowOpen: false` for differential assertion — the simplest path is to leave 1 question with `allowOpen: true` and 1 with `allowOpen: false`.

```ts
/**
 * AllowOpen variant template — settings-only overlay (SETTINGS-02).
 *
 * Spec contract: tests/tests/specs/voter/voter-allowopen.spec.ts (SETTINGS-02).
 * Base: BUILT_IN_TEMPLATES.e2e.
 *
 * Per CONTEXT LANDMINE-1: voter has NO authoring surface for open comments.
 * The voter-side allowOpen surface is the entity-detail drawer's display of
 * the entity's `answer.info` via `<QuestionOpenAnswer>` at
 * EntityOpinions.svelte:76-78. The differential assertion is per-question:
 *   - test-question-1 (allowOpen: true; Alpha's answer.info present)
 *     → drawer shows alpha's open comment
 *   - test-question-3 OVERRIDDEN to allowOpen: false (Alpha's answer.info present)
 *     → drawer shows the value but the comment surface is implementation-defined
 *
 * Note: `customData.allowOpen` gates CANDIDATE authoring of `answer.info`.
 * Once an entity has authored `answer.info` (regardless of subsequent
 * allowOpen toggle), the voter drawer ALWAYS displays it via QuestionOpenAnswer
 * (EntityOpinions.svelte:76 — `{#if answer?.info}`).
 *
 * SETTINGS-02's voter-side assertion is therefore:
 *   1. For test-question-1 (allowOpen: true; Alpha has answer.info):
 *      open drawer → opinions tab → assert <QuestionOpenAnswer> renders Alpha's slogan.
 *   2. For test-question-3 (allowOpen: false; Alpha STILL has answer.info from
 *      the e2e seed because the seed pre-dates the variant flip):
 *      open drawer → opinions tab → assert <QuestionOpenAnswer> renders.
 *      THIS DOCUMENTS the architectural fact that `customData.allowOpen` is
 *      candidate-app-only — voter sees the existing comment regardless.
 *
 * The truer differential assertion requires:
 *   - A question where Alpha has NO answer.info AND allowOpen: false
 *     → expect <QuestionOpenAnswer> NOT to render
 * vs.
 *   - A question where Alpha HAS answer.info AND allowOpen: true
 *     → expect <QuestionOpenAnswer> to render
 *
 * The e2e default's 5 alpha answers (test-question-1, -3, -5, -7, -text)
 * include 3 with `info` populated (Q1, Q3, Q5) and 1 without (Q7) — the
 * variant could leave Q7 untouched (allowOpen: true, no info) and verify
 * the negative case via Q7's drawer.
 *
 * Overlay-row inventory:
 *   - questions: pass-through with custom_data.allowOpen mutated on a subset
 *     (mutate test-question-3 to allowOpen: false; leave test-question-1
 *     allowOpen: true)
 *   - everything else: pass-through (count: 0, fixed: baseFixed(table))
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-allowopen: BUILT_IN_TEMPLATES.e2e is undefined.');

const ALLOWOPEN_APP_SETTINGS_OVERLAY = {
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  }
} as const;

type FixedRow = Record<string, unknown>;

function baseFixed(
  table:
    | 'elections'
    | 'constituency_groups'
    | 'constituencies'
    | 'organizations'
    | 'question_categories'
    | 'questions'
    | 'candidates'
    | 'nominations'
): Array<FixedRow> {
  const fragment = base[table] as { fixed?: Array<FixedRow> } | undefined;
  return fragment?.fixed ?? [];
}

export const variantAllowopenTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,
  organizations: { count: 0, fixed: baseFixed('organizations') },
  elections: { count: 0, fixed: baseFixed('elections') },
  constituencies: { count: 0, fixed: baseFixed('constituencies') },
  constituency_groups: { count: 0, fixed: baseFixed('constituency_groups') },
  question_categories: { count: 0, fixed: baseFixed('question_categories') },
  // Mutate test-question-3 to allowOpen: false (was true in base e2e).
  questions: {
    count: 0,
    fixed: baseFixed('questions').map((row) => {
      if (row.external_id === 'test-question-3') {
        return {
          ...row,
          custom_data: { ...((row.custom_data ?? {}) as object), allowOpen: false }
        };
      }
      return row;
    })
  },
  candidates: { count: 0, fixed: baseFixed('candidates') },
  nominations: { count: 0, fixed: baseFixed('nominations') },
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-allowopen',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, ALLOWOPEN_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantAllowopenTemplate;
```

### `variant-hidden-required.ts` — SETTINGS-03

> Per CONTEXT D-03 + the canonical `variant-low-minimum-answers.ts` shape. Sets `customData.hidden: true` on a hand-picked Question (recommend `test-voter-q-8` or another opinion question NOT used by the existing voter-matching invariants); sets `customData.required: true` on an INFO question (e.g., `test-question-displayname` from Phase 76's fixture extension) AND ensures Alpha's answer for that info question is **DELETED** from the seed (so candidate logs in with the required field empty, triggering the LogoutButton warning).

```ts
/**
 * Hidden+Required variant template — overlay flips customData (SETTINGS-03).
 *
 * Spec contracts:
 *   - tests/tests/specs/voter/voter-visibility-required.spec.ts (SETTINGS-03 voter-hidden)
 *   - tests/tests/specs/candidate/candidate-required-info.spec.ts (SETTINGS-03 candidate-required)
 *
 * Base: BUILT_IN_TEMPLATES.e2e.
 *
 * Per CONTEXT LANDMINE-3: voter app does NOT enforce required-info-question
 * answers — only `matching.minimumAnswers` gates voter-results CTA. The
 * candidate-side surface (profileComplete) at candidateContext.svelte.ts:
 * 347-368 is the asserter-able required-question contract. SETTINGS-03's
 * voter-required cell is therefore PASS-WITH-DEFERRAL.
 *
 * Voter-side assertion (hidden):
 *   - Pick test-voter-q-8 (sort 16, last opinion question Voter answers).
 *   - Set customData.hidden: true.
 *   - voterContext.svelte.ts:215-230 filters it out of _opinionQuestions →
 *     question doesn't render in voter flow.
 *   - Assert: walk voter to /questions → expect(getByText('Voter Test Question 8: Social')).toHaveCount(0).
 *
 * Candidate-side assertion (required):
 *   - Pick test-question-displayname (Phase 76 anchor — already in fixture).
 *   - Set customData.required: true.
 *   - DELETE Alpha's answer for test-question-displayname (was 'Display Name Sentinel 76' per Phase 76).
 *   - candidateContext.svelte.ts:347-368: requiredInfoQuestions filters in
 *     this question → unansweredRequiredInfoQuestions includes it →
 *     profileComplete = false.
 *   - Assert: candidate logs in → navigates to /candidate (or attempts to log
 *     out) → LogoutButton.svelte:100 shows the "incomplete profile" warning.
 *
 * Overlay-row inventory:
 *   - questions: pass-through with custom_data mutations on test-voter-q-8
 *     (hidden: true) and test-question-displayname (required: true)
 *   - candidates: pass-through with Alpha's `test-question-displayname`
 *     answer DELETED (so candidate-required cell can assert the unanswered case)
 *   - everything else: pass-through
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-hidden-required: BUILT_IN_TEMPLATES.e2e is undefined.');

const HIDDEN_REQUIRED_APP_SETTINGS_OVERLAY = {
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  },
  // Disable the secondary clause in LogoutButton.svelte:100's profileComplete
  // condition so the required-info warning surfaces in isolation.
  entities: {
    hideIfMissingAnswers: { candidate: false }
  }
} as const;

type FixedRow = Record<string, unknown>;

function baseFixed(
  table:
    | 'elections'
    | 'constituency_groups'
    | 'constituencies'
    | 'organizations'
    | 'question_categories'
    | 'questions'
    | 'candidates'
    | 'nominations'
): Array<FixedRow> {
  const fragment = base[table] as { fixed?: Array<FixedRow> } | undefined;
  return fragment?.fixed ?? [];
}

export const variantHiddenRequiredTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,
  organizations: { count: 0, fixed: baseFixed('organizations') },
  elections: { count: 0, fixed: baseFixed('elections') },
  constituencies: { count: 0, fixed: baseFixed('constituencies') },
  constituency_groups: { count: 0, fixed: baseFixed('constituency_groups') },
  question_categories: { count: 0, fixed: baseFixed('question_categories') },
  // Mutate test-voter-q-8 to hidden: true; mutate test-question-displayname to required: true.
  questions: {
    count: 0,
    fixed: baseFixed('questions').map((row) => {
      if (row.external_id === 'test-voter-q-8') {
        return {
          ...row,
          custom_data: { ...((row.custom_data ?? {}) as object), hidden: true }
        };
      }
      if (row.external_id === 'test-question-displayname') {
        return {
          ...row,
          custom_data: { ...((row.custom_data ?? {}) as object), required: true }
        };
      }
      return row;
    })
  },
  // Delete Alpha's answer for test-question-displayname so the candidate-required
  // cell can assert the unanswered case.
  candidates: {
    count: 0,
    fixed: baseFixed('candidates').map((row) => {
      if (row.external_id === 'test-candidate-alpha') {
        const answers = { ...((row.answersByExternalId ?? {}) as Record<string, unknown>) };
        delete answers['test-question-displayname'];
        return { ...row, answersByExternalId: answers };
      }
      return row;
    })
  },
  nominations: { count: 0, fixed: baseFixed('nominations') },
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-hidden-required',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, HIDDEN_REQUIRED_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantHiddenRequiredTemplate;
```

**VERIFY at PLAN.md time:**
1. Whether `test-voter-q-8` being hidden affects voter-matching invariants — `voter-matching.spec.ts:212-216` asserts `oppose-cand` is lastCard at distance 64; removing one ordinal might shift to 56. Plan 04 author confirms voter-matching tests don't run against the variant project (they run against `voter-app` project, not `variant-hidden-required`).
2. Whether deleting Alpha's `test-question-displayname` answer breaks the existing CAND-12 / A11Y-02 tests — those run against `candidate-app-mutation` project, NOT `variant-hidden-required`. Should be safe but Plan 04 author confirms.

## SETTINGS-02 Persistence Path (Answer.info storage chain end-to-end)

> **Reframed per LANDMINE-1.** The original CONTEXT D-07 phrasing "voter authors comment text + persists across reload" is INACCURATE — voter app has no authoring surface for `answer.info`. What's actually testable is the entity-side display chain.

### Storage chain (entity comment authoring → voter display)

```
1. CANDIDATE authors comment in candidate questions page
   → apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:294-305
   → handleInfoChange({ info }) → setAnswer({ value, info }) → answer.info = info (line 190)
   → only IF customData.allowOpen is true (line 190 guard)
   → userData.setAnswer(question.id, answer) → userData.save() → Supabase update
   → candidates.answers JSONB[questionId].info column
   → ALREADY ASSERTED by CAND-12 (candidate-side reload-persistence)

2. VOTER opens entity-detail drawer for that candidate
   → apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/.../entity-detail
   → EntityDetails.svelte loads → opinions tab renders
   → EntityOpinions.svelte:38-81 iterates opinion questions
   → Per-question: const answer = nakedEntity.getAnswer(question)
   → Line 76: {#if answer?.info} <QuestionOpenAnswer content={answer.info} />
   → QuestionOpenAnswer.svelte:43-67 renders content inside <Expander>
   → If content is null/empty/whitespace, the {#if content && content.trim() !== ''} guard returns nothing.

3. Voter `answer.info` persistence
   → DOES NOT EXIST. answerStore.svelte.ts:19-37 setAnswer signature:
     `function setAnswer(questionId: string, value?: Answer['value']): void`
   → only `value` is accepted; `info` is never written.
   → localStorage key `VoterContext-answerStore` stores `Answers` shape (Record<id, { value }>),
     never with `info`.

CONCLUSION: SETTINGS-02 is about the ENTITY's comment surface gating, not the voter's
authoring/persistence. The "persists across reload" phrasing in CONTEXT D-07 #c
trivially holds for the entity-side because the data is server-side, not client-side.
```

### Reframed assertion shape for SETTINGS-02

```ts
// tests/tests/specs/voter/voter-allowopen.spec.ts — SETTINGS-02

test('SETTINGS-02 entity comment surface renders for allowOpen-true questions', async ({ page }) => {
  // Setup: variant-allowopen project; data-setup-allowopen has loaded the variant.
  // Walk voter to /results.
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  // ... navigate to /results/candidates/candidate/<alpha-id> drawer
  await page.getByTestId('entity-card-action').first().click();
  await page.waitForURL(/\/results\/candidates\/candidate\//);
  // Open opinions tab in drawer
  const drawer = page.getByTestId('voter-results-drawer');
  await drawer.getByRole('tab', { name: /opinion/i }).click();

  // Assert: <QuestionOpenAnswer> renders alpha's answer.info for test-question-1.
  // Alpha's info value: 'I believe progressive taxation helps reduce inequality.'
  await expect(drawer.getByText(/progressive taxation/i)).toBeVisible();
});

test('SETTINGS-02 entity comment surface present even when allowOpen flipped after authoring', async ({ page }) => {
  // The variant overlay flips test-question-3.allowOpen → false.
  // Alpha's pre-existing answer.info on test-question-3 is preserved in the seed.
  // The DISPLAY surface ALWAYS shows answer.info if it exists (EntityOpinions.svelte:76 has no allowOpen guard on read).
  await page.goto(/* ... */);
  const drawer = page.getByTestId('voter-results-drawer');
  await drawer.getByRole('tab', { name: /opinion/i }).click();
  await expect(drawer.getByText(/transition must be balanced/i)).toBeVisible();
  // This documents the architectural fact: customData.allowOpen gates CANDIDATE
  // AUTHORING, not voter display. Future product work could extend allowOpen to
  // gate voter display as well; for now SETTINGS-02 asserts the present contract.
});

test('SETTINGS-02 entity comment surface is absent when entity has no answer.info', async ({ page }) => {
  // Alpha has no answer.info on test-question-7 (only `value: '4'`).
  await page.goto(/* ... */);
  const drawer = page.getByTestId('voter-results-drawer');
  await drawer.getByRole('tab', { name: /opinion/i }).click();
  // Find the test-question-7 row and assert no QuestionOpenAnswer.
  const q7Row = drawer.getByText(/test opinion question 7/i).locator('..');
  // The QuestionOpenAnswer component renders inside .relative.grid.max-h-... ;
  // simplest assertion: no <Expander>-wrapped <span> with content quotes.
  await expect(q7Row.getByRole('region', { name: /comment|expand/i })).toHaveCount(0);
});
```

**RECOMMENDED:** Plan 03 author surfaces this reframing to operator at PLAN.md time. Either:
- (A) Accept reframed scope: SETTINGS-02 asserts the entity comment DISPLAY surface gating; CONTEXT D-07's "voter authors comment text" clause is documented as PRODUCT-GAP (would require adding `info` to voter `answerStore` + adding voter UI for open comments — neither is v2.9 scope).
- (B) Re-scope SETTINGS-02 to candidate-side only and DEFER voter-side entirely; but this duplicates CAND-12 (which already asserts candidate-side persistence). REJECT.
- (C) Add the voter-side authoring surface to the product as part of SETTINGS-02 — REJECT (out of v2.9 scope per ROADMAP "Phase 77 is content-heavy spec authoring + variant-fixture authoring on a stable suite — NOT new product behavior").

## SETTINGS-03 Candidate-side vs. Voter-side Surface Audit

| Side | Symbol | Location | Status |
|------|--------|----------|--------|
| **Candidate-side `customData.required`** | `requiredInfoQuestions`, `unansweredRequiredInfoQuestions`, `profileComplete` | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-368` + type at `candidateContext.type.ts:156,168` | **ASSERTER-ABLE.** `LogoutButton.svelte:100` warning surfaces; `candidate/(protected)/questions/+page.svelte:77` shows preview-page CTAs branched on the same condition. |
| **Voter-side `customData.required`** | (none — symbol does not exist on voterContext) | NOT in `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (verified via `grep -n "requiredInfoQuestions\|unansweredOpinion\|profileComplete" voterContext.svelte.ts` — only `minAnswers` is present) | **PRODUCT-GAP.** Voter has NO required-info-question gating surface. The only voter "must-answer" enforcement is `matching.minimumAnswers` threshold (covered by Phase 74 E2E-02). |
| **Voter-side `customData.hidden`** | `_infoQuestions` + `_opinionQuestions` filter | `voterContext.svelte.ts:221, 226` (`.filter((q) => !(q.customData as CustomData['Question'])?.hidden)`) | **ASSERTER-ABLE.** Hidden question's external_id absent from voter question flow + voter-detail drawer opinions tab. |
| **Candidate-side `customData.hidden`** | (no filter — all questions render in candidate flow regardless of `hidden`) | Per CONTEXT line 220 doc: "If `true`, the question will be hidden in the Voter App but still visible in the Candidate App." | NOT a candidate-side gate. SETTINGS-03 candidate-side asserts only `required`, not `hidden`. |

**CLAUDE.md `Context Destructuring Rule (Svelte 5)` mention:** The rule lists `requiredInfoQuestions` and `unansweredOpinionQuestions` as "Reactive accessors" (line ~262) — but careful reading of the surrounding context shows the rule is about the destructuring HAZARD, NOT the existence of these symbols on every context. The CLAUDE.md text is referring to the symbols ON the candidate context. Voter context never had these. **CONTEXT D-08's claim "the analogous voter-side `requiredInfoQuestions` / `unansweredOpinionQuestions` contracts" is incorrect** — only the candidate context exposes these.

**Plan 04 recommended split:**
- **Voter-hidden cell** (`tests/tests/specs/voter/voter-visibility-required.spec.ts`): walks voter through /questions in `variant-hidden-required` project → asserts `expect(getByText('Voter Test Question 8: Social')).toHaveCount(0)`. PASS.
- **Candidate-required cell** (`tests/tests/specs/candidate/candidate-required-info.spec.ts`): logs in as Alpha (whose `test-question-displayname` answer is deleted by the variant overlay) → navigates to `/candidate` home → asserts `LogoutButton`'s warning visible. The variant project must use `auth-setup` storageState chain — verify the variant project chains correctly to `auth-setup`.
- **Voter-required cell:** PASS-WITH-DEFERRAL. Capture follow-up todo at Plan 04 close: `2026-05-13-voter-required-info-product-gap.md` (would require adding `unansweredRequiredInfoQuestions` to voter context + a gating mechanism on voter-results CTA — not v2.9 scope).

## Carry-Forward LANDMINEs from Phase 76

> Phase 76 deferred-items.md + Phase 76 P01/P02 SUMMARY findings — Phase 77 inherits.

### LANDMINE-A: IMGPROXY_TIED_TITLES safety

**Source:** `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` (referenced from `tests/scripts/diff-playwright-reports.ts:78-83`).

**Risk:** The parity-script's `regen-constants.mjs` classifies tests by `endsWith` matching — adding a new test whose title ends with one of the 14 IMGPROXY-tied patterns could pollute the DATA_RACE pool.

**Mitigation:** ALL Phase 77 test titles MUST be prefixed with `'SETTINGS-01 '` / `'SETTINGS-02 '` / `'SETTINGS-03 '` (per Phase 76 LANDMINE-3 inheritance). The prefix breaks any accidental endsWith collision. Plan 01 / 02 / 03 / 04 authors verify at PLAN.md time.

**Verification at Plan 05 (verification gate):** Before constants regen, audit new test titles against the 14 IMGPROXY patterns. Document audit result in `77-VERIFICATION.md`.

### LANDMINE-B: Seed protocol — `yarn dev:reset-with-data` loads `default` template, NOT `e2e`

**Source:** Phase 75 P02a finding documented in STATE.md line 142: "Plan 75-02a: yarn dev:reset-with-data seeds default template — Phase 75 Plan 02b verification gate should use 'yarn supabase:reset && yarn dev:seed --template e2e' instead."

**Risk:** Plan 05's verification gate using `yarn dev:reset-with-data` would seed the wrong dataset, causing the 3-run smoke to be invalid.

**Mitigation:** Plan 05 verification gate MUST use:
```bash
rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit
yarn supabase:reset
yarn dev:seed --template e2e
yarn test:e2e --workers=1 --reporter=html
```
Document recipe in `77-VERIFICATION.md`.

### LANDMINE-C: Sentinel-value disjointness rule (Plan 01 P01 fixture-extension fix)

**Source:** `packages/dev-seed/src/templates/e2e.ts:705-718` comment block — Phase 76 P01 added 3 sentinel values to the e2e fixture and CRITICALLY disjointed them from `'Alpha'` substring to avoid CAND-06 strict-mode collision at `candidate-questions.spec.ts:271`.

**Risk:** SETTINGS-01 wave A test titles, SETTINGS-02 spec assertions, OR variant overlay sentinel strings could contain `'Alpha'` substring → CAND-06 `getByText('Alpha', { exact: false })` strict-mode finds multiple → test fails.

**Mitigation:** ALL Phase 77 sentinel strings MUST NOT contain `'alpha'`/`'Alpha'` (case-insensitive substring). Use sentinel pattern `'Sentinel 77 ...'` per Phase 76 precedent. Plan 01 / 02 / 03 / 04 authors verify.

### LANDMINE-D: Auth-setup cold-start race (Phase 76 deferred-items #2)

**Source:** `.planning/phases/76-profile-a11y/deferred-items.md` item #2 — `candidate-profile.spec.ts:85-145` registration test fails deterministically in the dev shell; cascade impact on the serial describe block.

**Risk:** Plan 01 wave A EXTENDS `candidate-settings.spec.ts` which lives in the `candidate-app-settings` project (`playwright.config.ts:140-151`). The project chain depends on `re-auth-setup` → `candidate-app-mutation` (line 137). If `candidate-app-mutation` registration test fails (Phase 76 deferred-items #2), the cascade affects ALL downstream candidate tests including Plan 01 wave A.

**Mitigation:**
- Plan 01 wave A spec extension uses Alpha's pre-registered credentials (per Phase 76 P01 / `candidate-profile-validation.spec.ts` precedent) — does NOT depend on the registration flow.
- Plan 05 verification gate triages: if registration cascade is still active, document as PASS-WITH-DEFERRAL on relevant SETTINGS-01 cells (mirrors Phase 76 P02 outcome).
- File reference: any fix lands in Phase 78 / CLEAN-05 (registration-redirect-race triage scoped per Phase 76 deferred-items #2 recommendation #1).

### LANDMINE-E: Plan 04 candidate-required spec testMatch regex

**Source:** Phase 76 deferred-items.md item #3 — `playwright.config.ts:124` regex needed extension for new `candidate-profile-validation.spec.ts` to be picked up by the project filter.

**Risk:** New `tests/tests/specs/candidate/candidate-required-info.spec.ts` (Plan 04) would be silently ignored if the project's testMatch regex doesn't include `candidate-required-info`. The `candidate-app-mutation` project (line 124) currently matches `/candidate-(registration|profile|profile-validation)\.spec\.ts/`.

**Mitigation:** Plan 04 EITHER (a) extends the regex to include `required-info` (and the spec uses Alpha credentials, NOT registration); OR (b) adds the spec to a new variant project's testMatch (e.g., `variant-hidden-required` testDir already filters to `tests/specs/candidate/`). Per CONTEXT D-13's variant-project pattern, **Option (b)** is cleaner — the candidate-required spec naturally belongs in the variant project (it asserts against the variant's overlay).

## Risks & Landmines (Phase 77-specific)

### LANDMINE-1 (CRITICAL — overrides CONTEXT D-07): SETTINGS-02 voter-side authoring is a PRODUCT-GAP

**See §"SETTINGS-02 Persistence Path" above.** CONTEXT D-07 #b "voter can author comment text" + #c "comment persists across reload (matching CAND-12 candidate-side persistence pattern)" both describe a surface that does not exist:

- **Voter answerStore** (`apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:19-37`) signature: `setAnswer(questionId: string, value?: Answer['value'])` — `info` is NEVER stored.
- **Voter question page** (`apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:114-118`) handler: `function handleAnswer({ question, value })` — only `value`, no `info` parameter.
- **Voter localStorage** key `VoterContext-answerStore` stores `Answers` shape (`Record<id, { value }>`) — `info` never appears.

**Plan 03 must reframe SETTINGS-02 to the entity-display surface (per §"SETTINGS-02 Persistence Path" reframed assertion shape).** Optionally, file a follow-up todo at phase close: `2026-05-13-voter-allowopen-authoring-product-gap.md` to capture the gap for future product work.

### LANDMINE-2 (CRITICAL — fixture pre-condition for Plan 02): No question in e2e template has `customData.filterable: true`

**See §"Filter-Type Matrix Concrete Shapes" above.** `filterStore.svelte.ts:58-61` builds question filters ONLY from questions with `getCustomData(q).filterable`. Verified: `grep filterable packages/dev-seed/src/templates/e2e.ts` returns 0 hits. The e2e template carries the flag NOWHERE.

**Plan 02 MUST add `customData: { filterable: true }` to:**
- `test-question-text` (sort 8) — for TextFilter cell
- `test-question-directional-1` (sort 17) — for ChoiceQuestionFilter (categorical) cell
- `test-question-number-1` (NEW at sort 22) — for NumberFilter cell

Without these flags, the filter-type cells would assert against UI surfaces that do NOT render in the product → false negatives.

### LANDMINE-3 (CRITICAL — overrides CONTEXT D-08): Voter-side `customData.required` is a PRODUCT-GAP

**See §"SETTINGS-03 Candidate-side vs. Voter-side Surface Audit" above.** CONTEXT D-08's claim that the voter context has analogous required-question contracts is incorrect — only `candidateContext` exposes `requiredInfoQuestions` / `unansweredRequiredInfoQuestions` / `profileComplete`. CLAUDE.md's mention of these symbols refers to the CANDIDATE context.

**Plan 04 must capture as PASS-WITH-DEFERRAL** (mirrors Phase 74 D-04 / Phase 75 D-03 / Phase 76 D-06 PRODUCT-GAP precedents). File follow-up todo: `2026-05-13-voter-required-info-product-gap.md`.

### LANDMINE-4: FilterGroup OR-mode is not exposed in voter UI

**See §"Filter-Type Matrix Concrete Shapes" — FilterGroup OR row.** `EntityFilters.svelte` does not render an AND/OR mode-toggle. The `FilterGroup.logicOperator` setter is API-only.

**Plan 02 must capture as PASS-WITH-DEFERRAL** per CONTEXT D-08 PASS-WITH-DEFERRAL fallback. File follow-up todo: `2026-05-13-filtergroup-or-mode-ui-product-gap.md`.

### LANDMINE-5: SHALLOW vs. DEEP merge confusion

**Source:** `variant-low-minimum-answers.ts:39-46` Pitfall 4 comment: "DEEP merge from `@openvaa/app-shared`, NOT `mergeAppSettings` from frontend (the latter is SHALLOW per PATTERNS Pitfall 4)".

**Risk:** Plans 03 + 04 variant templates importing the wrong `mergeSettings` would clobber base settings (e.g., `results.cardContents`, `results.sections`, `header.*`).

**Mitigation:** Variant templates MUST `import { mergeSettings } from '@openvaa/app-shared'`. Plans 03 / 04 author verifies.

### LANDMINE-6: Variant project dependency chain (Pitfall 5)

**Source:** Phase 74 D-13 pattern + `playwright.config.ts:280, 297, 314` — variant projects chain SEQUENTIALLY (`variant-startfromcg` → `variant-low-minimum-answers` → `variant-1e-Nc` → `variant-Ne-Nc`).

**Risk:** Plans 03 + 04 add 2 new variant projects. If they are added in PARALLEL (no sequential dependency), the variant-data-setup races may conflict.

**Mitigation:** Plans 03 + 04 chain new variants AFTER `variant-Ne-Nc`:
- `data-setup-allowopen` depends on `variant-Ne-Nc`
- `variant-allowopen` depends on `data-setup-allowopen`
- `data-setup-hidden-required` depends on `variant-allowopen`
- `variant-hidden-required` depends on `data-setup-hidden-required`

This serial chain matches the pattern at `playwright.config.ts:280` and is the established Phase 74 + Phase 76 contract.

### LANDMINE-7: Constants regen — IMGPROXY_TIED_TITLES audit

**Source:** Phase 76 D-10 + Phase 75 D-08 + Phase 74 D-10 inheritance.

**Risk:** Plan 05 constants regen pulls new PASS_LOCKED entries; if any new test title accidentally ends with an IMGPROXY-tied pattern, it gets pooled into DATA_RACE (Pool MUST NOT grow per CONTEXT D-09).

**Mitigation:** See LANDMINE-A above (mitigation: SETTINGS-XX prefix on every test title). Plan 05 audits before regen.

### LANDMINE-8: Multi-toggle interaction effects in Plan 01 wave A

**Source:** SETTINGS-01 wave A applies overlays via `updateAppSettings()` to a SHARED app-settings row. The `candidate-app-settings` project enforces serial mode but consecutive overlays may interact.

**Risk:** Cell N's overlay leaves residual state if `test.afterAll()` doesn't fire (e.g., on test failure). Cell N+1 starts with polluted state.

**Mitigation:** Each `test.describe` block in `candidate-settings.spec.ts` already follows the pattern of `test.afterAll(() => updateAppSettings(defaults))` — Plan 01 inherits. Each new cell either:
- (a) Uses an isolated `test.describe` block with its own `afterAll()` reset (matches CAND-09/10/11 pattern); OR
- (b) The parameterized `for (const cell of cells)` runs each cell inside a `test.beforeEach()` overlay + `test.afterEach()` reset.

Default: (a) for clarity.

## Open Questions

> Each question has a recommendation. Per Dimension 11 contract (Phase 76 plan-checker BLOCKER precedent), these MUST be marked RESOLVED at PLAN.md time before plan-checker passes.

### OQ-1: SETTINGS-02 reframing — does operator accept the LANDMINE-1 reframing?

**What we know:** Voter app has no authoring surface for `answer.info`. CONTEXT D-07's "voter authors comment text" is factually inaccurate; only the entity-display side is asserter-able today.

**What's unclear:** Whether Plan 03 should:
- (A) Accept the reframed scope (assert entity comment DISPLAY surface) + file follow-up todo for the authoring-surface PRODUCT-GAP
- (B) Re-scope SETTINGS-02 entirely as PASS-WITH-DEFERRAL on the v2.0 milestone-notes gap claim (cite-and-fix in v2.10+)

**Recommendation:** (A) — the entity-display surface IS asserter-able and IS a meaningful contract (voter sees entity's comment when entity authored one). The CONTEXT framing is a phrasing error; the underlying SC #2 in REQUIREMENTS ("voter can author comment text") is the actual product gap.

**MUST be marked RESOLVED at PLAN.md time** before Plan 03 proceeds.

### OQ-2: Plan 02 fixture extension — Number question `min`/`max` shape

**What we know:** `numberQuestion.ts:47-56` reads `min` and `max` from question data; the question is matchable + filter-renderable when both exist. No number-typed question currently exists in any template.

**What's unclear:** Whether the `min`/`max` fields are top-level columns on the question row OR nested in `customData`. The defaults template at `packages/dev-seed/src/templates/defaults/questions-override.ts` only handles ordinal + categorical + boolean — no number example.

**Recommendation:** Plan 02 author reads `numberQuestion.ts` test file (`numberQuestion.test.ts`) at PLAN.md time to confirm the field shape. Likely top-level columns based on the `get min(): number | null` getter pattern. Capture finding in Plan 02 RESEARCH or PLAN.

**MUST be marked RESOLVED at PLAN.md time.**

### OQ-3: Plan 04 candidate-required spec — testMatch project assignment

**What we know:** New `tests/tests/specs/candidate/candidate-required-info.spec.ts` needs project assignment. Two options:
- (A) Extend `candidate-app-mutation` testMatch regex (line 124) to include `required-info`; spec uses Alpha credentials.
- (B) Place spec inside the `variant-hidden-required` project's testMatch (since the spec asserts against the variant overlay).

**What's unclear:** Whether `variant-hidden-required` project includes a candidate-app storageState dependency (auth-setup chain). Per LANDMINE-D, registration cascade affects candidate-app-mutation; using a variant project instead may sidestep that risk.

**Recommendation:** (B) — place spec in the variant project. The variant project depends on `data-setup-hidden-required` which depends on `variant-Ne-Nc` (per LANDMINE-6 chain). Add a separate auth-setup chain for the variant if needed: `data-setup-hidden-required` → `variant-hidden-required-auth-setup` → `variant-hidden-required-candidate` (project-name granularity). Plan 04 author confirms storageState dependency at PLAN.md time.

**MUST be marked RESOLVED at PLAN.md time.**

### OQ-4: Plan 01 wave A — bundle the access-control trio (#1 voterApp + #2 adminApp) OR defer adminApp?

**What we know:** `access.adminApp` controls admin app routes. The admin app may not have e2e fixture coverage today (verified — `tests/tests/specs/admin/` does not exist).

**What's unclear:** Whether the admin-app surface is reachable from a voter-app or candidate-app spec context.

**Recommendation:** Plan 01 author confirms at PLAN.md time. If admin app surface not reachable in e2e, capture as PASS-WITH-DEFERRAL on cell #2; cover only `voterApp` in wave A. Adjust cell count from ~12-15 to ~11-14.

**MUST be marked RESOLVED at PLAN.md time.**

### OQ-5: Plan 02 — constituency filter surface verification

**What we know:** `variant-constituency` project exists (`tests/tests/specs/variants/constituency.spec.ts`). Constituency-based filtering is enabled by `buildParentFilters` (`buildParentFilters.ts:9-13`) which references `'alliance'`, `'faction'`, `'organization'` parent types — NOT constituency. Constituency may not surface as a top-level voter filter.

**What's unclear:** Whether constituency renders as a separate filter in the entity-filter dialog (vs. being part of the navigation surface only).

**Recommendation:** Plan 02 author probes the existing `variant-constituency` project's filter UI at PLAN.md time. If constituency does NOT render as a filter, capture as PASS-WITH-DEFERRAL; the cell becomes additive coverage of the constituency-as-navigation surface only (which is partially covered by `constituency.spec.ts` CONF-03 already).

**MUST be marked RESOLVED at PLAN.md time.**

### OQ-6: Are `results.showFeedbackPopup` + `results.showSurveyPopup` already covered by `voter-popups.spec.ts`?

**What we know:** Existing `voter-popups.spec.ts` runs in the `voter-app-popups` project (settings-mutating). It likely covers popup-display behavior since it inherits the data-popups race-tolerance work from Phase 76 P03.

**What's unclear:** Whether the existing tests cover the toggle binary-effect (popup ON when setting non-null + OFF when null) OR only the popup-content surface.

**Recommendation:** Plan 01 author reads `voter-popups.spec.ts` at PLAN.md time. If toggles are covered, defer cells #23 + #24; if only content is covered, add toggle assertions to wave A. Either way, NO duplication.

**MUST be marked RESOLVED at PLAN.md time.**

---

> **NOTE TO PLANNER + DISCUSS-PHASE:** Open Questions above MUST be marked RESOLVED before plan-checker passes (per the Phase 76 plan-checker BLOCKER precedent on Dimension 11). Each PLAN.md should include a "Resolved Open Questions" section citing the resolution + source for each OQ-N from this RESEARCH.md.

## RESEARCH COMPLETE
