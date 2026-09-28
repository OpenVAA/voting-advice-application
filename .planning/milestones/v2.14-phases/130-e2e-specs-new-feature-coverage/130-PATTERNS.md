# Phase 130: E2E Specs — New-Feature Coverage - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 6 (2 new spec files + 1 new project-config block + 3 extended files: 2 specs, ≥2 fixtures)
**Analogs found:** 6 / 6 (all have strong in-repo analogs — pure test-authoring phase)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tests/specs/voter/voter-alliance.spec.ts` (NEW) | test (spec) | request-response (read-only UI assertion) | `tests/tests/specs/voter/voter-dark-mode.spec.ts` (leaf spec) + `voter-journey.spec.ts` D-10 alliance step | exact (role+flow) |
| `tests/tests/specs/voter/voter-nominations.spec.ts` (NEW) | test (spec) | request-response (read-only UI assertion) | `tests/tests/specs/voter/voter-dark-mode.spec.ts` (leaf spec) | exact (role+flow) |
| `tests/playwright.config.ts` — 2 new project entries (MODIFIED) | config | batch (serial project DAG) | `voter-dark-mode` / `voter-journey-mobile` project entries (lines 285–315) | exact |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts` — `answerNumberScale(question, value)` (MODIFIED, net-new fixture method) | fixture (page-object) | transform (input driver) | existing slider branch lines 379–388 (`Home`/`End` keyboard) | role-match (parametrize the extreme-only helper) |
| `tests/tests/utils/candidateJourneyConstants.ts` + candidate multipleText fill helper (MODIFIED) | fixture/const | transform (input driver) | `candidateProfilePage.fixture.ts:191 fillQuestion` + `INFO_QUESTION_ANSWERS` map | role-match |
| `tests/tests/specs/voter/voter-journey.spec.ts` + `candidate/candidate-journey.spec.ts` (MODIFIED — assertion depth) | test (spec) | request-response | in-file existing steps (self-analog) | exact |

## Pattern Assignments

### `tests/tests/specs/voter/voter-alliance.spec.ts` (NEW spec, request-response, read-only leaf)

**Analog:** `tests/tests/specs/voter/voter-dark-mode.spec.ts` (leaf shape) + fixture composition root `tests/tests/fixtures/voter/views.ts`

**Import + describe pattern** — leaf specs that need fixtures import `{ test, expect }` from the composition root (`views.ts`), NOT `@playwright/test` (dark-mode imports from `@playwright/test` only because it uses zero page-object fixtures). Since voter-alliance consumes `resultsPage`/`entityDetails`, import from `views.ts`:
```ts
import { test, expect } from '../../fixtures/voter/views';
import { testIds } from '../../utils/testIds';

test.describe('voter-alliance', () => {
  test('alliance card, member-orgs drawer, clickable children, tab control', async ({ page, resultsPage, entityDetails }) => {
    // ...
  });
});
```

**Rigidity contract** (copy verbatim from `voter-dark-mode.spec.ts:20-27`): every assertion HARD — no `expect.soft`, no try/catch around `expect()`, no `.catch` fallback on assertion-bearing interactions.

**Core assertion pattern** — reuse existing fixtures (RESEARCH Code Examples, verified present):
```ts
// EPERM-03 presence rider (first step, self-contained):
await resultsPage.selectEntityTab('alliances');
await expect(page.getByTestId(testIds.voter.results.allianceSection)).toBeVisible();

// in-card children (cardContents.alliance=['children'] → member-org subcards):
const allianceA = resultsPage.getEntityCards().filter({ hasText: /Alliance A/i }).first();
const memberSubcards = allianceA.getByTestId(testIds.voter.results.cardSubcard); // 'entity-card-subcard'

// EPERM-04 tab control — open drawer, assert EXACTLY ['info','children'] (NOT 'opinions'):
await resultsPage.openEntityDetailsForCard(allianceA);
await entityDetails.expectTabs(['info', 'children']);   // entityDetails.fixture.ts:89
await entityDetails.selectTab('children');              // entityDetails.fixture.ts:80
const members = entityDetails.getMemberCards();         // entityDetails.fixture.ts:174 → OR-AA / OR-AB
```

