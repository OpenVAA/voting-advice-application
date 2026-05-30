# Phase 91: TIR6 perm + edit test additions + visual/perf/a11y/bank-auth refactor - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning
**Source:** Direct-from-TIR6 (`./TEST-INVENTORY-REFACTOR-6.md`) — interactive chain-mode discuss

<domain>
## Phase Boundary

Implement `TEST-INVENTORY-REFACTOR-6.md` (TIR6) — closing the v2.10 TIR backlog. Three concrete deliverable groups, all inheriting the strict-fixture + minimal-data + `[id] desc` + serial-only + per-perm conventions established by Phases 88 / 89 / 90.

**Group A — 9 new settings permutations** (TIR6:3-142):

1. **answersLocked** (TIR6:3-14) — Minimal 1-each + 1 cand. `access.answersLocked=true`. Candidate login → read-only warning visible. Profile → question inputs disabled. Opinions Q1 → choice radio buttons disabled.
2. **hideHero** (TIR6:24-32) — Minimal 1-each + 1 cand + Q1 carries `customData.hero` (emoji). `candidateApp.questions.hideHero=true`. Candidate login → opinions Q1 → hero hidden.
3. **header.showFeedback** (TIR6:68-77) — Minimal + `header.showFeedback=true`. Voter intro → feedback button in header → click → feedbackDialog visible.
4. **header.showHelp** (TIR6:79-88) — Minimal + `header.showHelp=true`. Voter intro → help button in header → click → URL = `getRoute.current('Help')`.
5. **entities.showAllNominations=false** (TIR6:90-93) — Minimal. Voter navigation → `/nominations` → redirects to Home.
6. **entities.hideIfMissingAnswers.candidate** (TIR6:95-102) — 1e/1cg/1co + 2 cands + 2 opinion qs. Cand1 answers both, Cand2 answers only Q1. Voter → results → Cand1 visible, Cand2 hidden.
7. **elections.showElectionTags=false** (TIR6:104-108) — 2 elections + shared CG + 1 CO. Voter → questions → no election tags.
8. **questions.showCategoryTags=false** (TIR6:111-115; duplicate TIR6:117-119 treated as typo — single perm) — Voter → questions → no question-category tags.
9. **customData.allowOpen=false** (TIR6:121-142) — 1e/1cg/1co + 2 opinion qs (Q1 no customData, Q2 carries `customData.allowOpen=false`) + 1 cand with info text on BOTH answers (TIR6's `!has info` interpreted as typo — cand has info per D-91-PD-04). Candidate side: opinions Q1 → info input visible; opinions Q2 → no info input. Logout. Voter → results → candidate-details → opinions → Q1 info visible, Q2 info hidden.

**Group B — 3 mega-journey edit-step extensions** (TIR6:16-22, 34-66):

10. **Candidate edit: invalidUrl** (TIR6:16-22) — Append into `candidate-mega-journey.spec.ts` profile-step section. On the profile page, enter an invalid URL into the Link-type question; assert `components.input.error.invalidUrl` surfaces (translation key already in tree; component path: `apps/frontend/src/lib/components/input/Input.svelte:296`).
11. **Voter edit: feedbackDialog flow** (TIR6:34-61) — Append into `voter-mega-journey.spec.ts`. Sequence: nav→click(feedback)→expect feedbackDialog→expect send disabled→set rating→expect send enabled→set comment text→cancel→nav→click(feedback)→expect rating+comment preserved→submit→expect success→nav→click(feedback)→expect empty→set comment only→expect send enabled→submit→expect success. Consumes new shared `feedbackDialog` fixture (D-91-MJ-02).
12. **Voter edit: all-nominations route** (TIR6:63-66) — Append into `voter-mega-journey.spec.ts`. Navigate to `/nominations` (voter route `Nominations: ${VOTER}/nominations` per `apps/frontend/src/lib/utils/route/route.ts:21`); assert candidate-nominations list visible with correct match count (baseV1 cand count).

**Group C — Refactor 4 existing spec families to new fixtures + strict expectations** (TIR6:144-178):

13. **Visual regression** (`tests/tests/specs/visual/visual-regression.spec.ts`, 4 tests — voter-results desktop/mobile + candidate-preview desktop/mobile) — Rebaseline screenshots (Phase 89-01 hero+info baseV1 mutations invalidated existing baselines). Swap candidate-preview from raw `STORAGE_STATE + page.goto` to a new function-fixture wrap consuming `candidatePreviewPage` (89-02). Migrate voter side from legacy `voterTest.answeredVoterPage` (`tests/tests/fixtures/voter.fixture.ts`) to the new function-fixture `answeredVoterPage` exposed by `tests/tests/fixtures/voter-mega.fixture.ts` (D-91-RS-03).
14. **Perf budget** (`tests/tests/specs/perf/performance-budget.spec.ts`, 1 test — voter results page load) — Minimal pass: migrate from legacy `voterTest.answeredVoterPage` to new `voter-mega.fixture.ts` `answeredVoterPage`. Keep budgets calibrated; verify still match post-89 baseV1.
15. **A11Y axe smoke** (`tests/tests/specs/a11y/a11y-smoke.spec.ts`, 6 tests — home, elections-selector, constituencies-selector, questions, results, voter-detail-drawer) — Fixture wrap: swap raw `test` + `SupabaseAdminClient.findData` UUID resolution to use `voter-mega.fixture.ts` `answeredVoterPage` for the 4 located routes (questions, results, voter-detail-drawer, plus a pre-result intermediate as needed). Keep raw `page.goto` for the pre-location 3 routes (home, elections-selector, constituencies-selector). Per-rule + global 0-violation gate preserved.
16. **Bank-auth** (`tests/tests/specs/candidate/candidate-bank-auth.spec.ts`, 6 tests — identity-callback Edge Function flow) — Minimal pass: audit for legacy-fixture imports (it imports from `../../fixtures` = legacy `index.ts` root — confirm + swap to direct `@playwright/test` if needed). Audit for soft assertions / `.catch` fallbacks; tighten if found. **Leave JWE-token synthesis + env-gating intact** (PLAYWRIGHT_BANK_AUTH=1 opt-in remains the contract).

**Group D — Limited spec retirement** (D-91-MJ-03):

17. **Delete `tests/tests/specs/voter/voter-feedback-persistence.spec.ts`** — Fully absorbed by Group B item 11 (voter-mega feedbackDialog flow). Same-plan deletion in lockstep with the voter-mega extension.

**Out of scope:**
- TIR7+ items (none defined yet; TIR6 is the v2.10 close).
- Broader supersession sweep — other voter-* and candidate-* specs (voter-popups, voter-popup-hydration, voter-locale-switching, voter-allowopen, voter-questions, voter-static-pages, voter-results, voter-matching, voter-detail, voter-navigation, voter-question-rendering-boolean/categorical, voter-not-located-redirect, voter-browse-without-match, voter-visibility-required, voter-settings, voter-journey, candidate-profile, candidate-profile-validation, candidate-translation, candidate-settings) STAY untouched; researcher audits surface-overlap but does NOT delete in Phase 91 (deferred to v2.11+ legacy-retirement phase) (D-91-MJ-03).
- Full migration of all 15 legacy `voter.fixture.ts` consumers — only the 3 TIR6 refactor targets (visual, perf, a11y) migrate; other 12 stay on legacy + `voter.fixture.ts` gets `@deprecated` banner only (D-91-RS-03 / D-91-RS-04).
- New testid additions — researcher inventories the candidate-app + voter-app surfaces touched by Group A perms (read-only/locked indicators, hero suppression marker, header feedback/help buttons, allowOpen info-input suppression) and enumerates per-component.
- 89/90 deferred items (e2eTemplate row-count drift, QuestionInCardContent election-specificity, emailHelper.ts retirement, runes-test build error) — orthogonal.

</domain>

<decisions>
## Implementation Decisions

### Group B — Mega-journey vs new-spec

- **D-91-MJ-01: Append edit-journey extensions INTO existing mega-journey specs** (TIR4-style absorption). Following TIR6's "New step:" / "Edit candidate journey: Step:" phrasing and 89-D-89-01 lockstep precedent:
  - Group B item 10 (invalidUrl) → `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` profile section.
  - Group B item 11 (feedbackDialog) → `tests/tests/specs/voter/voter-mega-journey.spec.ts` (location TBD by planner — likely after results-landing or as a nav-revealed branch).
  - Group B item 12 (all-nominations) → `tests/tests/specs/voter/voter-mega-journey.spec.ts` (location TBD — likely after voter-results / detail).
  No new spec files for these three steps; preserves the "one canonical journey per app" invariant.

- **D-91-MJ-02: feedbackDialog as new SHARED fixture** at `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` (new directory). Surface: `expectVisible()`, `expectHidden()`, `expectSendDisabled()`, `expectSendEnabled()`, `setRating(n)`, `setComment(text)`, `submit()`, `cancel()`, `expectSuccess()`, `expectRatingValue(n)`, `expectCommentValue(text)`. Strict testids only — leverages existing `feedback-form`, `feedback-rating-N`, `feedback-description`, `feedback-submit`, `feedback-cancel` (already in `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:158,184,197,235,247`). Researcher may add an `feedback-success` testid if not already present (success-message assertion in TIR6:53 + TIR6:60).
  - Voter-mega consumes immediately.
  - Candidate flows can later reuse (CandidateNav.svelte:107 also exposes feedback modal via `openFeedbackModal`) — Phase 91 does NOT add candidate-side feedback assertions yet, but the shared location enables forward use.
  - The fixture follows the function-fixture pattern (89-02 lineage); does NOT extend `voter-mega.fixture.ts` directly.

- **D-91-MJ-03: Two-stage spec deletion.** Phase 91 deletes ONLY `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` (Group D item 17) — direct surface overlap with the voter-mega feedbackDialog step. Other voter-* and candidate-* specs that may have surface-overlap with TIR6 perms/edit-steps STAY untouched; broader supersession sweep deferred to a future legacy-retirement phase (v2.11+). Researcher audits each existing spec for overlap and lists overlaps in 91-RESEARCH.md `Deferred — broader spec sweep` section but does NOT act on them in 91. Aligns user's "two mega-journeys + perm are canonical" principle with the conservative-scope discipline of 89-D-89-04.

### Group C — Refactor scope (visual / perf / a11y / bank-auth)

- **D-91-RS-01: Visual regression — rebaseline + fixture-tighten.** Run `--update-snapshots` after Group A/B lands to capture the post-89 baselines (hero emoji on Q1, hero image on Q2 + base category, info content on Q1 — 89-D-89-01 dataset mutations). Swap candidate-preview from raw `STORAGE_STATE + page.goto` to a `candidatePreviewPage` function-fixture wrap (89-02). Strictness already present; preserve. Researcher decides whether voter-results visual benefits from a small fixture composition wrap (likely just a fixture-import swap; the test body is already strict).

- **D-91-RS-02: Perf budget — minimal pass.** Migrate from legacy `voterTest.answeredVoterPage` to new `voter-mega.fixture.ts` `answeredVoterPage`. Verify budgets (`domContentLoaded < 8000ms`, `loadComplete < 15000ms`) still match post-89 baseV1; recalibrate if 89-01 mutations shifted P90. No threshold tightening — perf is a regression gate, not an absolute target. A11Y — fixture wrap + voter-mega traversal reuse for the 4 located routes (questions, results, voter-detail-drawer), keep raw `page.goto` for pre-location routes (home, elections-selector, constituencies-selector). Drops the localStorage/URL-prefill complexity entirely. Per-rule + global 0-violation gate preserved.

- **D-91-RS-03: Fixture migration scope — TIR6 refactor targets ONLY + audit new tests for legacy-fixture leaks.**
  - **Migrate to new `voter-mega.fixture.ts` `answeredVoterPage`:** `visual-regression.spec.ts`, `performance-budget.spec.ts`, `a11y-smoke.spec.ts`.
  - **Audit + refactor (mandatory):** Every new spec authored by Phases 88/89/90 (mega-journeys + perm specs) MUST NOT import from `tests/tests/fixtures/voter.fixture.ts` or `tests/tests/fixtures/index.ts` legacy root. Researcher greps for legacy-fixture imports in `tests/tests/specs/perm/*.spec.ts` + `tests/tests/specs/voter/voter-mega-journey.spec.ts` + `tests/tests/specs/candidate/candidate-mega-journey.spec.ts`; planner schedules refactor for any leaks. Same audit applies to setup/teardown files that flag mega/perm setup chains.
  - **NOT migrated in Phase 91 (stay on legacy):** the other 12 voter-* / candidate-settings consumers of `voterTest` (voter-detail, voter-matching, voter-results, voter-popups, voter-popup-hydration, voter-question-rendering-*, voter-allowopen, voter-browse-without-match, voter-visibility-required, voter-navigation, candidate-settings).
  - **`voter.fixture.ts` is NOT deleted in Phase 91** — deletion deferred to a follow-up sweep (v2.11+). It receives a `@deprecated` JSDoc banner (D-91-RS-04).
  - If the new `voter-mega.fixture.ts` `answeredVoterPage` lacks determinism guarantees the visual/perf specs need (e.g., baseV1 supports `voterAnswerCount` / `voterAnswerIndex` overrides that the new fixture may not yet — researcher confirms), Phase 91 EXTENDS the new fixture rather than forking. Use baseV1 dataset for all three (not new perm datasets).

- **D-91-RS-04: `tests/tests/fixtures/voter.fixture.ts` — deprecated, not deleted.** Add a top-of-file JSDoc banner: `@deprecated — Phase 91. Migrate consumers to tests/tests/fixtures/voter-mega.fixture.ts answeredVoterPage. Deletion scheduled v2.11+ legacy-retirement phase after all consumers migrate.` Optional: add a runtime `console.warn` in development mode (researcher decides — may risk noise during E2E runs).

- **D-91-RS-05: Bank-auth — minimal pass.** Audit `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` for:
  - Legacy-fixture imports — the file imports `{ expect, test } from '../../fixtures'` (= legacy `index.ts` root); swap to `@playwright/test` direct OR to the new candidate function-fixture root only if the test body genuinely consumes anything beyond raw `test` (it doesn't — the storage-state override is `test.use({ storageState: { cookies: [], origins: [] } })` and the test body uses raw `page`).
  - Soft assertions / `.catch` fallbacks — tighten any found.
  - **Leave JWE-token synthesis + env-gating intact** (`PLAYWRIGHT_BANK_AUTH=1` opt-in is the contract). Do NOT author a perm dataset for bank-auth — Edge-Function-direct tests synthesize their own state.

### Group A — Per-perm dataset boundaries

- **D-91-PD-01: Dataset-builder helper + port truly-minimal existing perms.** Author a new `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` helper (new directory). Signature (researcher refines): `buildMinimal({ candidates: number, opinionQuestions: number, infoQuestions?: number, externalIdPrefix: string, settingsOverlay: Partial<DynamicSettings>, ... })`. Returns a template object matching the existing `Template` shape consumed by `@openvaa/dev-seed`. Each perm template that uses the helper passes its OWN `externalIdPrefix` (preserves the per-perm runtime decoupling invariant from 88-D-88-03 / 90-D-90-01). The helper does NOT share dataset state across perms at runtime — only the AUTHORING code is shared.

- **D-91-PD-02: Helper authors a FRESH-MINIMAL seed** — 1 election / 1 CG / 1 CO / 1 org / N cands / M opinion questions / optional K info questions. **No hero content, no info content, no filtered-info questions, no `test-qu-info-text` required, no nominations beyond the trivial 1-per-cand.** Pure topology + the settings overlay each perm provides. The helper is NOT derived from baseV1 (which carries Phase-89's hero/info/filtered-info mutations and the unregistered candidate — out of scope for these minimal perms).

- **D-91-PD-03: Port truly-minimal existing perms to the helper.** Audit + port the existing perm templates that have a compatible 1e/1cg/1co topology. Researcher's inventory targets (planner confirms each):
  - `perm-1e1cg1co` (literal helper-default shape).
  - `perm-disable-voter-app`, `perm-disable-candidate-app` — 1e/1cg/1co + 2 cands per 89-04.
  - `perm-per-app-notifications` — same topology.
  - `perm-missing-nominations` — 2e/1cg/1co + 1 cand + 1-of-2 nominations (helper accepts `{ elections: 2, nominationsInElectionIndex: 0 }` — researcher refines).
  - `perm-localisation-positive` — 1e/1cg/1co + 1 cand + 2 categories × 2 qs (helper accepts `{ categories: 2, opinionQuestions: 2, infoQuestions: 2, customDataPerQuestion: { ... } }` — researcher refines).
  **NOT ported (stay bespoke):** `perm-2e-asymmetric`, `perm-2e-shared`, `perm-disjoint-1co`, `perm-disable-election-1co`, `perm-disable-election-2co`, `perm-not-located-2e2cg`, `perm-startfromcg`. These have non-minimal topology that doesn't generalize cleanly.
  - Porting an existing perm MUST preserve its existing assertions byte-for-byte (no behavioural regression). Each port is a separate atomic commit per the executor's commit discipline.

- **D-91-PD-04: TIR6 ambiguities resolved as typos.**
  - **TIR6:122 `!has info in answers to BOTH questions`** — `!` is a typo. Candidate authors info text on BOTH Q1 and Q2 answers. The customData.allowOpen=false on Q2 SUPPRESSES the rendering of that info text on the candidate-edit surface (Q2 no info input) AND on the voter-details surface (Q2 info hidden), per `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte:78` (`{#if answer?.info && customData?.allowOpen !== false}`) + `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:294` (`{#if customData.allowOpen}`).
  - **TIR6:111-115 + TIR6:117-119 `questions.showCategoryTags = false` appears twice** — duplicate is a copy-paste artifact. Single perm spec. Note the typo in CONTEXT.md so future TIR drafts catch it.

- **D-91-PD-05: Per-perm template + per-perm spec + per-perm project-chain.** Each of the 9 new TIR6 perms gets its own template file (using the helper), its own spec file, and its own setup/teardown + spec playwright project chain (27 new project entries: 9 setup + 9 spec + 9 teardown). Parallel-safe via per-template `externalIdPrefix`. Mirrors 89-04 + 90-D-90-08 lineage.

### Group C — A11Y refactor split (clarification on D-91-RS-02)

- **D-91-RS-02b: A11Y route classification.** Of the 6 axe-smoke routes:
  - **Pre-location (raw `page.goto`, unauthenticated):** home (`/en`), elections-selector (`/en/elections`), constituencies-selector (`/en/constituencies`).
  - **Located (consume new `voter-mega.fixture.ts` `answeredVoterPage` or a derived `locatedVoterPage` fixture):** questions, results, voter-detail-drawer. The fixture provides the `?electionId=...&constituencyId=...` URL state without needing `SupabaseAdminClient.findData` UUID resolution at scan time. If the new fixture lacks a "located but not answered" variant (only "answered + on results"), researcher EXTENDS it to expose `locatedVoterPage` (intermediate landing pre-answer) — leverage in D-91-RS-03.

### Plan partition

- **D-91-PARTITION: Deferred to planner.** Researcher and planner pick plan count + ordering after surveying the helper-port complexity + the refactor's new-fixture leaks. Likely shape (planner confirms):
  - Plan 91-01: Dataset-builder helper + port existing minimal perms (foundation).
  - Plan 91-02: 9 new TIR6 perm templates + 9 perm spec files + 9 project chains (consumes 91-01).
  - Plan 91-03: 3 mega-journey edit-step extensions + new `feedbackDialog` shared fixture + voter-feedback-persistence.spec.ts deletion.
  - Plan 91-04: Visual + Perf + A11Y refactor (TIR6 §C items 34/35/36) + audit new tests for legacy-fixture leaks + refactor any found + `voter.fixture.ts` `@deprecated` banner.
  - Plan 91-05: Bank-auth audit (minimal pass — may be merged into 91-04 if scope is tiny per D-91-RS-05).
  Planner may merge 91-04+91-05; may split 91-02 if 9 perms is too large for one PR. Locked: 91-01 MUST land before 91-02; 91-03 is independent (parallel with 91-02); 91-04 depends on Phase-89 baseline regeneration but is otherwise independent.

### Claude's Discretion

- Exact filenames for perm templates, perm specs, setup/teardown wrappers, helper signature/parameters, playwright project-chain names — follow 89-04 / 90 / 88-04 naming conventions (e.g., `perm-answers-locked.spec.ts`, `data-setup-perm-answers-locked`, etc.).
- Exact testid additions to candidate-app + voter-app Svelte components where TIR6 expectations require selectors that don't yet exist (e.g., read-only/locked banner on candidate login surface, candidate profile question disabled state, opinion-question disabled choice radios, hero-visible/hidden marker on candidate question page, header feedback/help buttons, voter-results "no-nominations" or "candidate-hidden" markers). Researcher inventories.
- Whether to use `expect.toBeVisible()` vs `expect.toBeDisabled()` vs `expect.toBeHidden()` for each perm's negative assertion — strict-fixture-pattern (no soft) is locked; the exact matcher is per-locator.
- Internal implementation of `feedbackDialog` fixture — function-fixture composition with the existing `voter-mega.fixture.ts` chain or standalone (likely standalone in `fixtures/shared/`).
- Helper API surface for `buildMinimal()` — whether to accept `{ candidates, opinionQuestions, ... }` object or builder-style chained API. Researcher picks based on dev-seed authoring ergonomics.
- Whether to fold the `feedbackDialog` cancel/reopen state-persistence assertions into a single test step or multiple test() blocks within voter-mega — follow voter-mega's existing test() block discipline.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary design source (TIR6)
- `./TEST-INVENTORY-REFACTOR-6.md` — Full TIR6 spec (the "what to build" for Phase 91). PRIMARY design source. 178 lines. 9 perms + 3 mega-extensions + 4 refactor families.
- `./TEST-INVENTORY-REFACTOR-5.md` — TIR5 (Phase 90 input). Lineage for strict-fixture + per-perm conventions.
- `./TEST-INVENTORY-REFACTOR-4.md` — TIR4 (Phase 89 input). Lineage for mega-journey extension pattern (89-D-89-01 lockstep absorption).
- `./TEST-INVENTORY-REFACTOR-1.md` / `-2.md` / `-3.md` — Phase 88 lineage (baseV1 + parallel-landing + setupFromTemplate).

### Phase 90 prior decisions (carry forward)
- `.planning/phases/90-tir5-permutations-missing-nominations-warning-localisation-n/90-CONTEXT.md` — Per-perm template + per-perm playwright chain + strict-testid + per-template `externalIdPrefix`.
- `.planning/phases/90-tir5-permutations-missing-nominations-warning-localisation-n/90-VERIFICATION.md` — Outcome of Phase 90's perm work (Stage A reversed; 3-locale base locked). Phase 91's perm work mirrors Phase 90's spec-chain shape.
- `.planning/phases/90-tir5-permutations-missing-nominations-warning-localisation-n/90-RESEARCH.md` — sveltekit-i18n + Paraglide compile-time `locales` constraints (relevant if any Phase 91 perm needs locale overrides).

### Phase 89 prior decisions (carry forward)
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-CONTEXT.md` — Function-fixture composition root; mega-journey absorption pattern (89-D-89-01 = TIR6 mega-extension precedent); 5-plan partition.
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-02-PLAN.md` — Candidate fixture library plan (template for `feedbackDialog` shared-fixture authoring).
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-04-PLAN.md` — 3-perm plan structure (template for Phase 91's 9-perm partition).

### Phase 88 prior decisions (carry forward)
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-CONTEXT.md` — Parallel-landing principle, `setupFromTemplate` helper signature, per-template `externalIdPrefix` convention.
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-PLAN.md` — Function-fixture composition root pattern (template for new `feedbackDialog.fixture.ts` shape).

### Dev-seed package
- `packages/dev-seed/src/templates/baseV1.ts` — baseV1 dataset (NOT mutated by Phase 91; helper authors a FRESH-MINIMAL seed independent of baseV1).
- `packages/dev-seed/README.md` — Template authoring guide (per-template `externalIdPrefix`, `count`, `fixed[]`, helper conventions).
- `packages/dev-seed/src/templates/` — Sibling perm templates from 89-04 + 90 (templates to mirror naming) + existing perms to audit/port per D-91-PD-03.

### Test framework anchors
- `./tests/playwright.config.ts` — Project graph; Phase 91 appends 27 new entries (9 perm chains × 3 each).
- `./tests/tests/fixtures/voter-mega.fixture.ts` — NEW function-fixture composition root. Phase 91 EXTENDS this (e.g., `locatedVoterPage` variant for a11y).
- `./tests/tests/fixtures/voter.fixture.ts` — LEGACY voter answer fixture; Phase 91 marks `@deprecated` (D-91-RS-04). NOT deleted.
- `./tests/tests/fixtures/views.ts` — Existing function-fixture composition root (89-02 sibling).
- `./tests/tests/fixtures/candidate/` — Phase 89-02 candidate fixture library (consumed by candidate-mega-journey edit-step + visual candidate-preview refactor).
- `./tests/tests/fixtures/shared/` — **NEW directory** for `feedbackDialog.fixture.ts` (D-91-MJ-02).
- `./tests/tests/specs/perm/` — 89-04 + 90 perm spec directory (root for 9 new TIR6 perm specs).
- `./tests/tests/specs/voter/voter-mega-journey.spec.ts` — Append voter edit-steps (D-91-MJ-01 items 11 + 12).
- `./tests/tests/specs/candidate/candidate-mega-journey.spec.ts` — Append candidate edit-step (D-91-MJ-01 item 10).
- `./tests/tests/specs/visual/visual-regression.spec.ts` — Refactor target (D-91-RS-01).
- `./tests/tests/specs/perf/performance-budget.spec.ts` — Refactor target (D-91-RS-02).
- `./tests/tests/specs/a11y/a11y-smoke.spec.ts` — Refactor target (D-91-RS-02 + D-91-RS-02b).
- `./tests/tests/specs/candidate/candidate-bank-auth.spec.ts` — Refactor target (D-91-RS-05).
- `./tests/tests/specs/voter/voter-feedback-persistence.spec.ts` — **Delete in same plan as voter-mega feedbackDialog step** (D-91-MJ-03).
- `./tests/tests/__screenshots__/` — Visual baselines (rebaselined after Group A/B lands per D-91-RS-01).
- `./tests/tests/utils/testIds.ts` — Test ID inventory; new testids enumerated in PLAN.

### Frontend surface (testid additions / inspection)
- `./apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:158,184,197,235,247` — Existing feedback-* testids consumed by D-91-MJ-02 shared fixture.
- `./apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte:47,101,106-107` — Voter nav feedback button.
- `./apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte:36,105,107` — Candidate nav feedback button (not consumed by Phase 91 but informs forward use).
- `./apps/frontend/src/lib/components/input/Input.svelte:296` — `invalidUrl` error surface (candidate edit-step item 10).
- `./apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:15,266,294` — `customData.allowOpen` + `hideHero` rendering branches.
- `./apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte:78` — Voter-side `customData.allowOpen` info-rendering branch.
- `./apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:59` — `answersLocked` consumer (informs perm assertions).
- `./apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:55,60,377` — `answersLocked` derived state.
- `./apps/frontend/src/lib/utils/route/route.ts:21` — `Nominations: ${VOTER}/nominations` (voter all-nominations route).

### Settings layer
- `./packages/app-shared/src/settings/dynamicSettings.ts` — Default `DynamicSettings` (all 9 perm overrides anchor here).
- `./packages/app-shared/src/settings/dynamicSettings.type.ts:113,122,180,269,298,328` — Type definitions for each perm's target setting.
- `./packages/app-shared/src/data/customData.type.ts:26` — `customData.allowOpen` type definition.

### State + roadmap
- `.planning/ROADMAP.md:471` — Phase 91 entry.
- `.planning/STATE.md` — milestone position (v2.10, 88% complete, Phase 90 just shipped, Phase 91 next).

### Operator memory
- `/Users/kallejarvenpaa/.claude/projects/-Users-kallejarvenpaa-Desktop-OpenVAA-voting-advice-application/memory/feedback_e2e_did_not_run.md` — Treat "did not run" E2E tests as failures in all counts (cascade failures from upstream dependencies).
- `/Users/kallejarvenpaa/.claude/projects/-Users-kallejarvenpaa-Desktop-OpenVAA-voting-advice-application/memory/project_all_green_suite_priority.md` — Priority to get ALL e2e tests passing (no DATA_RACE, no CASCADE, no FAILURE-CLASS); decouple non-image tests from imgproxy. Phase 91 must not regress.
- `/Users/kallejarvenpaa/.claude/projects/-Users-kallejarvenpaa-Desktop-OpenVAA-voting-advice-application/memory/feedback_skip_ui_spec_for_a11y_only_phases.md` — Skip gsd-ui-phase auto-spawn for structural a11y / cite-and-fix phases. Phase 91's a11y refactor is also fixture-rework, not visual redesign — same skip applies if plan-phase considers ui-phase dispatch.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tests/tests/fixtures/voter-mega.fixture.ts`** — New function-fixture composition root with `answeredVoterPage`, `answerMode`, `answerCount`. Visual/perf/a11y refactor migrates onto this; extended if a `locatedVoterPage` (intermediate) variant is needed.
- **`tests/tests/fixtures/candidate/`** — Phase 89-02 candidate function-fixture library. `candidatePreviewPage` consumed by visual candidate-preview refactor.
- **`packages/dev-seed/src/templates/permutations/`** — Existing perm templates from 88-03 + 89-04 + 90. Lineage for new helper-based templates.
- **`apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte`** — Already has all 5 testids needed by `feedbackDialog` fixture (form, rating-N, description, submit, cancel). Researcher confirms whether a `feedback-success` testid exists or needs adding.
- **Existing perm spec naming** (`perm-disable-voter-app.spec.ts`, `perm-missing-nominations.spec.ts`) — Template for naming the 9 new TIR6 perm specs.
- **`buildRoute` utility** (`tests/tests/utils/buildRoute.ts`) — URL construction with locale + route IDs. Reusable for the new perm specs.

### Established Patterns
- **Function-fixture composition root** (88-04 / 89-02) — All new fixtures land as function-fixtures composed at a root (e.g., `fixtures/shared/index.ts` may emerge if shared library grows).
- **Per-perm template + per-perm playwright chain** (89-04 / 90) — Each TIR6 perm gets `data-setup-perm-X → perm-X → data-teardown-perm-X`. 9 new chains.
- **Per-template `externalIdPrefix`** (88-03 / 89-04 / 90) — Decouples concurrent perm runs. Helper preserves per-perm prefix.
- **Strict testid-driven selectors** (88-04 / 89-02 / 90-D-90-06) — No text-content selectors except for `[id desc]` seeded by perm templates.
- **`[id] desc` format** (88-01 / 89-01 lineage) — All seeded text content. Helper's `M` opinion-questions + `K` info-questions follow this.
- **Mega-journey absorption** (89-D-89-01) — TIR6 "New step" / "Edit Step" precedent: append into existing mega-journey spec, NOT a new spec.

### Integration Points
- **`tests/playwright.config.ts`** — 27 new project entries appended (9 perm setup + 9 perm spec + 9 perm teardown). No removals.
- **`packages/app-shared/src/settings/dynamicSettings.ts`** — Each perm template overlay touches a known field; no type changes needed (all 9 settings are already typed per `dynamicSettings.type.ts`).
- **`packages/dev-seed/src/templates/_helpers/`** — NEW directory for `buildMinimal.ts` helper (D-91-PD-01).
- **`tests/tests/fixtures/shared/`** — NEW directory for `feedbackDialog.fixture.ts` (D-91-MJ-02).
- **`tests/tests/__screenshots__/`** — Visual baselines rebaselined after Group A/B lands; planner sequences rebaseline AFTER baseV1-mutating Group A perms (none mutate baseV1 — all use fresh-minimal helper, so visual rebaseline is purely Phase-89-driven and can land independently).

</code_context>

<specifics>
## Specific Ideas

- **TIR6 `customData.allowOpen` permutation typo (D-91-PD-04).** TIR6:122 reads `!has info in answers to BOTH questions`. The `!` is a typo — candidate authors info text on BOTH Q1 and Q2 answers. The customData.allowOpen=false on Q2 SUPPRESSES rendering of that info on BOTH candidate-edit (`apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:294`) AND voter-details (`apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte:78`) surfaces. Document the typo in 91-RESEARCH.md so future TIR drafts catch it.

- **TIR6 `showCategoryTags` duplicate (D-91-PD-04).** Lines 111-115 + 117-119 are identical (`### Perm: questions.showCategoryTags = false / Go to questions / Expect not to see question category tag`). Treat as copy-paste artifact. Single perm spec for this setting.

- **Helper signature ergonomics.** `buildMinimal({ candidates: 2, opinionQuestions: 2, infoQuestions: 0, settings: { entities: { hideIfMissingAnswers: { candidate: true } } }, externalIdPrefix: 'perm-hide-missing-' })` — researcher refines actual signature based on `Template` shape. Cross-reference how existing perms structure their export (consume `defineTemplate({ ... })` or similar).

- **Feedback-dialog state-persistence assertion granularity.** TIR6:34-61 has 14 sequential expectations. Voter-mega-journey absorbs this as one or two test() blocks following the existing voter-mega test() discipline. The fixture exposes the expressions; the spec body sequences them.

- **Visual rebaseline determinism — baseV1 dependency.** Visual baselines are coupled to baseV1 row order + content. 89-01 added hero emoji on Q1 + hero image on Q2 + info on Q1; voter-results desktop/mobile screenshots will differ from the current baselines. Rebaseline is mandatory after Phase 89's mutations land in the screenshot pipeline. Capture in CI when Phase 91 PR lands; do not rely on developer machines for baseline capture (font rendering differs).

- **A11Y `locatedVoterPage` fixture extension.** If `voter-mega.fixture.ts` `answeredVoterPage` traverses too far (past the questions route, into results), a11y axe-smoke on the questions route needs a pre-results variant. Researcher inspects `voter-mega.fixture.ts` for an `answerCount: 0` or partial-answer variant; if absent, extend the fixture to expose `locatedVoterPage` (intermediate landing) or `partiallyAnsweredVoterPage`.

- **Bank-auth `expect` import provenance.** `candidate-bank-auth.spec.ts:25` imports `{ expect, test } from '../../fixtures'` — the index root. Researcher confirms whether that root pulls from `voter.fixture.ts`, the new function-fixture composition, or is independent. Swap to `@playwright/test` direct if it's pulling legacy stuff transitively.

- **Helper authoring discipline.** The `buildMinimal` helper does NOT consume baseV1 fixtures (hero, info, filtered-info, unregistered cand, test-qu-info-text required). Helper authors purely from primitives — supports forward-evolution without baseV1 churn.

</specifics>

<deferred>
## Deferred Ideas

- **Broader supersession sweep.** Other voter-* and candidate-* specs that may overlap with TIR6 perms/edit-steps stay in Phase 91. Researcher lists overlaps in 91-RESEARCH.md `Deferred — broader spec sweep` section. Action deferred to v2.11+ legacy-retirement phase (D-91-MJ-03).
- **Full migration of remaining 12 legacy `voter.fixture.ts` consumers.** voter-detail, voter-matching, voter-results, voter-popups, voter-popup-hydration, voter-question-rendering-boolean/categorical, voter-allowopen, voter-browse-without-match, voter-visibility-required, voter-navigation, candidate-settings. Migrate when the broader sweep runs (D-91-RS-03).
- **`voter.fixture.ts` deletion.** Deferred to v2.11+ legacy-retirement phase after all consumers migrate (D-91-RS-04).
- **Bank-auth dataset authoring.** Edge-Function-direct tests synthesize their own state; per-perm dataset deferred indefinitely (D-91-RS-05).
- **Candidate-side feedback fixture consumption.** Shared `feedbackDialog.fixture.ts` location enables candidate-side consumption later; Phase 91 does NOT add candidate-side feedback assertions (D-91-MJ-02).
- **Helper extension for non-minimal topologies.** Existing perms `perm-2e-asymmetric`, `perm-2e-shared`, `perm-disjoint-1co`, `perm-disable-election-1co`, `perm-disable-election-2co`, `perm-not-located-2e2cg`, `perm-startfromcg` stay bespoke. Extend the helper to cover these later if a follow-up phase needs to (D-91-PD-03).
- **TIR draft hygiene** — flag TIR6 typos (`!has info` + dup `showCategoryTags`) so future TIR drafts catch them. No phase action; documentation hygiene only.
- **89/90 carry-over deferred items** (e2eTemplate row-count drift, QuestionInCardContent election-specificity, emailHelper.ts retirement, runes-test build/typecheck errors). Orthogonal to Phase 91.

</deferred>

---

*Phase: 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth*
*Context gathered: 2026-05-30 — TIR6 direct-ingest via /gsd-discuss-phase 91 --chain*
