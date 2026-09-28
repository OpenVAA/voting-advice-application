# Phase 119: E2E Fixtures & Helpers + Seed - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 24 (fixtures/helpers + dev-seed templates + registry/CLI + production data-testid edits + probe specs)
**Analogs found:** 24 / 24 (every new file has a strong in-repo analog)

This phase is almost entirely *mirror-an-existing-pattern* work. There are exactly two genuinely-new mechanisms (the `trackingIntercept` `window.umami` stub fixture and the dark-mode `page.emulateMedia` reader); everything else copies a verified analog. Per the 119↔120↔129 boundary, this map deliberately EXCLUDES Playwright project wiring, `tests/tests/setup/**` setup/teardown pairs, `*.spec.ts` files, and the Phase-129 deferred-cluster fixtures.

---

## File Classification

### Fixtures & helpers (E2E test layer — `tests/tests/**`)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` (NEW) | fixture (browser intercept) | event-driven / capture | `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` (standalone shared factory shape) | role-match (mechanism new) |
| `tests/tests/fixtures/voter/entityFilters.fixture.ts` (MODIFY — add `selectAll`/`selectNone`) | fixture (page-object method) | request-response (UI toggle) | the file itself — extend `createFilter()` returned object (lines 32–124) | exact (in-file extension) |
| `tests/tests/fixtures/voter/resultsPage.fixture.ts` (MODIFY — `expectSubMatch`) | fixture (page-object reader) | request-response (read) | `resultsPage.fixture.ts` existing readers; reuse `score-gauge`/`sub-matches` testids | exact (in-file extension) |
| `expectVideo(present)` reader (NEW — voter+candidate) | fixture/helper (reader) | request-response (visibility assert) | `feedbackDialog.fixture.ts` (testid-anchored reader factory) | role-match |
| `expectInfoMode` / `expectInfoSections` / `expectArguments` readers (NEW) | fixture/helper (readers) | request-response (read) | `feedbackDialog.fixture.ts` reader shape; rides `voterQuestionsPage.fixture.ts` | role-match |
| survey/feedback popup handle + dismiss-and-reload helper (NEW) | fixture/helper (reader+action) | request-response + reload | `feedbackDialog.fixture.ts` (neighbour, same dir) | exact (same family) |
| org-match-score readout + About-disclosure reader (NEW) | fixture/helper (reader) | request-response (read) | `feedbackDialog.fixture.ts`; reuse `score-gauge`/`voter-about-content` testids | role-match |
| dark-mode handle + `expectTheme('dark'\|'light')` (NEW — shared) | fixture/helper (reader) | event-driven (media emulation) | `feedbackDialog.fixture.ts` shape; mechanism = `page.emulateMedia` | role-match (mechanism new) |
| `expectNavMenuItems([...])` reader (NEW — shared) | fixture/helper (reader) | request-response (read) | `feedbackDialog.fixture.ts`; reuse `nav-menu`/`nav-menu-item` testids | role-match |
| mobile-nav-open helper (NEW — shared, only if needed) | helper (action) | request-response | reuse `nav-menu-toggle` testid | role-match |
| `tests/tests/utils/voterNavigation.ts` (MODIFY — delete 4 dead helpers + scrub NOTE) | utility (deletion) | n/a | the file itself (grep-verified zero-caller cluster) | exact |
| `tests/tests/utils/testIds.ts` (MODIFY — add new testid keys) | config (registry) | n/a | the file itself (lines 11–296, kebab-case nested map) | exact |
| `tests/tests/fixtures/voter/views.ts` (MODIFY — wire voter-scoped new fixtures) | config (composition root) | n/a | the file itself (`base.extend<ViewFixtures>`, lines 37–68) | exact |
| `tests/tests/specs/_probes/*.probe.spec.ts` (NEW — one per fixture) | test (smoke/probe) | request-response | no probe convention yet — establish using `views.ts` `test` import + CLI seed | no analog (new convention) |