**Fixture surface reference** (all VERIFIED present, do not hand-roll):
- `resultsPage.selectEntityTab('cands'|'orgs'|'alliances')` — `resultsPage.fixture.ts:122`
- `resultsPage.getEntityCards()` — `:152`; `resultsPage.openEntityDetailsForCard(target)` — `:211`
- `entityDetails.expectTabs([...])` — asserts exact count + ordered accessible names (`:89-96`)
- `entityDetails.selectTab(...)` — clicks the tab by `TAB_LABELS` (`:80`)
- `entityDetails.getMemberCards()` — outer member cards under children tab (`:174`)

---

### `tests/tests/specs/voter/voter-nominations.spec.ts` (NEW spec, request-response, read-only leaf)

**Analog:** `tests/tests/specs/voter/voter-dark-mode.spec.ts`

Same leaf shape: `data-setup-base` read-only, HARD assertions. Navigate to `/nominations` and assert all-nominations entities render (present, not empty/broken). If it needs only `page` (no page-object), it MAY import `{ test, expect }` from `@playwright/test` like dark-mode; if it reaches `resultsPage`-style helpers, import from `views.ts`. Prefer the `views.ts` import for consistency with the alliance spec.

---

### `tests/playwright.config.ts` (MODIFIED — 2 new leaf-project entries)

**Analog:** `voter-dark-mode` project entry (`tests/playwright.config.ts:290-296`)

**Copy this exact shape** (per new file, scoped `testMatch`), placing both in the `=== base / voter-journey chain ===` region alongside `cold-entry-dataroot` / `voter-dark-mode`:
```ts
{
  name: 'voter-alliance',
  testDir: './tests/specs/voter',
  testMatch: /voter-alliance\.spec\.ts/,   // exact — voter-journey's testMatch excludes it
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-base']         // read-only; no own setup/teardown (D-04)
},
```
**CRITICAL (Pitfall 2):** a spec file with no matching project entry silently DOES NOT RUN → "did not run" = cardinal failure. Add the project entry in the SAME task that creates each file. Verify with `npx playwright test --list` that both new projects appear. `voter-journey`'s `testMatch` is `/voter-journey\.spec\.ts/` (exact) so it will not pick these up.

---

### `answerNumberScale(question, value)` net-new fixture (MODIFIED — `voter-journey.fixture.ts`)

**Analog:** the existing slider branch in `voter-journey.fixture.ts:379-388` (extreme-only `Home`/`End` keyed on `answerMode`).

**Pattern to generalize** — the existing branch only reaches min/max; parametrize to an arbitrary value using the D-03 keyboard contract (`Home` + N×`ArrowRight`, step=1):
```ts
// Contract: NumberScaleInput.svelte native <input type=range> step=1; Home→min, ArrowRight +1.
// Number inputs never auto-advance (129-06) → caller clicks Next explicitly.
async function answerNumberScale(page, question, value) {
  const slider = page.getByTestId(testIds.voter.questions.numberSlider).first(); // 'question-number-slider'
  await slider.focus();
  await slider.press('Home');
  const min = question.min ?? 0;
  for (let i = 0; i < value - min; i++) await slider.press('ArrowRight');
}
```
**Fixtures-first (SC4):** prove this with a smoke/probe BEFORE any boundary spec consumes it (Pitfall 3). Use `slider.focus()` + keyboard, never `fill()` (bypasses persist-on-release).

---

### Candidate multipleText fill + round-trip (MODIFIED — `candidateJourneyConstants.ts` + `candidateQuestionPage`/`candidateProfilePage`)

**Analog:** `candidateProfilePage.fixture.ts:191 fillQuestion(label, value)` + the `INFO_QUESTION_ANSWERS` map in `candidateJourneyConstants.ts`.

**Net-new (EQTYP-03, deliberately unbuilt per the `:78` comment):**
1. Add a candidate row-list fill helper against the `MultipleTextInput` testids (VERIFIED registered `testIds.ts:197-201`): `multiple-text-add`, `multiple-text-row`, `multiple-text-remove`, `multiple-text-move-up/-down`. Pattern: click `multipleTextAdd` per value, fill each `multipleTextRow` input (≥2 values).
2. Add the `test-qu-info-multipleText` entry to the fill map (currently intentionally omitted — remove the omission comment block at `candidateJourneyConstants.ts:~73`).
3. Assert values round-trip in preview via `candidatePreviewPage.expectInfoAnswer` (analog: existing `[qu-info-text]` bio round-trip already covered in candidate-journey).

