---
phase: 88
plan: 88-04
subsystem: tests + dev-seed + frontend (testids only)
tags: [tir3, fixtures, option-b, seed-time-resolver, voter-mega-journey]
requires:
  - phase: 88
    plan: 88-01
    provides: baseV1 BUILT_IN template + voter-mega-journey project chain
  - phase: 88
    plan: 88-03
    provides: rigidity precedent (no expect.soft / no try/catch around expect / no [*-followup] markers)
  - quick-task: 260527-nat
    provides: T1 categorical-filter library semantics + T2 baseV1 [<id>] desc rename
provides:
  - ADR-88-04-01 (cardContents.candidate external_id resolution — Option B seed-time)
  - dev-seed-internal TemplateQuestionInCardContent type widening
  - resolveAppSettingsExternalIds pure-function resolver (+ settingsContainsExternalIdRefs gate)
  - selectQuestionExternalIds method on SupabaseAdminClient
  - 12 new testid surface for results-page fixtures
  - 3-file fixtures library (resultsPage / entityFilters / entityDetails) + views.ts composition root
  - Refactored / added 6 cells in voter-mega-journey.spec.ts (T5 EDIT + T6 ADD + T7 REFACTOR matrix + T7 REFACTOR org-details + T8 ADD text + T8 ADD dialog)
  - TEXT_RE cleanup (8 DROP + 2 TIGHTEN + 34 KEEP)
affects:
  - "Future 88-NN plans may consume views.ts for additional spec migrations"
  - "Follow-up TODO (v2.11+ candidate): refactor QuestionInCardContent + results-cards settings to be election-specific. The dev-seed Writer's seed-time resolver from this plan may be retired or refactored when the election-specific surface lands"
tech-stack:
  added:
    - "Playwright function-fixture pattern via @playwright/test's base.extend (sibling to legacy Page-Object fixtures)"
  patterns:
    - "Option B seed-time {externalId} → UUID resolution at the dev-seed Writer Pass-5 boundary; public type stays narrow"
    - "Conditional EntityCard testid: 'entity-card' for outer, 'entity-card-subcard' for subcards (variant-driven discriminator at the Svelte source)"
    - "Filter-row auto-expansion in entityFilters fixture (Expander.svelte's defaultExpanded is false by default; fixture probes and clicks the toggle)"
key-files:
  created:
    - .planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-ADR-cardContents-resolver.md
    - packages/dev-seed/src/templates/types.ts
    - packages/dev-seed/src/resolveAppSettingsExternalIds.ts
    - packages/dev-seed/tests/resolveAppSettingsExternalIds.test.ts
    - tests/tests/fixtures/resultsPage.fixture.ts
    - tests/tests/fixtures/entityFilters.fixture.ts
    - tests/tests/fixtures/entityDetails.fixture.ts
    - tests/tests/fixtures/views.ts
  modified:
    - packages/dev-seed/src/templates/baseV1.ts (Wave 0 filterable flip + T4 cardContents wiring)
    - packages/dev-seed/src/writer.ts (Pass-5 resolver splice)
    - packages/dev-seed/src/supabaseAdminClient.ts (selectQuestionExternalIds method)
    - packages/dev-seed/src/index.ts (resolver exports)
    - apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte (testid)
    - apps/frontend/src/lib/components/subMatches/SubMatches.svelte (testid)
    - apps/frontend/src/lib/components/electionSymbol/ElectionSymbol.svelte (testid)
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte (4 testids)
    - apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte (testid)
    - apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte (testid)
    - apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte (2 testids)
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte (conditional testid)
    - tests/tests/utils/testIds.ts (12 new testid constants + 6 previously-unregistered literals + allianceSection)
    - tests/tests/specs/voter/voter-mega-journey.spec.ts (T5-T9)
    - tests/tests/setup/setupFromTemplate.ts (Option B-aware post-seed assertion)
decisions:
  - "Option B (seed-time resolution in dev-seed Writer Pass-5) for cardContents.candidate external_id resolution. REJECTS Option A. Public type stays narrow."
  - "Wave-0 baseV1 edit: flip test-qu-info-boolean.custom_data.filterable from true to false (one-character edit at baseV1.ts:683) to align baseV1 with TIR3 T8 3-filter contract"
  - "Fixture partition: 3 files (resultsPage / entityFilters bundling dialog+filter / entityDetails) + NEW views.ts composition root sibling to legacy index.ts"
  - "Conditional testid on EntityCard.svelte: variant === 'subcard' → 'entity-card-subcard'; else 'entity-card'. Outer + subcard cards distinguishable; no hasNot filter needed downstream."
  - "Matrix step's expectQuestionDisplayToHave helper bypassed in favour of entityDetails.expectQuestionDisplay's filter({ hasText: target }) approach — the legacy filter({ has: getByRole('heading', { level: 3, name: regex }) }) failed against post-T2 [<id>] prefixed heading text."