### dev-seed templates + registry/CLI (`packages/dev-seed/src/**`)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts` (NEW) | seed template (multi-cat/multi-q) | batch (seed write) | `perm-2e-shared.ts` (hand-authored multi-fixed shape) — NOT `buildMinimal` | role-match (see Pitfall 2) |
| `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts` (NEW) | seed template (multi-type opinion) | batch | `perm-2e-shared.ts` (hand-authored) — NOT `buildMinimal` | role-match |
| `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` (NEW) | seed template (org+members) | batch | `perm-2e-shared.ts` (org rows via `buildOrganizations()`) | role-match |
| `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts` (RENAME from `perm-header-show-feedback.ts` + EXTEND) | seed template (settings overlay) | batch | `perm-header-show-feedback.ts` (the file being renamed — `buildMinimal` + `settingsOverlay`) | exact |
| `packages/dev-seed/src/templates/e2e/perm/perm-access-disable.ts` (NEW — consolidates 2) | seed template (settings overlay) | batch | `perm-hide-hero.ts` / `perm-header-show-feedback.ts` (`buildMinimal` + `settingsOverlay`) | exact |
| `packages/dev-seed/src/templates/e2e/base.ts` (MODIFY — add `customData.terms` + optional org slice) | seed template (fixed rows) | batch | `base.ts` itself (existing `fixed[]` rows ~458–502) | exact (in-file additive) |
| `packages/dev-seed/src/templates/index.ts` (MODIFY — registry: rename/add/consolidate) | config (registry) | n/a | the file itself (lines 16–132 — import + `BUILT_IN_TEMPLATES` + re-export, 3 edits/template) | exact |
| `packages/dev-seed/src/templates/default.ts` (MODIFY — UNBLK-03 docstring + defensive setting) | seed template (docstring/setting) | batch | the file itself (docstring reconciliation) | exact |
| `packages/dev-seed/src/cli/seed.ts` (MODIFY — remove `--likert-only`) | config (CLI) | n/a | the file itself (lines 34, 65, 85–98) | exact (deletion) |
| `packages/dev-seed/src/cli/likert-only.ts` (DELETE) | utility (CLI filter) | n/a | n/a (pure deletion) | exact |
| `packages/dev-seed/tests/cli/likert-only.test.ts` (DELETE) | test | n/a | n/a (pure deletion) | exact |
| `packages/dev-seed/src/cli/help.ts` + `tests/cli/help.test.ts` (MODIFY) | config + test | n/a | the files themselves | exact |
| `packages/dev-seed/src/index.ts` (MODIFY — drop 2 exports) | config (barrel) | n/a | the file itself (lines 50, 74) | exact |

### Production source `data-testid` additions (`apps/frontend/src/**`)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/components/video/Video.svelte` (root `<div>` ~655) | component (testid add) | n/a | any existing `data-testid="…"` in the suite (e.g. `Feedback.svelte:158`) | exact |
| `QuestionExtendedInfoButton.svelte` + opened modal/dialog body (EPERM-07) | component (testid add) | n/a | existing `voter-questions-info-button` on `QuestionBasicInfo.svelte` | exact |
| `QuestionArguments.svelte` (per-group, categorical by `choiceId` ~59) | component (testid add) | n/a | `feedback-rating-{value}` keyed-testid pattern (`Feedback.svelte:184`) | exact |
| `QuestionExtendedInfo.svelte` (per `infoSections` section) | component (testid add) | n/a | keyed-testid pattern | exact |
| `QuestionHeading.svelte` term trigger + `Term.svelte` popup (EPERM-07 base) | component (testid add) | n/a | existing testid attribute pattern | exact |
| `FeedbackPopup.svelte` + `SurveyPopup.svelte` roots (EPERM-09) | component (testid add) | n/a | existing root-element testid pattern | exact |
| `EnumeratedEntityFilter.svelte` toggle button (~221, `{#if values.length > 3}`) | component (testid add) | n/a | existing testid on Button | exact |
| `about/+page.svelte` `organizationMatching.content` `<p>` (optional) | route (testid add) | n/a | existing `voter-about-content` testid (~50) | exact |