---

### `voter-journey.spec.ts` + `candidate-journey.spec.ts` (MODIFIED — assertion depth only)

**Analog:** in-file existing steps (self-analog). Semantic `test.step(...)` blocks describing WHAT is asserted.

- **EQTYP-01 matching + drawer** (voter-journey results step): open an entity drawer → `entityDetails.selectTab('opinions')` → `entityDetails.expectQuestionDisplay(/Base opinion 7 — Multi-choice/i, { numSelected, voterAnswer, entityAnswer })` (`entityDetails.fixture.ts:132`).
- **EQTYP-02 boundary** (voter-journey): assert min-voter → min-candidate (POLAR_MIN) ranks above POLAR_MAX; one mid value → intermediate ranking (use the new `answerNumberScale`). Keep isolated so it does not perturb existing ranking assertions.
- **D-02 tightening** (candidate-journey, SAME spec region as new multi-choice assertions — do NOT sprawl): tighten existing categorical + boolean opinion assertions from generic (`selectChoice`+continue) to type-specific.
- **EQTYP-03 candidate round-trip** (candidate-journey ~line 538): currently only asserts multipleText is *rendered* — add fill + preview round-trip.

**Anti-pattern (do NOT):** re-baseline the rigid counts 129-08 already set (score-gauge=4, category-checkboxes=5, delete-boundary=3); duplicate the D-10 alliance-presence assertion verbatim without adding depth; re-author the answering walk / 13→14 flip (already done in 129).

## Shared Patterns

### Leaf-project wiring (read-only)
**Source:** `tests/playwright.config.ts:290-296` (voter-dark-mode)
**Apply to:** both new spec files
Each new read-only spec = one Playwright project with a scoped `testMatch` + `dependencies: ['data-setup-base']` and NO own setup/teardown pair (Alliance A + nominations already in `e2e/base`, D-04). Verify via `--list`.

### Rigidity contract (E2E Hard Rule)
**Source:** `voter-dark-mode.spec.ts:20-27`, `voterQuestionsPage.fixture.ts:18-21`
**Apply to:** all new specs + fixtures
No `expect.soft`, no try/catch wrapping `expect()`, no `.catch(() => null)` on assertion-bearing locator interactions. Any failing OR did-not-run test blocks completion (D-05).

### Fixture reuse via composition root
**Source:** `tests/tests/fixtures/voter/views.ts` (`base.extend` exposing `resultsPage`, `entityDetails`, `voterHomePage`, `voterIntroPage`, `voterQuestionsPage`)
**Apply to:** voter-alliance.spec.ts (and voter-nominations if it needs page objects)
Import `{ test, expect }` from `views.ts`; destructure fixtures from the test callback arg. Do NOT hand-roll `getByTestId` for capabilities the fixtures already cover.

### Selector catalogue (no inline literals)
**Source:** `tests/tests/utils/testIds.ts` (all 8 new-feature locators registered 129-07; VERIFIED: `numberSlider:195`, `multipleText*:197-201`, `allianceSection:249`, `cardSubcard:276`)
**Apply to:** all new specs + fixtures — reference `testIds.*` constants, never raw string literals (prevents selector drift).

### Fixtures-first within the phase (SC4)
**Source:** existing slider branch `voter-journey.fixture.ts:379-388`
**Apply to:** `answerNumberScale` + candidate `answerMultipleText` — build, typecheck-clean, prove by smoke/probe BEFORE any spec consumes it.

## No Analog Found

None. Every file has a strong in-repo analog — this is a pure test-authoring phase on installed `@playwright/test` + complete in-repo fixture/locator/seed substrate.

## Metadata

**Analog search scope:** `tests/tests/specs/voter`, `tests/tests/specs/candidate`, `tests/tests/fixtures/voter`, `tests/tests/fixtures/candidate`, `tests/tests/utils`, `tests/playwright.config.ts`
**Files scanned:** ~12 (specs, fixtures, config, testIds, constants)
**Pattern extraction date:** 2026-07-19
