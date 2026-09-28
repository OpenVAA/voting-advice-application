# Phase 90: TIR5 permutations — missing-nominations warning + localisation negative/positive - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning
**Source:** Direct-from-TIR5 (`./TEST-INVENTORY-REFACTOR-5.md`) — autonomous dispatch via /gsd-progress --do

<domain>
## Phase Boundary

Apply Phase 89's strict-fixtures + minimal-data permutation pattern (TIR4 / 89-04 lineage) to **three new candidate-app permutation specs** per `./TEST-INVENTORY-REFACTOR-5.md` (TIR5). Three concrete deliverables:

1. **Missing-nominations warning permutation** (TIR5:15-26) — Minimal dataset: 2 elections (el-1, el-2), 1 shared constituency-group with 1 constituency, 1 organisation, 1 candidate, 1 nomination in el-1 only (el-2 has zero nominations). Voter selects both elections → expect the missing-nominations warning to surface for el-2.

2. **Localisation: Negative assertion permutation** (TIR5:28-50) — Minimal dataset: 1 election / 1 CG / 1 CO / 1 org / 1 candidate / 1 nomination + 2 question categories (info + opinion) each containing 2 questions (q2/q4 carry `customData.disableMultilingual = true`). Candidate has ToU accepted + answers to all 4 questions. **One supported language.** Expectations: (a) no language selector in navigation; (b) login as candidate → profile page → neither q1 nor q2 show translation options; (c) opinionQuestions editor — neither q3 nor q4 show translation options.

3. **Localisation: Positive assertion permutation** (TIR5:52-95) — Same dataset shape as #2 but **two supported languages (en + fi)**. Expectations: (a) language selector visible with en+fi; (b) ui texts change on switch (en→fi→en); (c) login → profile → q1 shows `[en-answer-q1]`, exposes translation options, add Finnish `[fi-answer-q1]`, close translations, Finnish is hidden; q2 shows NO translation options; (d) save → opinionQuestions editor → q3 shows `[en-answer-q3]`, exposes translation options, add Finnish `[fi-answer-q3]`, close, Finnish hidden; q4 shows NO translation options; (e) logout; (f) voter side: open candidate-details on results page → info+opinion answers in English; switch to Finnish → q1+q3 surface their Finnish answers.

**Conventions inherited from TIR4 / Phase 89** (TIR5:5-13):
- Strict tests, **no** fallbacks or soft assertions.
- Fixtures for all common view tasks.
- `[id] desc` format for text contents in seed rows.
- `serial`-only execution to minimise DB leakage.
- Minimal data per permutation (no shared multi-perm datasets).
- **Rewrite from scratch.** Old tests (if any equivalent exists) are guidance only — be sceptical of their flagged issues/solutions and inline back-and-forth comments.

**Stage A wiring (D-90-10 below)** is absorbed INTO Phase 90 as Plan 90-01. The `customData.disableMultilingual` UI plumbing is already wired end-to-end per researcher (see 90-RESEARCH.md §2) — Phase 90 does NOT touch it. The PRODUCT-GAP is `supportedLocales` runtime-override only.

**Out of scope:**
- TIR6 ("STILL TO BE ADDED LATER") items — read-only-warning 7.1.1, candidate-translation 3.3.1, A11Y-02 persistence, A11Y-01 validation matrix, hero/hideHero settings, etc.
- Hero video, extended question info, a11y assertions, visual drift, performance.
- Retirement of legacy `candidate-translation.spec.ts` (3.3.1 deferred to TIR6 / future phase).
- Mutation of `candidate-mega-journey.spec.ts` or its dataset (Phase 89 deliverable, locked).
- Any voter-mega-journey extensions.

</domain>

<decisions>
## Implementation Decisions

### Permutation dataset shape

- **D-90-01: Three new perm templates following 89-04 pattern.** Each TIR5 perm gets its own `perm-*` template under `packages/dev-seed/src/templates/` (researcher confirms exact naming — likely `perm-missing-nominations.ts`, `perm-localisation-negative.ts`, `perm-localisation-positive.ts`). Each template ships its own minimal dataset per TIR5 — no shared multi-perm datasets, no perm extends another perm. Each template gets its own `externalIdPrefix` so the three setup/spec/teardown chains are decoupled (88-03 + 89-04 lineage).

- **D-90-02: Minimal data, literal-from-TIR5.** Datasets follow TIR5 verbatim:
  - Missing-nominations: `count: 2 elections / 1 CG (shared) / 1 CO / 1 org / 1 candidate / 1 nomination in el-1`. No filler rows.
  - Localisation-negative: `count: 1/1/1/1/1/1` + 2 categories × 2 questions; q2 (info) + q4 (opinion) carry `customData: { disableMultilingual: true }`; candidate has ToU=true + 4 answered questions. **`supportedLanguages` restricted to one locale.**
  - Localisation-positive: same as negative, but `supportedLanguages: ['en', 'fi']`. Candidate's seeded answers are English-only at perm seed time — Finnish answers are AUTHORED by the spec itself via the multilingual-text-field fixture.