### NO new test-id needed (REUSE existing)

| Helper | Reuse |
|--------|-------|
| `expectNavMenuItems` (EFLOW-09) | `testIds.shared.navigation.menu` / `.menuItem` (`testIds.ts:256–262`) |
| mobile-nav-open (EFLOW-11) | `testIds.shared.navigation.menuToggle` (`testIds.ts:262`) |
| org-match-score (EPERM-10) | `testIds.voter.results.scoreGauge` = `score-gauge` (`testIds.ts:190`); add org-scoped id only if disambiguation needed |
| About disclosure (EPERM-10) | `testIds.voter.about.content` = `voter-about-content` (`testIds.ts:226`); tighter `<p>` id optional |
| `expectSubMatch` (EFLOW-04) | `testIds.voter.results.subMatches` = `sub-matches` (`testIds.ts:191`) |

---

## Pattern Assignments

### `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` (NEW fixture, event-driven capture)

**Analog:** `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` (standalone shared factory — same dir, same `create<Name>(page)` + typed-interface shape). Mechanism is new (see RESEARCH §Tracking Emission Boundary).

**Factory + interface shape to mirror** (`feedbackDialog.fixture.ts:44–87`):
```ts
export interface FeedbackDialogFixture {
  readonly dialog: Locator;
  expectVisible(): Promise<void>;
  // ...
}
export function createFeedbackDialog(page: Page): FeedbackDialogFixture {
  const dialog = page.getByTestId('feedback-form');
  return { /* methods */ };
}
```

**New mechanism (NOT in analog — from RESEARCH §Tracking Emission Boundary, VERIFIED):**
- `page.addInitScript` to define `window.umami = { track: (name, data) => (window.__trackCalls ||= []).push({name, data}) }` BEFORE navigation. The app's `sendUmamiEvent` (`UmamiAnalytics.svelte`) calls `window.umami.track(name, data)` — this is the real emit seam (`+layout.svelte:152` does `sendTrackingEvent.set(umamiRef.trackEvent)`).
- `getTrackCalls()` reads via `page.evaluate(() => window.__trackCalls ?? [])`.
- **Arming prerequisite:** seed `analytics.platform='umami'` + `analytics.trackEvents=true` (so `UmamiAnalytics` mounts) AND consent `granted` in userPreferences (so `shouldTrack===true`, gate at `trackingService.svelte.ts:121`). Without these, nothing emits (Pitfall 5).
- Stubbing avoids any real network to `cloud.umami.is` (cardinal-rule safe).
- Async factory (`createTrackingIntercept` returns a Promise because it calls `addInitScript`).

**Composition root:** register in the SHARED path (joins `feedbackDialog`, `langSelector`), NOT the voter root — RESEARCH §Pattern 1 + Fixtures Inventory.

---

### `tests/tests/fixtures/voter/entityFilters.fixture.ts` (MODIFY — add `selectAll()`/`selectNone()`)

**Analog:** the file itself. The `createFilter(filterRow)` returned object (lines 32–124) already exposes `getOptions`, `setSelection`, `setNumberRange`. Add the two new methods alongside.

**Existing returned-object shape to extend** (`entityFilters.fixture.ts:32–124`):
```ts
function createFilter(filterRow: Locator) {
  return {
    getOptions(): Locator { return filterRow.getByTestId(testIds.voter.results.filterOption); },
    async setSelection(values) { /* iterate + check/uncheck */ },
    async setNumberRange(min, max) { /* ... */ }
    // ADD: async selectAll() / async selectNone() — click the new single toggle button
  };
}
```

**Settle-before-count invariant to copy** (`entityFilters.fixture.ts:76`):
```ts
await expect(options.first()).toBeVisible({ timeout: 5_000 });
const total = await options.count();
```
The same race applies to the toggle (options mount reactively after Expander auto-expand).