metrics:
  duration_minutes: 69
  task_count: 14  # 14 atomic commits
  files_changed_in_plan: 24
  completed_date: 2026-05-28
---

# Phase 88 Plan 04: TIR3 T3-T9 — cardContents Option B resolver + fixtures library + voter-mega-journey cell refactor — Summary

Settings-resolution ADR + dev-seed-internal Option B `{externalId}` → UUID seed-time resolver + 12 frontend testid additions + 3-file Playwright function-fixtures library (resultsPage / entityFilters / entityDetails + views.ts composition root) + 6 cell migrations in `voter-mega-journey.spec.ts` (T5 EDIT + T6 ADD + T7 REFACTOR matrix + T7 REFACTOR organisation details + T8 ADD filters:text + T8 ADD filters:dialog) + TEXT_RE cleanup (8 DROP + 2 TIGHTEN).

## Deliverables landed

**Wave 0 — Verification probes + baseV1 prep (Task 1, commit `3c0d73292`):**
- 5 probe outcomes captured in `88-04-WAVE0-PROBES.txt` (scratch, not committed):
  - Probe 1 PASS: `questions.external_id` DB column exists at `packages/supabase-types/src/database.ts:952` (Option B's Writer SELECT prerequisite met).
  - Probe 2 PASS: Modal.svelte forwards restProps via `concatClass` to ModalContainer's `<dialog>` element. Testid can land as a prop on `<Modal>` (no wrapper needed).
  - Probe 3 PASS: Expander.svelte forwards restProps via `concatClass` to the outer `<div>`. Testid can land as a prop on `<Expander>`.
  - Probe 4 PASS: `voter-results-election-select` accordion's inner clickable is `<button role="option">`. Use `getByRole('option', { name: <regex> })` inside the testid scope.
  - Probe 5 PASS: `test-ca-aa-hidden` is hidden via `terms_of_use_accepted` absent (baseV1.ts:902), confirming 5 visible Party-AA members under EL-Reg/CO-Reg-N.
- baseV1 flip: `test-qu-info-boolean.custom_data.filterable: true → false` at line 683.

**Wave 1 — T3 ADR + Option B landing (Tasks 2-4, commits `33ab92795` + `ff061f9cb` + `ede7d41ef` + `f1828e1bd`):**
- `88-04-ADR-cardContents-resolver.md` codifies **Option B (seed-time)**. Rejects Option A based on the planned election-specific cardContents refactor (follow-up TODO) making public type widening premature.
- Dev-seed-internal `TemplateQuestionInCardContent` widening (`packages/dev-seed/src/templates/types.ts`) accepts `string | { externalId: string }`.
- Pure-function `resolveAppSettingsExternalIds(settings, externalIdToUuid)` + `settingsContainsExternalIdRefs(settings)` gate (`packages/dev-seed/src/resolveAppSettingsExternalIds.ts`) — covered by 12 Vitest unit cases.
- Writer Pass-5 splice (`packages/dev-seed/src/writer.ts`): cheap pre-walk gates the questions-table SELECT; resolved payload is passed to `updateAppSettings`. New method `selectQuestionExternalIds(): Promise<Map<string, string>>` on `SupabaseAdminClient` mirrors `importAnswers`'s map-build precedent.
- baseV1.ts:204 — `candidate: ['submatches', { question: { externalId: 'test-qu-info-text' } }]`. Persisted JSONB post-seed contains a plain UUID string (verified via psql: `["submatches", {"question": "<uuid>"}]`); the `{externalId}` shape NEVER reaches the DB.
- Public `@openvaa/app-shared` `QuestionInCardContent.question: string` UNCHANGED. Frontend `entityCards.ts` + `EntityCard.svelte` call site UNCHANGED.

**Wave 1.5 — Testid surgery (Task 5, commit `ccac7691a`):**
- 12 new testids added per RESEARCH R-2 placement (gated by Probes 2 + 3 outcomes — Modal+Expander forward restProps so testids land as props, no wrappers).
- testIds.ts registry: 12 NEW constants under `testIds.voter.results` + 6 previously-unregistered literals (`listControls`, `listSearch`, `listWithControls`, `filterButton`, `entityDetails`, `infoItem`) + `allianceSection`.
- EntityCard.svelte conditional testid: `'entity-card'` for outer cards, `'entity-card-subcard'` for the recursive `variant='subcard'` invocation (per RESEARCH R-6). No existing spec breaks (only `a11y-smoke.spec.ts:118-119` consumes `entity-card` via `.first()` which still resolves to outer cards).

**Wave 2 — Fixtures library (Task 6, commit `339c365a3`):**
- `resultsPage.fixture.ts`: 7 helpers per SCOPE T4 (`selectElection` + `selectEntityTab` + `expectEntityTabs` + `getEntityCards` + `getEntityCard` + `dismissAllDialogs` + `openEntityDetailsForCard`).
- `entityFilters.fixture.ts`: bundles entityFilters + entityFilterDialog + entityFilter per RESEARCH R-4. Top-level (`getTextFilter` / `setTextFilter` / `clearTextFilter` / `openFilterDialog` / `getFilterButtonBadge`) + dialog-scoped (`getFilters` / `getFilter` / `expectResetToBeDisabled` / `close` / `reset`) + filter-scoped (`getOptions` / `getOption` / `setSelection` / `setNumberRange`).
- `entityDetails.fixture.ts`: 7 helpers (`selectTab` / `expectTabs` / `getInfoItems` / `expectInfoItem` / `getQuestionDisplays` / `expectQuestionDisplay` / `getMemberCards`). SETTINGS keywords map to i18n labels internally per RESEARCH R-3 secondary divergence.
- `views.ts`: composition root sibling to legacy `index.ts`. Legacy `index.ts` + `voter.fixture.ts` + `voter-mega.fixture.ts` are BYTE-IDENTICAL.

**Wave 3 — T5/T6/T7/T8 cell migrations (Tasks 7a-7d, commits `312ff71fa` + `3e95f8f19` + `87e867391` + `d91a3d9ff`):**
- T5 `result-card-contents` REFACTORED to use fixtures. Asserts first-card matches `/Polar-Max/i` + test-qu-info-text answer rendered + 4 score-gauges in submatches + election-symbol `10`. Removed redundant "switch to parties + ≥1 org card" block.
- T6 ADD `matching: organisations`: 5 outer org-cards under EL-Reg/CO-Reg-N + Party BB has 2 subcards (no Show-all) + Party AA has 3 default → Show-all-5 → 5 → Collapse → 3 → Show-all-5 visible again. RESEARCH-locked counts.
- T7 REFACTOR `candidate details: 9.6.5-8 voter-vs-entity matrix on CA-AA-Special`: removed redundant `detail: drawer open` + `detail: Polar-Max info-items` cells; matrix step opens CA-AA-Special drawer + asserts 13 info-items (preserved from prior, regex matchers) + 4 voter-vs-entity matrix points via `entityDetails.expectQuestionDisplay` (the new fixture method — see Decisions).
- T7 REFACTOR `party-drawer` → `organisation details`: uses fixtures. `expectTabs([info, children, opinions])` + 3 info-items via regex (`Election` / `Constituency` / `Alliance`) + 5 member-cards.
- T8 ADD `filters: text`: setTextFilter('polar') → 2 cards (Polar-Max + Polar-Min). 3 hard assertions.
- T8 ADD `filters: dialog`: 7-stage choreography (3 filter rows / 1 NoAns / 13 reset / 12 pick A|B / 1 years≥50 / 0 intersect / reset). RESEARCH-locked counts.
- T8 REMOVED 3 redundant cells (already moved to other phases per SCOPE).

**Wave 4 — T9 TEXT_RE cleanup (Task 8, commit `83cb6f629`):**
- 8 DROP entries removed (zero residual consumers verified): `opinion`, `regionalElection`, `munSeSw`, `filtMunNe`, `filtPerQuestionSe`, `filtMunSe`, `matchPercent`, `perfectMatchTier`, `resultsRoute`.
- 2 TIGHTEN entries updated with `[<id>]` prefix per RESEARCH R-3:
  - `optionalOpinionsA` → `/\[qg-opin-opt-a-NotSelected\] Optional Opinion Questions A/i`
  - `optionalOpinionsB` → `/\[qg-opin-opt-b-Skipped\] Optional Opinion Questions B/i`
- 34 KEEP entries unchanged.

**Wave 5 — Integration gate fixes (Task 9, commits `8415b46b5` + `94f8517a2`):**
Five Rule 1 fixes uncovered during the cold-start `voter-mega-journey` run:
- `tests/tests/setup/setupFromTemplate.ts`: post-seed toMatchObject was comparing the raw template (with `{externalId}` refs) against the persisted JSONB (with resolved UUIDs). Fixed by importing `resolveAppSettingsExternalIds` from `@openvaa/dev-seed` and pre-flattening the expected payload before comparison. Required adding the resolver to the dev-seed package's public exports.
- Removed spurious `filter({ hasNot: getByTestId('entity-card-subcard') })` on `getEntityCards()` and `getMemberCards()` — the Wave 1.5 conditional testid means `getByTestId('entity-card')` ALREADY excludes subcards; the hasNot filter was incorrectly excluding outer cards that CONTAINED subcards as descendants.
- `selectEntityTab` hardened to await section visibility post-click (eliminates tab-switch transition race).
- `openEntityDetailsForCard` clicks the FIRST `entity-card-action` descendant — when subcards exist, the outer `<article>` is NOT click-navigable (only the inner header gets an EntityCardAction link wrap).
- `expectQuestionDisplay` refactored to use `filter({ hasText: target })` on the entity-opinion-question div directly. The legacy `filter({ has: getByRole('heading', { level: 3, name: regex }) })` failed against the post-T2 `[<id>]` heading prefix.
- `openFilterDialog` switched from `getByTestId('entity-filter-dialog')` to `getByRole('dialog', { name: /Filters/i })` — empirically the Modal's restProps-forwarded testid didn't reliably resolve at runtime.
- `getFilter` auto-expands the Expander row when collapsed (Expander defaults `defaultExpanded` to false for non-active filters).
- Unicode-apostrophe fix to `TEXT_RE.neitherAnswered` and matrix-step infoText regexes (`hasn['‘’]?t answered` to accept U+2019).
- `TIMEOUT.testMax` bumped 50_000 → 120_000 to absorb the new cells' per-step costs.

## Acceptance criteria status (per 88-04-SCOPE.md acceptance #1-#10)

1. **ADR before code:** PASS — `88-04-ADR-cardContents-resolver.md` committed at `33ab92795` BEFORE Tasks 3 (`ff061f9cb` / `ede7d41ef`) + Task 4 (`f1828e1bd`).
2. **No hardcoded UUIDs in baseV1.ts:** PASS — `grep -E "candidate:\\s*\\[.*['\"][0-9a-f]{8}-[0-9a-f]{4}" packages/dev-seed/src/templates/baseV1.ts` → 0 hits. Persisted JSONB verified via psql to contain plain UUID (not `{externalId}` shape).
3. **Fixtures exist:** PASS — 4 files at the documented paths, each exports the SCOPE T4 signatures.
4. **≥3 fixture-consuming cells:** PASS — 6 cells, 33+ fixture-method invocations.
5. **Cell counts match baseV1 reality:** PASS — T5 / T6 / T7-matrix / T7-org-details / T8-filters:text + T8 all 7 stages (1–7) cold-start green after the post-SUMMARY T8 fix (commit `aaffe7d11`).
6. **Rigidity:** PASS within 88-04's added/refactored cells. Zero `expect.soft` / zero `[*-followup]` markers / zero try/catch around expect / .catch only on best-effort cleanup helpers (which precede hard assertions). Pre-existing soft-gates / followup markers in the 88-01 elections / constituencies steps are out-of-scope per SCOPE acceptance #10.
7. **TEXT_RE has no dead entries:** PASS — 8 DROP entries removed; for each, `grep -c "TEXT_RE\\.<entry>"` returns 0. 34 KEEP entries each have ≥1 consumer.
8. **Cold-start green:** PASS — voter-mega-journey project run passes 34 of 34 sub-tasks cold-start (`yarn db:reset && yarn db:seed --template baseV1 && cd tests && npx playwright test --project=voter-mega-journey` exits 0 in ~57s). The mega-journey test passes T5 + T6 + matching:ranking + T7-matrix + T7-org-details + T8-filters:text + T8-filters:dialog all 7 stages. Initial 88-04 wave landed PARTIAL (stage 4+ deferred); the post-SUMMARY fix at commit `aaffe7d11` (role-based dialog button lookups + reset() acknowledges side-effect close + filter-badge assertion scoped to button text) closed Gate B without touching Modal.svelte or any other frontend surface. 3-run consecutive cold-start gate still explicitly deferred to 88-LAST.
9. **No regression on 88-01 baseV1 chain:** PASS — all 88-01 surface cells continue to pass (static / intro / elections / constituencies / questions-intro / questions-flow / results landing / matching ranking).
10. **No out-of-scope touches:** PASS — only files in `must_haves.artifacts` touched. perm-* / ROADMAP.md (outside Phase 88 plans list) / STATE.md (outside Roadmap Evolution) / legacy fixtures / public types / frontend resolver — ALL UNCHANGED.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] setupFromTemplate.ts post-seed assertion didn't account for Option B**
- **Found during:** Task 9 Gate B cold-start integration run.
- **Issue:** `expect(persisted).toMatchObject(expected)` compared the raw template (with `{externalId}` refs) against the persisted JSONB (with resolved UUIDs). Option B's Writer Pass-5 flattens before merge, so the persisted shape diverges from the template by design.
- **Fix:** Import `resolveAppSettingsExternalIds` + `settingsContainsExternalIdRefs` from `@openvaa/dev-seed` (added to the package's public exports). When the template's settings carry externalId refs, build the same external_id → UUID map (via inherited `selectQuestionExternalIds` method) and pre-flatten `expected` before comparison. Short-circuit when no refs present (zero-overhead).
- **Files modified:** `tests/tests/setup/setupFromTemplate.ts`, `packages/dev-seed/src/index.ts`
- **Commit:** `8415b46b5`

**2. [Rule 1 - Bug] Spurious hasNot filter on `getEntityCards` / `getMemberCards`**
- **Found during:** Task 9 Gate B integration run (T6 matching:organisations step toHaveCount(5) failed).
- **Issue:** Fixture used `filter({ hasNot: page.getByTestId('entity-card-subcard') })` to "exclude subcards" — but `hasNot` checks DESCENDANTS, so any outer card containing subcards as descendants was incorrectly EXCLUDED. The Wave 1.5 conditional testid on EntityCard.svelte already distinguishes outer (`entity-card`) from subcards (`entity-card-subcard`) — `getByTestId('entity-card')` ALONE already excludes subcards.
- **Fix:** Removed the `hasNot` filter from both `getEntityCards` and `getMemberCards`.
- **Files modified:** `tests/tests/fixtures/resultsPage.fixture.ts`, `tests/tests/fixtures/entityDetails.fixture.ts`
- **Commit:** `8415b46b5`

**3. [Rule 1 - Bug] `openEntityDetailsForCard` click target**
- **Found during:** Task 9 Gate B integration run (T7 organisation details `expectTabs` failed with 2 tabs vs expected 3).
- **Issue:** Clicking the outer `<article>` does nothing when the card has subcards — EntityCardAction wraps ONLY the header in that case. The fixture's click was hitting a no-op.
- **Fix:** Click the FIRST `entity-card-action` descendant (always the parent card's primary action, regardless of subcard structure).
- **Files modified:** `tests/tests/fixtures/resultsPage.fixture.ts`
- **Commit:** `94f8517a2`

**4. [Rule 1 - Bug] Matrix step heading-regex mismatch + Unicode-apostrophe regex**
- **Found during:** Task 9 Gate B integration run (T7 candidate details matrix `expectQuestionDisplayToHave` resolved to 0 elements).
- **Issue (a):** Legacy helper used `filter({ has: getByRole('heading', { level: 3, name: regex }) })` — failed to match against post-T2 `[<id>]` prefixed heading text.
- **Issue (b):** Regex `/hasn['']?t answered/i` only accepted ASCII apostrophe (U+0027); the i18n strings render U+2019 (right single quotation mark `’`).
- **Fix (a):** Refactored matrix step to use the new `entityDetails.expectQuestionDisplay` fixture method which uses `filter({ hasText: target })` on the entity-opinion-question div directly (robust against the bracketed prefix). The legacy helper at line 298-326 is left in place for future cells that may use it after the same fix is applied.
- **Fix (b):** Regex updated to `/hasn['‘’]?t answered/i` to accept both ASCII and Unicode apostrophes (same fix to `TEXT_RE.neitherAnswered`).
- **Files modified:** `tests/tests/fixtures/entityDetails.fixture.ts`, `tests/tests/specs/voter/voter-mega-journey.spec.ts`
- **Commit:** `94f8517a2`

**5. [Rule 1 - Bug] openFilterDialog testid lookup unreliable**
- **Found during:** Task 9 Gate B integration run (T8 filters:dialog `openFilterDialog` couldn't find `entity-filter-dialog`).
- **Issue:** Modal forwards `data-testid` via `concatClass` → ModalContainer's `restProps` → `<dialog>`. But empirically the testid didn't resolve at runtime for the dialog element.
- **Fix:** Switched to `getByRole('dialog', { name: /Filters/i })` — the dialog's accessible name (Modal `title` prop) provides a stable selector.
- **Files modified:** `tests/tests/fixtures/entityFilters.fixture.ts`
- **Commit:** `94f8517a2`

**6. [Rule 1 - Bug] Filter rows default-collapsed**
- **Found during:** Task 9 Gate B integration run (T8 filters:dialog stage 2 `noAnswerOption` not visible).
- **Issue:** `EntityFilters.svelte:55` sets `defaultExpanded={filter.active || _isTextFilter(filter)}` — non-active / non-text filters are collapsed by default. The fixture's `getFilter` returned the row but the inner options were not in DOM.
- **Fix:** `getFilter` now auto-expands the row when collapsed (probes the Expander's checkbox toggle and clicks if not checked).
- **Files modified:** `tests/tests/fixtures/entityFilters.fixture.ts`
- **Commit:** `94f8517a2`

**7. [Rule 1 - Tuning] Test timeout bumped 50s → 120s**
- **Found during:** Task 9 Gate B integration run (test exceeded 50s testMax).
- **Issue:** The 5 new test.step blocks (T6 / T7-matrix / T7-org-details / T8-filters:text / T8-filters:dialog) plus the modal open/close cycles + Expander auto-expand interactions push total runtime well past the original 50s budget.
- **Fix:** `TIMEOUT.testMax` raised to 120_000.
- **Files modified:** `tests/tests/specs/voter/voter-mega-journey.spec.ts`
- **Commit:** `94f8517a2`

**8. [Rule 1 - Bug] T8 filters:dialog stage 4+ — three layered issues blocking Gate B (post-SUMMARY fix)**
- **Found during:** post-SUMMARY operator escalation — Gate B PARTIAL is unacceptable; T8 stages 4–7 must land in 88-04 (not deferred to 88-LAST).
- **Cold-start reproduction:** `yarn db:reset && yarn db:seed --template baseV1 && cd tests && npx playwright test --project=voter-mega-journey` failed at line 1126 (`d1.close()` at STAGE 3 — the FIRST close, not the second as the original SUMMARY hypothesised). Diagnostic via DOM inspection of the open dialog: the Modal action `<Button>` components forward `data-testid` via `concatClass(restProps, classes)` → `<svelte:element this="button">`, but the rendered DOM is `<button data-testid="entity-list-filter">` (outer filter button works) yet `dialogRoot.getByTestId('entity-filter-dialog-apply')` resolves to 0 elements — strict-mode lookup fails on the inner dialog buttons. The `<span data-testid="entity-list-filter-badge">` wrapper inside the badge snippet at EntityListControls.svelte:130 is ALSO missing from the rendered DOM (verified via `outerHTML` evaluate — only the InfoBadge's inner `<div class="badge ...">` renders between the snippet anchor comments; the wrapping `<span>` does not survive Svelte 5 snippet compilation).
- **Three layered fixes (single commit `aaffe7d11`):**
  - (a) `close()` / `reset()` / `expectResetToBeDisabled()` switched from testid lookup to `getByRole('button', { name: /Close filters|Reset filters/i })` scoped to the dialog root. Buttons have stable accessible names tied to the i18n strings (`entityFilters.applyAndClose` = "Close filters", `entityFilters.reset` = "Reset filters") which are visibility-aware in Playwright by default.
  - (b) `getFilterButtonBadge()` switched from `page.getByTestId('entity-list-filter-badge')` (which the Wave 1.5 surgery placed on a `<span>` inside the badge snippet — span does not survive Svelte 5 snippet compile) to `page.getByTestId('entity-list-filter').first()` (the filter button itself, whose accessible name is `"<count> Filter"` when active — the count text is part of the button's textContent).
  - (c) Fixture's `reset()` documented and updated to `await expect(dialogRoot).toBeHidden()`. The real `resetFilters()` at EntityListControls.svelte:96-100 calls `filterGroup?.reset()` AND `filtersModalRef?.closeModal()` synchronously, so the Reset button CLOSES the dialog as a side-effect. The original fixture's docstring claimed "Dialog STAYS OPEN" — that was wrong. Removed 3 redundant `d.close()` calls after reset in T8 STAGES 4 / 5b / 7 that were trying to close an already-closed dialog (those calls produced the original symptom that the SUMMARY misattributed to "modal re-open dynamics").
- **Modal.svelte UNCHANGED.** No frontend changes. All adjustments are test-level (fixture + spec). No `expect.soft` introduced. Rigidity posture preserved.
- **Files modified:** `tests/tests/fixtures/entityFilters.fixture.ts`, `tests/tests/specs/voter/voter-mega-journey.spec.ts`
- **Commit:** `aaffe7d11`
- **Verification:** `yarn db:reset && yarn db:seed --template baseV1 && cd tests && npx playwright test --project=voter-mega-journey` → 34 passed (56.9s); 2 consecutive runs cold-start confirmed.

## Deferred Issues (documented in deferred-items.md)

1. **`packages/dev-seed/tests/templates/e2e.test.ts:431` — `questions.fixed.length === 18` expected, actual 25.** Pre-existing count drift from Phase 77/81/82 row additions; not 88-04 surface. Action: future hygiene plan (likely 88-LAST during TEST-INVENTORY.md refresh).

2. **Legacy `expectQuestionDisplayToHave` helper at lines 298-326.** Worked around by refactoring the matrix step's 4 calls to the new fixture method. Helper left in place for other cells (no other 88-04 callers); should be removed or aligned with the fixture in a future hygiene plan once all consumers migrate.

## Follow-up TODO surfaced (Gate A.4 binding)

> **TODO (post-88-04, v2.11+ candidate):** Refactor `QuestionInCardContent` and the surrounding results-cards settings (`results.cardContents`, plus `entityDetails.contents` and any sibling card-content settings) to be **election-specific**. The current shape lives under a single global `results.cardContents.{candidate,organization,alliance}` block — but card composition is intrinsically election-dependent. Consider moving the setting into per-election overrides OR attaching it to the question / election data objects in `@openvaa/data`. When this lands, the dev-seed Writer's seed-time resolver from this plan may be retired or refactored.

To be appended to ROADMAP.md or STATE.md backlog at plan close.

## Self-Check: PASSED

**Files verified:**
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-ADR-cardContents-resolver.md` — FOUND
- `packages/dev-seed/src/templates/types.ts` — FOUND
- `packages/dev-seed/src/resolveAppSettingsExternalIds.ts` — FOUND
- `packages/dev-seed/tests/resolveAppSettingsExternalIds.test.ts` — FOUND
- `tests/tests/fixtures/resultsPage.fixture.ts` — FOUND
- `tests/tests/fixtures/entityFilters.fixture.ts` — FOUND
- `tests/tests/fixtures/entityDetails.fixture.ts` — FOUND
- `tests/tests/fixtures/views.ts` — FOUND

**Commit hashes verified (14 plan-execution commits + 1 post-SUMMARY Gate B fix):**
- `3c0d73292` Task 1 baseV1 filterable flip — FOUND
- `33ab92795` Task 2 ADR — FOUND
- `ff061f9cb` Task 3a types + resolver — FOUND
- `ede7d41ef` Task 3b resolver test — FOUND
- `f1828e1bd` Task 4 Writer Pass-5 splice + baseV1 wiring — FOUND
- `ccac7691a` Task 5 testid surgery — FOUND
- `339c365a3` Task 6 fixtures library — FOUND
- `312ff71fa` Task 7a T5 — FOUND
- `3e95f8f19` Task 7b T6 — FOUND
- `87e867391` Task 7c T7 — FOUND
- `d91a3d9ff` Task 7d T8 — FOUND
- `83cb6f629` Task 8 T9 — FOUND
- `8415b46b5` Task 9 Rule 1 fixes (part 1) — FOUND
- `94f8517a2` Task 9 Rule 1 fixes (part 2) — FOUND
- `aaffe7d11` post-SUMMARY T8 filters:dialog Gate B fix — FOUND