- **D-90-03: Question IDs and `[id] desc` text format.** Questions are seeded with stable IDs (`q1`/`q2`/`q3`/`q4` or perm-prefixed equivalents — researcher decides) and text content following the `[<id>] desc` convention (88-01 / 89-01 lineage). The spec asserts on those stable IDs, not on text-substring matches.

### Fixture library additions

- **D-90-04: Two new function-fixtures.** Author at `tests/tests/fixtures/` (consistent with 89-02's function-fixture composition root):
  - **`langSelectorFixture`** — exposes `expectVisible(locales: string[])`, `expectHidden()`, `switchTo(locale: string)`. Used by both localisation perms (positive expects visible+switch; negative expects hidden).
  - **`multilingualTextFieldFixture`** — exposes `expectTranslationOptions(visible: boolean)`, `openTranslations()`, `setLocaleValue(locale: string, value: string)`, `closeTranslations()`, `expectLocaleHidden(locale: string)`. Used by the positive perm to author Finnish answers on q1/q3 in profile + opinionQuestions editor.
  Fixtures live in `tests/tests/fixtures/candidate/` (sibling to 89-02's library) following the function-fixture pattern. Both must follow strict-fixture semantics — no fallbacks, no soft assertions, deterministic selectors only.

### Plan partition

- **D-90-05: Partition deferred to planner.** Planner picks plan count (likely 1-3 plans) based on parallelism trade-offs:
  - Per-perm partitioning (3 plans): clean parallel-safe waves, mirrors 89-04 structure but at perm granularity.
  - Fixture-first partitioning (2 plans: fixtures shared by perms 2+3 land first, then 3 perms in a single bundle): smaller PR surface but a Wave 1 → Wave 2 dependency.
  - Single bundled plan (1 plan): simplest, but bigger blast radius.
  Planner picks based on shared-fixture dependency analysis. Locked: fixtures (D-90-04) MUST be authored before localisation perms can consume them.

### Selector strategy

- **D-90-06: Strict testid-driven selectors only.** All assertions use `data-testid` selectors or stable `aria-label` keys. No text-content selectors except for the `[<id> desc]` IDs explicitly seeded by perm templates. Researcher / executor adds new testids to candidate-app Svelte components where TIR5 expectations require selectors that don't yet exist (e.g., language-selector in nav, translation-options toggle in profile/opinion-editor, multilingual text-field locale rows). 88-04 + 89-02 lineage applies — every new testid is enumerated in the plan with its component path.

### Voter-side cross-check (positive perm)

- **D-90-07: Voter-side assertion is in-perm-spec, not a voter-mega extension.** The positive perm's voter-side cross-check (TIR5:89-95 — voter results → candidate details → English answers → switch to Finnish → Finnish answers visible) lives in the **same perm spec file** as the candidate-side authoring. The spec uses both candidate-side and voter-side fixtures within a serial chain. It does NOT mutate `voter-mega-journey.spec.ts`. Researcher confirms whether the voter-side surface needs a new `candidateDetailsLocale` micro-fixture or whether existing voter-fixtures suffice.

### Playwright project chain

- **D-90-08: Three new project chains, one per perm.** Each TIR5 perm gets a `data-setup-perm-<name>` → `perm-<name>` → `data-teardown-perm-<name>` chain appended to `tests/playwright.config.ts` (89-04 lineage — 9 new project entries total: 3 setup + 3 spec + 3 teardown). Parallel-safe via per-template `externalIdPrefix` decoupling. No removal of existing projects.

### Old-test scepticism

- **D-90-09: Rewrite from scratch; old tests are guidance only.** Per TIR5:5-13, the planner / executor MUST be sceptical of:
  - Existing `candidate-translation.spec.ts` (3.3.1 deferred TIR6) — may share surface with TIR5 localisation perms; do NOT carry its issue-comments or flagged solutions forward without verification against current code.
  - Any prior perm specs that reference missing-nominations behaviour.
  Old assertions are reference for "what the surface does", not for "how to test it".

### Stage A: runtime supportedLocales override (PRODUCT-GAP wiring)

- **D-90-10: Absorb Stage A wiring as the first plan in Phase 90 (NOT a separate phase).** Operator-confirmed 2026-05-29 after researcher surfaced PRODUCT-GAP. Background: `staticSettings.supportedLocales` (`packages/app-shared/src/settings/staticSettings.ts:46-64`) is hardcoded AND Paraglide compiles `locales` from `apps/frontend/project.inlang/settings.json` at build time — no runtime override path exists today. Phase 74 D-04 already deferred single-locale testing for this exact reason. Phase 90's localisation-NEGATIVE perm (TIR5:28-50) ASSERTS the absence of language selector + translation toggles when `supportedLanguages.length === 1` — this cannot be tested without a runtime override.
- **Stage A scope:** Extend `app_settings.settings` JSONB column (or equivalent dynamic-settings surface) to override `supportedLocales` at runtime — bypassing the Paraglide-compile fallback when overrides are present. Touches: app-shared settings types, frontend i18n init (`apps/frontend/src/lib/i18n/init.ts`), dynamic-settings consumers, possibly `LanguageSelection.svelte` rendering branch. Researcher's grep for `supportedLocales` consumers seeds the wiring file list.
- **Stage A does NOT mutate Paraglide compile-time `locales`.** The compile-time set stays at the full superset (en+fi+et+sv per `project.inlang/settings.json`); the runtime override DROPS unwanted locales from the user-facing surface. This preserves existing translation bundles for forward compatibility (multi-locale perms still work) while gating UI visibility.
- **Plan partition (revises D-90-05):**
  - **Plan 90-01: Stage A wiring** — extend `app_settings` for runtime supportedLocales override. Code-only plan (no test perms yet). Wave 1.
  - **Plan 90-02: missing-nominations perm** — independent of Stage A. Can land in parallel with 90-01 (Wave 1).
  - **Plan 90-03: lang-selector + multilingual-text-field function-fixtures + perm-localisation-negative perm** — depends on 90-01 (needs runtime override). Wave 2.
  - **Plan 90-04: perm-localisation-positive perm** — depends on 90-03 (consumes the new fixtures). Wave 3.
  - Planner may merge 90-03+90-04 if shared-fixture authoring + 2 perms fit one PR cleanly.

### Claude's Discretion

- Exact filenames for the three perm templates, perm spec files, setup/teardown wrapper files, and playwright-project entry names. Follow 89-04 naming (e.g., `perm-missing-nominations.spec.ts` mirrors 89-04's `perm-voter-app-disabled.spec.ts`).
- Whether the missing-nominations spec needs a voter-side fixture or can drive the assertion directly with raw locators (researcher decides — but D-90-06 strict-selectors applies).
- Exact testid additions to candidate-app i18n components — researcher inspects current components and enumerates.
- Whether `langSelectorFixture` lives under `fixtures/candidate/` or `fixtures/shared/` (since voters also have a lang selector). Researcher picks based on existing voter-side fixture organisation.
- Internal implementation of `multilingualTextFieldFixture` — composes with `candidateProfilePage` + `candidateQuestionPage` fixtures (89-02) or standalone.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary design source (TIR5)
- `./TEST-INVENTORY-REFACTOR-5.md` — Full TIR5 spec (the "what to build" for Phase 90). PRIMARY design source. 96 lines. 3 perms described.
- `./TEST-INVENTORY-REFACTOR-4.md` — TIR4 spec (Phase 89 input). Provides the strict-fixture + minimal-data conventions inherited verbatim.
- `./TEST-INVENTORY-REFACTOR-6.md` — TIR6 ("STILL TO BE ADDED LATER"). Defines what is explicitly OUT of Phase 90 scope (3.3.1, 7.1.1, A11Y items, hero/hideHero, etc.).

### Phase 89 prior decisions (carry forward)
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-CONTEXT.md` — Strict-fixture + parallel-landing decisions; function-fixture composition root pattern.
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-04-PLAN.md` — 3-permutation plan structure (perm-disable-voter-app / perm-disable-candidate-app / perm-per-app-notifications). Phase 90 mirrors this shape.
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-04-SUMMARY.md` — Outcome of Phase 89's perm plan; lineage for D-90-01 + D-90-08.
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-02-PLAN.md` — Candidate fixture-library plan; function-fixture pattern that D-90-04 extends.
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-PLAN.md` — Legacy retirement; informs scepticism baseline for D-90-09.

### Phase 88 prior decisions (carry forward)
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-CONTEXT.md` — Parallel-landing principle, setupFromTemplate helper signature, baseV1 dataset shape, per-template externalIdPrefix convention.

### Dev-seed package
- `packages/dev-seed/src/templates/baseV1.ts` — baseV1 dataset (NOT mutated by Phase 90).
- `packages/dev-seed/README.md` — Template authoring guide (per-template `externalIdPrefix`, `count`, `fixed[]`).
- `packages/dev-seed/src/templates/` — Sibling `perm-*` templates from 89-04 (templates to mirror naming).

### Test framework anchors
- `./tests/playwright.config.ts` — Project graph; Phase 90 appends 9 new entries (3 perm chains).
- `./tests/tests/fixtures/candidate/` — 89-02 function-fixture library (root for new D-90-04 fixtures).
- `./tests/tests/fixtures/views.ts` — Existing fixture composition root pattern (89-02 sibling).
- `./tests/tests/specs/perm/` — 89-04 perm spec directory (root for new perm specs).

### Frontend i18n / multilingual surface
- `apps/frontend/src/lib/i18n/` — sveltekit-i18n integration; locale switching surface.
- `apps/frontend/src/lib/components/` — language selector + multilingual-text-field components (researcher locates exact paths + identifies testid gaps).
- `apps/frontend/src/lib/candidate/components/` — candidate-app profile + opinion-editor components hosting translation-options surface.

### Data model
- `packages/data/` — Question + Candidate + Answer models. `customData.disableMultilingual` flag plumbing.
- `packages/app-shared/src/settings/staticSettings.ts` — `supportedLocales` definition (perm templates override per-perm).

### State + roadmap
- `.planning/ROADMAP.md:419+` — Phase 89 entry (just-shipped). Phase 90 added 2026-05-29.
- `.planning/STATE.md` — milestone position (v2.10, verifying — Phase 89 complete, Phase 90 next).

</canonical_refs>

<specifics>
## Specific Ideas

- **`disableMultilingual` plumbing.** TIR5 introduces `customData.disableMultilingual: true` as a per-question opt-out. Researcher verifies whether this flag already exists in the data model + UI rendering pipeline or needs to be added. If it doesn't exist, that becomes a SEPARATE concern that must be flagged (PRODUCT-GAP) — Phase 90's perm tests cannot validate a feature that isn't implemented. If it exists but isn't UI-wired, the perm test acts as a regression gate after the wiring is done. Planner surfaces this as a Wave-0 probe.

- **Localisation positive — voter-side fixture choice.** TIR5:89-95 describes opening candidate-details from voter results, viewing English answers, switching language, and seeing Finnish answers. The voter app already has language-switching infrastructure (voter-mega-journey covers it implicitly). Researcher decides whether to reuse `langSelectorFixture` (D-90-04) across both apps or fork voter-side equivalent.

- **Translation-options surface — UI inventory.** TIR5 references "translation options" UI for both info-text questions (q1 in profile) and opinion-question text (q3 in opinionQuestions editor). Researcher inventories the existing component(s) — likely a `MultilingualTextField` or `TranslationDrawer` — and confirms testid availability. The negative perm's expectations (`expect no show translation options`) are stricter than absence: they assert the surface is **fully suppressed** when language count = 1 OR when `customData.disableMultilingual = true`.

- **Voter-side multilingual rendering.** Whether candidate-info answers (q1) and candidate-opinion answers (q3) reflect the active voter locale in the candidate-details panel is a downstream rendering concern. Researcher confirms the rendering path picks the active locale and falls back gracefully (the perm asserts presence of Finnish text after locale switch — not fallback behaviour).

- **Inbucket / email surface.** TIR5 does NOT require email auth — these perms do NOT register a candidate via Inbucket. Candidates are seeded pre-authenticated with ToU=true. The perm spec logs in via the candidate login fixture (89-02) and skips the registration / ToU surface entirely.

</specifics>

<deferred>
## Deferred Ideas

- TIR6 backlog (`./TEST-INVENTORY-REFACTOR-6.md`) — all items, including 3.3.1 candidate-translation, 4.2.x A11Y-02 persistence, 5.1.x A11Y-01 validation matrix, 7.1.x hero/hideHero/read-only-warning. Phase 90 does NOT touch these specs or their absorbed assertions.
- Voter-mega-journey extensions covering multilingual answer rendering (if researcher decides voter-side cross-check belongs in voter-mega instead of in the positive perm — see D-90-07; current locked decision is in-perm-spec).
- Retirement of `candidate-translation.spec.ts` 3.3.1 — stays alive past Phase 90 until TIR6 phase absorbs it.
- 89-04's `QuestionInCardContent` election-specificity TODO (Gate A.4 in 89-04-SUMMARY) — orthogonal to Phase 90.
- If `customData.disableMultilingual` is not yet implemented in the rendering pipeline, the wiring work is OUT of Phase 90 scope (Phase 90 is test-perm only). A PRODUCT-GAP would be filed and a follow-up phase would do the wiring.

</deferred>

---

*Phase: 90-tir5-permutations-missing-nominations-warning-localisation-n*
*Context gathered: 2026-05-29 — TIR5 direct-ingest via /gsd-progress --do autonomous dispatch*