**Mechanism note (RESEARCH, VERIFIED):** the affordance is a SINGLE toggle button whose text flips `selectAll`/`unselectAll` via `allSelected`, rendered only `{#if values.length > 3}` (`EnumeratedEntityFilter.svelte:219–221`). It is NOT separate all/none buttons. `selectAll()` clicks when not-all-selected; `selectNone()` clicks when all-selected. The seeded categorical filter MUST have ≥4 options to surface it. New testid required on the toggle button.

**Rigidity contract (copy verbatim — `entityFilters.fixture.ts:9–17`):** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing interactions. All locators testid-anchored via `testIds`.

---

### `perm-question-video.ts` / `perm-interactive-info.ts` / `perm-org-matching.ts` (NEW hand-authored perm templates, batch seed)

**Analog:** `packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts` — the canonical HAND-AUTHORED multi-fixed template. **DO NOT use `buildMinimal`** for these three (Pitfall 2: `buildMinimal` only emits a single Likert-5 + text question in one `qc-opin`/`qc-info` category pair; it cannot express the 5-question/3-category video layout or the Likert+Boolean+Categorical opinion mix).

**Template literal skeleton to mirror** (`perm-2e-shared.ts:25–137`):
```ts
const P = 'e2e-perm-qvid-';   // own namespaced prefix per template
export const permQuestionVideoTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,
  elections:           { count: 0, fixed: [ /* el-1 ... constituency_groups:[{external_id: `${P}cg-1`}] */ ] },
  constituency_groups: { count: 0, fixed: [ /* cg-1, constituencies:[{external_id:`${P}co-1a`}] */ ] },
  constituencies:      { count: 0, fixed: [ /* co-1a */ ] },
  organizations:       { count: 0, fixed: buildOrganizations() },
  question_categories: { count: 0, fixed: buildQuestionCategories() },  // ← extend to 3 cats for video layout
  questions:           { count: 0, fixed: buildQuestions({ prefix: P }) },  // ← or hand-author 5 questions w/ customData.video on q1,q3,q5
  candidates:          { count: 0, fixed: [ buildCandidate({...answersByExternalId: buildStandardCandidateAnswers({prefix:P})}) ] },
  nominations:         { count: 0, fixed: [ ...buildElectionConstituencyNoms({...}) ] },
  app_settings:        { count: 0, fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }] }
};
export default permQuestionVideoTemplate;
```
Imports block to copy from `perm-2e-shared.ts:14–23` (`buildCandidate`, `buildElectionConstituencyNoms`, `buildOrganizations`, `buildQuestionCategories`, `buildQuestions`, `buildStandardCandidateAnswers`, `MINIMAL_BASE_APP_SETTINGS` from `./shared`; `Template` type from `../../../template/types`).

**Per-template customData shapes (RESEARCH §customData Seed Shapes, VERIFIED against `customData.type.ts`):**
- `perm-question-video`: `customData.video: VideoContent` = `{ title, sources: string[], captions, poster, aspectRatio, transcript? }` on questions q1/q3/q5 only (none on category intros). Prefix `e2e-perm-qvid-`.
- `perm-interactive-info`: one question `questions.interactiveInfo.enabled=true` (popup) + one default (expander); `customData.infoSections: Array<{title, content}>` on ≥1 question; `customData.arguments: Array<QuestionArguments>` where `QuestionArguments = { arguments: Array<{id?, content}>, type: ArgumentType, choiceId? }` on THREE questions — one Likert/ordinal, one Boolean, one Categorical (set `choiceId` for the categorical carrier).
- `perm-org-matching`: `matching.organizationMatching` in settings; an org with SOME own `answersByExternalId` + member candidates answering the questions the org leaves blank (so none/answersOnly/impute differ). Org rows via `buildOrganizations()`.

**Discretion (RESEARCH A4):** alternatively EXTEND `buildMinimal` (add `opinionQuestionTypes[]` + multi-category support — `customDataByQuestion` already exists). Prefer extension only if it stays small; else hand-author per this analog. If extending, add coverage to `_helpers/buildMinimal.test.ts`.

---

