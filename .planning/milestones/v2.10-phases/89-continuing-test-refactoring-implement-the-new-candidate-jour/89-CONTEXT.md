# Phase 89: Continuing test refactoring — implement the new candidate journey (and related edits) per TEST-INVENTORY-REFACTOR-4.md - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply Phase 88's mega-journey + parallel-landing + strict-fixtures pattern to the **candidate app**, per `TEST-INVENTORY-REFACTOR-4.md` (TIR4). Five concrete deliverables:

1. **baseV1 dataset extensions** — hero emoji on Q1, hero image on Q2 + base category, info content on Q1, one **unregistered** candidate (name+email+party AA, north-const nomination, election symbol "999"), `test-qu-info-text` required, 3 filtered info questions (municipal-only / north-only / south-only) (TIR4:17-32, 82-100).
2. **Voter mega-journey extensions** — assert hero content visible on Q1/Q2/category; Info button visible only on Q1 with content; candidate-details info-question visibility narrowed to the north-const-scoped one (TIR4:25-32, 99).
3. **Candidate fixture library** — 12 function-fixtures (emailBucket, candidateLoginPage, candidateTermsOfUsePage, candidateHomePage, candidateForgotPasswordPage, candidatePasswordSetter, candidateProfilePage, candidateQuestionsOverviewPage, candidateQuestionPage, candidatePreviewPage, candidateLogoutButton) authored fresh as function-fixtures (TIR4:58-80).
4. **Candidate mega-journey** — single serial spec walking the full flow: static pages → registration email → password set → ToU accept → home → logout → forgot-password+reset via Inbucket → login (with disabled-submit + error-message branches) → return-from-static-pages → home (three-task state) → profile (portrait validation, info questions including filtered-out absence, required-badge, partial-fill stays on home, complete-fill advances to questions) → questions-overview (intro, hero, expanders, edit-1st) → walk all opinion questions → completed-home → preview (info + portrait + opinions, no voter-comparison) → final logout (no confirmation) (TIR4:101-257).
5. **3 settings permutations** — `voterApp` disabled (/, /elections unavailable; /candidate available), `candidateApp` disabled (/candidate unavailable; /, /elections available), per-app notification popups (each visible on its app's route, NOT the other) (TIR4:34-54).

**Out of scope** (explicitly deferred per `TEST-INVENTORY-REFACTOR-5.md`):
- Localisation, hero video, extended question info, a11y, visual drift, performance — entire TIR5 "To do" list.
- TIR5-listed specific tests: 7.1.1 read-only-warning, 3.3.1 candidate-translation, 4.2.5-7 A11Y-02 persistence, 5.1.1-6 A11Y-01 validation matrix, 7.1.7/8 hideHero, 7.1.10/11/13-17 SETTINGS-01 wave A, 27.1.1 variant-allowopen setup, 28.1.1-3 voter-allowopen, 34.* visual regression, 35.* perf budget, 36.* a11y smoke, 37.1.1-6 bank-auth.
- Retirement of `emailHelper.ts` (deferred to v2.10 milestone close or later).

</domain>

<decisions>
## Implementation Decisions

### Data shape

- **D-89-01: Mutate baseV1 in place; do NOT fork to baseV2.** All TIR4 dataset additions (hero content, info content, unregistered candidate, required-text, 3 filtered info questions) land directly on the existing `packages/dev-seed/src/templates/baseV1.ts`. The voter mega-journey must absorb the new assertions in the SAME plan as the baseV1 changes (89-01), in lockstep — TIR4:25-32 + 99 explicitly require voter-mega coverage of the new content, so a fork would defeat its own isolation goal.
- Any pre-existing dev-seed unit-test row-count assertions (e.g., the deferred `packages/dev-seed/tests/templates/e2e.test.ts:431` `questions.fixed.length === 18`) that newly mismatch as a side effect of baseV1 mutation are surfaced as deferred-items, NOT fixed in 89-01 (carry-over of 88-04 deferred-items.md convention).

### Fixture pattern

- **D-89-02: Function-fixtures, fresh, for ALL 12 candidate page-objects.** Author at `tests/tests/fixtures/candidate/*.fixture.ts` with a new composition root (sibling to `fixtures/views.ts` and `fixtures/voter-mega.fixture.ts`). The 7 legacy PageObject classes at `tests/tests/pages/candidate/*Page.ts` (HomePage, LoginPage, PreviewPage, ProfilePage, QuestionPage, QuestionsPage, SettingsPage) stay UNTOUCHED — they continue to back the legacy candidate-*.spec.ts files until those specs are deleted (parallel-landing per 88-CONTEXT.md §"Parallel-setup principle").
- Page-object naming in the new fixture library follows TIR4's camelCase labels (`candidateLoginPage`, `candidateProfilePage`, etc.) — NOT the legacy PascalCase class names.
- Researcher / planner picks the exact composition-root path (e.g., `fixtures/candidate-mega.ts` mirroring `voter-mega.fixture.ts`) but the function-fixture PATTERN is locked.

### Plan partition

- **D-89-03: Five plans.**
  - **89-01: baseV1 dataset extensions + voter mega-journey assertions.** Self-contained data-only PR. Voter-mega-journey absorbs hero/info/filtered-info asserts in lockstep. No candidate work yet. Existing voter-mega tests must stay green.
  - **89-02: Candidate fixture library.** 12 function-fixtures + new composition root. No specs consume them yet. Parallel-safe.
  - **89-03: Candidate mega-journey spec.** Long serial spec walking TIR4:101-257 (registration → logout). Consumes 89-01 data + 89-02 fixtures. Lands as a NEW spec file alongside the legacy 10 candidate-*.spec.ts (parallel-landing). New playwright project chain `data-setup-candidate-mega → candidate-mega-journey → data-teardown-candidate-mega` (researcher decides exact names).
  - **89-04: 3 settings permutations.** Three new `perm-*` templates (perm-disable-voter-app, perm-disable-candidate-app, perm-per-app-notifications — researcher confirms naming) + three new perm spec files (`tests/tests/specs/perm/perm-disable-voter-app.spec.ts` etc.) + three setup/teardown pairs + 9 appended playwright projects (3 setup + 3 spec + 3 teardown). Parallel-safe with 89-02/89-03 via per-template `externalIdPrefix` decoupling (88-03 lineage).
  - **89-LAST: Legacy retirement.** Delete the 5 specs absorbed by mega-journey + perms (`candidate-auth.spec.ts`, `candidate-password.spec.ts`, `candidate-registration.spec.ts`, `candidate-questions.spec.ts`, `candidate-required-info.spec.ts`). Excise the absorbed cases 7.1.2/3/4 from `candidate-settings.spec.ts` (the file STAYS for its TIR5-deferred residual cases). Prune unused legacy PageObject classes (only those with zero remaining consumers). KEEP `candidate-settings.spec.ts` (residual), `candidate-profile.spec.ts`, `candidate-profile-validation.spec.ts`, `candidate-translation.spec.ts`, `candidate-bank-auth.spec.ts` intact — they hold TIR5-deferred tests that future phases must address.

### Legacy retirement scope (89-LAST)

- **D-89-04: Delete fully-absorbed specs; keep deferred-only specs.** Cuts:
  - `tests/tests/specs/candidate/candidate-auth.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-password.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-registration.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-questions.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-required-info.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-settings.spec.ts` — excise 7.1.2/3/4 only; KEEP 7.1.1, 7.1.7, 7.1.8, 7.1.10-17 (TIR5-deferred)
  - `tests/tests/pages/candidate/*Page.ts` — prune ONLY classes with zero remaining consumers (planner audits per-class)
- KEEPS:
  - `candidate-profile.spec.ts` (A11Y-02 persistence still pending)
  - `candidate-profile-validation.spec.ts` (A11Y-01/05/06/07 validation matrix still pending)
  - `candidate-translation.spec.ts` (3.3.1 still pending)
  - `candidate-bank-auth.spec.ts` (37.1.1-6 still pending)
  - `candidate-settings.spec.ts` residual (after 7.1.2/3/4 excision)

### emailBucket fixture scope

- **D-89-05: emailBucket as new function-fixture; emailHelper.ts coexists long-term.** New `emailBucket` fixture at `tests/tests/fixtures/candidate/emailBucket.fixture.ts` (or similar) exposes `expectEmail(subject)`, `getEmail(subject | nth)`, `getLinksInEmail(subject | nth)` per TIR4:58-63. Implementation MAY call the existing `tests/tests/utils/emailHelper.ts` utilities internally, OR be authored independently — researcher picks. The existing `emailHelper.ts` STAYS in place; its consumers (e.g., the soon-to-be-deleted `candidate-registration.spec.ts` and any other kept legacy spec that uses it) continue to use it directly. **Retirement of `emailHelper.ts`** is scheduled for end-of-milestone cleanup (v2.10 close or v2.11+) once 89-LAST has deleted the legacy specs that consume it AND any kept-but-deferred specs have been migrated or replaced.

### Claude's Discretion

- **Exact filenames and playwright-project names** for the new candidate fixture composition root, the candidate-mega spec, the 3 perm templates / setups / teardowns / specs, and the 3 perm playwright-project triples. Follow established naming (88-01 / 88-03 / 88-04 lineage).
- **Whether the candidate-mega spec is one `test()` block or one `test.describe('...', { mode: 'serial' })` with N sub-tests.** Match the shape Phase 88-01 / 88-04 settled on for `voter-mega-journey.spec.ts`.
- **How to wire the new function-fixtures into the existing test framework** (separate composition root file vs. extension of `fixtures/views.ts`).
- **Internal implementation of `emailBucket`** — wrap `emailHelper.ts` or stand-alone.
- **Exact testid additions** to existing candidate-app Svelte components (login, ToU, password-setter, forgot-password, profile-portrait, candidate-home task tiles, questions-overview category-expanders, preview-page) needed for strict fixture selectors. 88-04 added 12 frontend testids per the resolver/cards refactor — same convention applies here.
- **Whether to surface 88-04's `QuestionInCardContent` follow-up** during baseV1 mutation (D-89-01 candidate-details visibility): if the new filtered info question setup exposes a similar election-specificity gap (per the v2.11+ TODO surfaced in 88-04-SUMMARY Gate A.4), researcher flags it as deferred — does NOT block 89.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary design source (TIR4 / TIR5)
- `./TEST-INVENTORY-REFACTOR-4.md` — Full TIR4 spec (the "what to build" for Phase 89). PRIMARY design source. 257 lines.
- `./TEST-INVENTORY-REFACTOR-5.md` — Out-of-scope list (what NOT to rewrite in 89). Defines the deferred items that keep certain legacy specs alive.
- `./TEST-INVENTORY-REFACTOR-1.md` — Original (Phase 88-01) refactor doc. baseV1 dataset + settings shape defined verbatim (lines 13-200); refactor philosophy + conventions (lines 1-12). Plan 89-01 extends this dataset.
- `./TEST-INVENTORY-REFACTOR-2.md` / `./TEST-INVENTORY-REFACTOR-3.md` — Phase 88 lineage docs.

### Phase 88 prior decisions (carry forward)
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-CONTEXT.md` — Parallel-landing principle, setupFromTemplate helper signature, baseV1 dataset shape, per-template externalIdPrefix convention.
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-SUMMARY.md` — Phase 88 most recent plan. Function-fixture (`views.ts`) pattern established. Gate A.4 surfaced the v2.11+ `QuestionInCardContent` election-specificity TODO (may bear on D-89-01).
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-ADR-cardContents-resolver.md` — Seed-time resolver ADR; baseV1 mutations should preserve this convention.
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/deferred-items.md` — `e2e.test.ts:431` dev-seed row-count assertion drift; 89-01 may aggravate this (acceptable — defer per convention).
- `.planning/ROADMAP.md:370-378` — Phase 89 entry.
- `.planning/STATE.md` — milestone position (v2.10, 92% complete, Phase 88 executing → Phase 89 is the next).

### Test framework anchors
- `./tests/playwright.config.ts` — project graph; 89-03 + 89-04 add new project chains alongside the existing ones (no removal except 89-LAST).
- `./tests/tests/fixtures/index.ts` — legacy PageObject root (UNCHANGED during 89; pruned in 89-LAST).
- `./tests/tests/fixtures/views.ts` — Phase 88-04 function-fixture composition root (template for 89-02's new composition root).
- `./tests/tests/fixtures/voter-mega.fixture.ts` — 88-01 voter mega-journey fixture (template for 89-02 conventions: serial-spec docstring, answerMode pattern).
- `./tests/tests/setup/setupFromTemplate.ts` — Phase 88-01 generic helper (89-04 perm setups MUST use this; do not re-author).
- `./tests/tests/setup/baseV1.setup.ts` + `./tests/tests/setup/baseV1.teardown.ts` — 88-01 setup/teardown templates for new perm setups in 89-04.
- `./tests/tests/specs/voter/voter-mega-journey.spec.ts` — 88-01/88-04 reference for the mega-journey spec shape that 89-03 mirrors.
- `./tests/tests/specs/voter/voter-mega-journey.README.md` — voter-mega documentation pattern (write a candidate-mega-journey.README.md to match).
- `./tests/tests/specs/perm/` — Phase 88-03 perm specs; template for 89-04's 3 new perm specs.
- `./tests/tests/utils/emailHelper.ts` — existing email utilities; 89-02 emailBucket consumes or wraps these.
- `./tests/tests/utils/supabaseAdminClient.ts` — existing admin-client for registration-link extraction; candidate-mega registration flow uses it.

### Data layer anchors
- `./packages/dev-seed/src/templates/baseV1.ts` — the file Plan 89-01 MUTATES. ~1000+ lines; preserve all convention invariants (externalIdPrefix '', kebab external_ids, seed: 42, generateTranslationsForAllLocales: false).
- `./packages/dev-seed/src/templates/permutations/` — Phase 88-03 perm template directory; 89-04 adds 3 new templates here.
- `./packages/dev-seed/tests/templates/e2e.test.ts:431` — known-deferred row-count drift; 89-01 may aggravate.

### Frontend surface (testid additions expected)
- `./apps/frontend/src/routes/[[lang=locale]]/candidate/` — candidate app routes; researcher inspects current testid coverage.
- `./apps/frontend/src/lib/candidate/components/` — candidate-specific components; new testids added during 89-02 fixture authoring (if needed).
- `./apps/frontend/src/lib/components/` — base components consumed by candidate flows.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`setupFromTemplate(template)` helper** at `tests/tests/setup/setupFromTemplate.ts` — Phase 88-01 generic helper. 89-04's 3 new perm setups MUST consume this rather than authoring inline teardown→seed→seed-check loops.
- **`voter-mega.fixture.ts`** — template for 89-02 fixture library docstring conventions (TIR4 quote, sibling-not-replacement rationale, parallel-landing rationale).
- **`fixtures/views.ts`** — composition root template for 89-02's new candidate fixture root.
- **`fixtures/index.ts`** — legacy PageObject root; STAYS untouched through 89; selectively pruned in 89-LAST.
- **`emailHelper.ts`** (`extractLinkFromHtml`, `getLatestEmailHtml`, `countEmailsForRecipient`, `toCallbackUrl`) — building blocks for 89-02 `emailBucket` fixture.
- **`supabaseAdminClient.ts`** — admin-side registration trigger; candidate-mega registration flow consumes.
- **`testIds` utility** at `tests/tests/utils/testIds.ts` — central testid namespace; 89-02 additions follow the existing namespacing.
- **Phase 88-01 baseV1 dataset rows** — extend the existing `questions.fixed[]`, `candidates.fixed[]`, `nominations.fixed[]` arrays rather than re-deriving.

### Established Patterns
- **`[id] desc` heading format** — locked since 88-04 (`[qu-opin-base-1-likert5] Base opinion 1 — Likert 5.`). All new testid-aware assertions and new dataset row labels follow this format.
- **Strict assertions, no soft assertions, no fallbacks** — TIR4:8-12 + Phase 88 lineage. No `.catch(() => true)`, no `if (cond) skip`, no `try { ... } catch { soft }`. Hard waits, hard `toHaveCount`, hard predicates.
- **Serial-only mega-journey** — TIR4:11 ("serial only to minimise db leakage issues"). 89-03 candidate-mega spec is a single serial block (matching 88-01 voter-mega shape).
- **Minimal data for perms** — TIR4:12. 89-04 perm templates contain ONLY the rows needed to surface the under-test setting (precedent: 88-03 perm templates).
- **Parallel landing** (88-CONTEXT.md §"Parallel-setup principle") — new specs/fixtures land alongside old; old retired in a LATER plan (here: 89-LAST). Existing tests stay green throughout 89-01..89-04.
- **Per-template `externalIdPrefix` decoupling** — 88-03 sanctioned this; 89-04 perm templates each use distinct prefixes (e.g., `'test-perm-novapp-'`, `'test-perm-nocand-'`, `'test-perm-notif-'`) to enable parallel execution with the baseV1 chain.
- **No `.likert-only` flag** — TIR4:1-12 lineage; new template + base dataset eliminate the need for the flag (Phase 88-NN retirement target).

### Integration Points
- **baseV1 mutation propagates to voter-mega-journey** — assertions added in same plan (89-01).
- **89-02 fixture library wires into playwright project graph via new chain in 89-03** (`data-setup-candidate-mega → candidate-mega-journey → data-teardown-candidate-mega`).
- **89-04 3 perm chains wire into playwright config** alongside the existing perm chains, parallel-safe with the candidate-mega chain via externalIdPrefix.
- **89-LAST deletes legacy spec files** referenced by `playwright.config.ts:testIgnore` lists — config must be updated to remove the now-defunct ignore entries.

</code_context>

<specifics>
## Specific Ideas

- **Unregistered candidate election symbol must be exactly `"999"`** (TIR4:90).
- **Hero content shape**: emoji on Q1, image on Q2, image on base question category (TIR4:18-20). Researcher confirms how the existing `QuestionInCardContent` resolver handles emoji vs image variants.
- **Info content on Q1**: "(fanning out translations) info content to 1st question" (TIR4:21) — must fan out across all locales the template generates (single-locale per `generateTranslationsForAllLocales: false`, so effectively one locale; confirm).
- **3 filtered info questions**: each of test type, scoped to municipal-only / north-only / south-only (TIR4:94-99). Voter mega-journey asserts ONLY the north-only one is visible on the candidate-details info-question surface.
- **emailBucket fixture surface**: `expectEmail(subject)`, `getEmail(subject | nth)`, `getLinksInEmail(subject | nth)` — TIR4:60-63 verbatim signatures.
- **candidate-mega-journey login flow assertions**: submit-disabled when not email-or-password; error-message on wrong password (TIR4:144-150). New password works after error.
- **candidate-mega-journey profile-fill flow**: portrait validation errors (wrong format, oversize); fill all info questions EXCEPT required + first; submit takes user to candidateHomePage with opinions-step disabled; return to profile + fill required → submit advances to questionsOverviewPage (TIR4:174-188).
- **candidate-mega-journey questions-overview category-expander toggle**: click collapses, click again expands (TIR4:213-215).
- **candidate-mega-journey preview**: shows entered info answers + portrait + opinion answers; MUST NOT show "You and X disagree"-type voter-comparison messages (TIR4:245-252).
- **Final logout from logged-in candidate**: no confirmation dialog (TIR4:253-256) — differs from earlier-in-flow logout which DOES show a dialog (TIR4:124-126).

</specifics>

<deferred>
## Deferred Ideas

All TIR5 "STILL TO BE ADDED LATER" items are explicitly deferred:

- **Localisation, hero video, extended question info, a11y, visual drift, performance** (TIR5:3-8) — entire TO-DO list; future milestones / dedicated phases.
- **7.1.1 read-only warning** (candidate-settings:117) — kept in legacy spec; future phase.
- **3.3.1 candidate translation** (candidate-translation:27) — kept in legacy spec; future phase.
- **4.2.5-7 A11Y-02 persistence** (candidate-profile:295/332/358) — kept in legacy spec; future phase.
- **5.1.1-6 A11Y-01 validation matrix** (candidate-profile-validation) — kept in legacy spec; future phase.
- **7.1.7/8 hideHero** (candidate-settings:312/343) — kept in legacy spec; future phase.
- **7.1.10/11/13-17 SETTINGS-01 wave A** (candidate-settings:762) — kept in legacy spec; future phase.
- **27.1.1 variant-allowopen setup** — future phase.
- **28.1.1-3 voter-allowopen entity comment** (voter-allowopen) — future phase.
- **34.1.1-4 visual regression** (visual-regression) — future phase / dedicated visual-regression milestone.
- **35.1.1 voter results perf budget** (performance-budget) — future phase / dedicated perf milestone.
- **36.1.1-6 A11Y-04 axe smoke** (a11y-smoke) — future phase / dedicated a11y milestone.
- **37.1.1-6 candidate bank-auth** (candidate-bank-auth) — future phase.

Phase-89 internal deferred items:

- **emailHelper.ts retirement** — deferred to end-of-milestone (v2.10 close or v2.11+). 89-02 emailBucket coexists; emailHelper.ts is NOT deleted in 89-LAST.
- **Phase 88-04 `QuestionInCardContent` election-specificity TODO** (Gate A.4) — v2.11+ candidate; researcher flags but does NOT block 89-01 baseV1 mutations.
- **Phase 88-04 `e2e.test.ts:431` `questions.fixed.length === 18` drift** — already deferred; 89-01 may aggravate but does NOT fix.
- **Legacy PageObject classes** in `tests/tests/pages/candidate/` — pruned ONLY when their last consumer is deleted in 89-LAST. Any class still consumed by a TIR5-deferred legacy spec stays.

### Reviewed Todos (not folded)

None — no todo-system cross-reference matched Phase 89's scope during discussion.

</deferred>

---

*Phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour*
*Context gathered: 2026-05-29*