### `show-feedback-survey.ts` (RENAME from `perm-header-show-feedback.ts` + EXTEND) & `perm-access-disable.ts` (NEW consolidated)

**Analog:** `perm-header-show-feedback.ts` (full file — `buildMinimal` + `settingsOverlay`) and `perm-hide-hero.ts`. These ARE `buildMinimal`-shaped (single Likert question is fine for settings-overlay perms).

**`buildMinimal` + `settingsOverlay` pattern to copy** (`perm-header-show-feedback.ts:16–31`):
```ts
import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';
const P = 'e2e-perm-header-feedback-';
export const permHeaderShowFeedbackTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1, opinionQuestions: 1, infoQuestions: 0,
  settingsOverlay: { header: { showFeedback: true } }
});
```
`perm-hide-hero.ts:24–35` additionally shows per-question `customData` injection: `customDataByQuestion: { 'qu-opin-l5-1': { hero: '🗳️' } }`.

- **`show-feedback-survey`**: rename file + symbol; KEEP `header.showFeedback` (existing assertion stays valid — additive); ADD `results.showSurveyPopup=true`, `results.showFeedbackPopup`, `survey.showIn=['results']` to `settingsOverlay`.
- **`perm-access-disable`**: new `buildMinimal` template whose `settingsOverlay` can set `access.voterApp=false` / `access.candidateApp=false` / `access.underMaintenance=true` per sub-test (the three modes re-seed the singleton). Replaces `perm-disable-voter-app` + `perm-disable-candidate-app` templates.

---

### `packages/dev-seed/src/templates/index.ts` (MODIFY — registry, 3 edits per template)

**Analog:** the file itself. Each built-in ships THREE edits: (1) import, (2) `BUILT_IN_TEMPLATES` map entry, (3) re-export. Perm keys stay FLAT even though files live under `e2e/perm/`.

**Pattern (`index.ts:33 / 81 / 125` for `perm-hide-hero`):**
```ts
import { permHideHeroTemplate } from './e2e/perm/perm-hide-hero';        // (1) line 33
'perm-hide-hero': permHideHeroTemplate,                                  // (2) in BUILT_IN_TEMPLATES, line 81
export { permHideHeroTemplate } from './e2e/perm/perm-hide-hero';        // (3) re-export, line 125
```

**Registry edits for this phase:**
- ADD: `perm-question-video`, `perm-interactive-info`, `perm-org-matching`, `perm-access-disable` (3 edits each).
- RENAME: `perm-header-show-feedback` → `show-feedback-survey` — update import (line 28), map KEY+value (line 82), re-export (line 120). Also the inline comment cluster at lines 76–79.
- REMOVE: `perm-disable-voter-app` (lines 26, 64, 118) + `perm-disable-candidate-app` (lines 23, 65, 115) — only after verifying no setup/spec still imports the symbols (Pitfall 3; the spec/project/setup removal is the Phase-120 half).
- The dev-seed unit suite (`tests/templates/*.test.ts`) may assert template names — keep it green (SC4).

---

### `tests/tests/utils/voterNavigation.ts` (MODIFY — delete dead cluster)

**Analog:** the file itself. DELETE the 4-helper self-contained dead cluster — `walkToQuestion`, `waitForNextQuestion`, `clickThroughIntroPages`, `walkToQuestionsIntro` (grep-verified ZERO external callers; `walkToQuestion`→`walkToQuestionsIntro` is the only internal edge, so deleting all four leaves no dangling ref). **KEEP `navigateToFirstQuestion`** (live callers: `perm-hide-category-tags.spec.ts`, `perm-hide-election-tags.spec.ts`, `minimalVoterResultsPage.fixture.ts:53`). Also scrub the `--likert-only` NOTE comment. **Re-verify zero callers at execution time** (CONTEXT.md hard rule).

---

### `--likert-only` deletion (CLI surface)

**Analog:** the surgical line-anchored edits below (RESEARCH §Deletion Surface, all VERIFIED). Scrub ONLY `--likert-only` / `applyLikertOnlyFilter` / `LikertOnlyFilterStats` / `likertOnly` tokens — leave plain "Likert"/"likert5" question-name strings alone (Pitfall 4).

- `packages/dev-seed/src/cli/seed.ts`: remove import (line 34), the `'likert-only': { type: 'boolean' }` flag (line 65), the `if (values['likert-only'])` block (lines 85–98).
- `packages/dev-seed/src/cli/likert-only.ts` — DELETE; `tests/cli/likert-only.test.ts` — DELETE.
- `packages/dev-seed/src/cli/help.ts` — remove help line; `tests/cli/help.test.ts` — update expected text.
- `packages/dev-seed/src/index.ts` — remove `applyLikertOnlyFilter` export (line 50) + `LikertOnlyFilterStats` type export (line 74).
- `tests/tests/setup/shared/setupFromTemplate.ts` — drop the `likertOnly` "not supported" docstring paragraph.
- Docs: `CLAUDE.md` (the two `--likert-only` paragraphs + seeding-table row), `tests/README.md`. **`packages/dev-seed/README.md` has NOTHING to scrub** (its only "Likert" hit is a question-mix description — do not touch).
- **Do NOT touch** `packages/dev-seed/tests/templates/base.test.ts:95` (`qu-opin-base-1-likert5` is a question external_id).
- After: `yarn workspace @openvaa/dev-seed test:unit` green (dist rebuild is a no-op — runs from source via `tsx`).

---

### `packages/dev-seed/src/templates/default.ts` (MODIFY — UNBLK-03)

**Analog:** the file itself + the known-good `e2e/base` posture. The DB-write path is VALID today (RESEARCH §UNBLK-03 — 8 parties, 327 fully-answered candidates). Confirmed-broken part = STALE DOCSTRINGS only.

- REQUIRED: reconcile docstring counts (claims "13 constituencies / 100 candidates"; body emits 5 / 327).
- RECOMMENDED (defensive): set `entities.hideIfMissingAnswers.candidate:false` to match `e2e/base`.
- **SC3 GATE (running-app, NOT unit):** `yarn db:reset && yarn db:seed:default` → load app → select constituency → answer ≥5 → `/results` → confirm parties + candidates render. Only close UNBLK-03 after this passes (Pitfall 6). If still broken, bisect the frontend results path.

---

### Production `data-testid` additions

**Analog (keyed testid):** `Feedback.svelte` — `data-testid="feedback-rating-{value}"` (`:184`), root form `data-testid="feedback-form"` (`:158`). Mirror for per-argument / per-section / per-rating-style keyed ids.

- Declare EVERY new id in `testIds.ts` first (kebab-case, `testIds.<app>.<page>.<element>` — see existing nested map `testIds.ts:11–296`), then read via `getByTestId(testIds.…)`.
- `Video.svelte` root `<div>` (~655): a generic Video id. **Assert visibility, NOT mount/unmount** — `class:hidden={!hasContent}` means the element is hidden-not-destroyed (`expectVideo(true)` = `toBeVisible()`, `expectVideo(false)` = `not.toBeVisible()`). `Video.svelte` spreads `restProps` onto the root via `concatClass`, so a passed-through `data-testid` lands there.
- `QuestionExtendedInfoButton.svelte` info button renders only when `!customData.video` — the video and the popup-info-button are mutually exclusive per question.
- `EnumeratedEntityFilter.svelte` toggle (~221): id required; threshold `> 3` options (VERIFIED).

---

## Shared Patterns

### Composition root wiring (every voter-scoped fixture)
**Source:** `tests/tests/fixtures/voter/views.ts:37–68`
**Apply to:** any new VOTER-scoped fixture the specs destructure.
```ts
type ViewFixtures = { /* ...; newFixture: NewFixtureType */ };
export const test = base.extend<ViewFixtures>({
  entityFilters: async ({ page }, use) => { await use(createEntityFilters(page)); },
  // newFixture: async ({ page }, use) => { await use(createNewFixture(page)); },
});
export { expect };
```
Cross-app fixtures (`trackingIntercept`, `expectNavMenuItems`, dark-mode) register in the SHARED composition path, not here.

### testid-anchored reader factory (every new reader/helper)
**Source:** `tests/tests/fixtures/shared/feedbackDialog.fixture.ts:81–142`
**Apply to:** all new `expect*` readers.
```ts
export function createX(page: Page): XFixture {
  const el = page.getByTestId(testIds.<app>.<page>.<element>);
  return { async expectVisible() { await expect(el).toBeVisible(); } };
}
```

### Behaviour-via-testid + rigidity contract (A3)
**Source:** `entityFilters.fixture.ts:9–17` + `feedbackDialog.fixture.ts:26–38`
**Apply to:** ALL new fixtures/helpers. No raw `.locator()`/`getByText()` (rejected by `playwright/no-restricted-locators`); only `getByTestId`/`getByRole`. NO `expect.soft`, NO `try/catch` around `expect()`, NO `.catch(() => null)`. Gate: `yarn typecheck:tests` + the eslint locator guard.

### Settle-before-count for reactively-mounted options
**Source:** `entityFilters.fixture.ts:69–78`
**Apply to:** any helper reading a count after an Expander/reactive reveal.
```ts
await expect(options.first()).toBeVisible({ timeout: 5_000 });
const total = await options.count();
```

### Perm template prefix discipline
**Source:** `perm-2e-shared.ts:25` (`const P = 'e2e-perm-2e-shared-'`) + `perm-hide-hero.ts:22`
**Apply to:** every new perm template — own distinct `externalIdPrefix` for parallel-safety. Row `external_id`s bare; cross-refs prefixed via `${P}…`.

### Registry 3-edit rule
**Source:** `index.ts:33 / 81 / 125`
**Apply to:** every template add/rename — import + map entry + re-export, all in `index.ts`.

---

## No Analog Found

| File | Role | Reason | Planner guidance |
|------|------|--------|------------------|
| `tests/tests/specs/_probes/*.probe.spec.ts` | smoke/probe | No probe-spec convention exists yet (Wave 0 gap). | Establish a lightweight one (RESEARCH §Smoke/Probe): import `test` from `views.ts`, CLI-seed the relevant template (`yarn db:seed --template <name>`), drive the app, exercise the helper. Keep OUT of the perm serial chain; run in isolation (perm-singleton clobbers `app_settings`). Need not be deterministic-to-3× (that is the spec phases' bar) — pass cleanly once. |
| `trackingIntercept.fixture.ts` (mechanism) | fixture | `window.umami` `addInitScript` stub is a new mechanism (factory SHAPE has an analog). | Use the `feedbackDialog.fixture.ts` factory/interface shape + the RESEARCH §Tracking Emission Boundary recipe. |
| dark-mode `expectTheme` (mechanism) | helper | `page.emulateMedia({ colorScheme })` is new; there is NO toggle in the app (CONTEXT.md/CLAUDE.md "runeLocalStorage toggle" premise is WRONG — Pitfall 1). | NO toggle testid to add. Assert via `emulateMedia` + a rendered dark-mode CSS signal; "persisted across reload" is automatic. FLAG to planner so EFLOW-07's Phase-121 spec scope is corrected too. |

---

## Metadata

**Analog search scope:** `tests/tests/fixtures/{voter,shared}/`, `tests/tests/utils/`, `packages/dev-seed/src/templates/{e2e/perm,e2e/base,default,index}`, `packages/dev-seed/src/cli/`, `apps/frontend/src/lib/components/`.
**Files read this pass:** `views.ts`, `feedbackDialog.fixture.ts`, `entityFilters.fixture.ts`, `testIds.ts`, `perm-hide-hero.ts`, `perm-2e-shared.ts`, `perm-header-show-feedback.ts`, `index.ts`, `seed.ts` (excerpt). All other anchors carried from the VERIFIED RESEARCH file reads.
**Pattern extraction date:** 2026-06-14
